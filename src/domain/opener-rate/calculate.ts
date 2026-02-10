import type { CalculateInput, CalculateOutput } from "../../shared/apiSchemas";
import { calculateByExact } from "./calculate-exact";
import { calculateBySimulation } from "./calculate-simulation";
import { compilePatterns } from "./compile-conditions";
import { compileSubPatterns } from "./compile-sub-patterns";
import { normalizeCalculateInput } from "./normalize";

const createCardCountExceededOutput = (
  input: CalculateInput,
  error: { deckSize: number; totalCards: number; excess: number },
): CalculateOutput => ({
  overallProbability: "0.00",
  patternSuccessRates: input.patterns.map((pattern) => ({
    uid: pattern.uid,
    rate: "0.00",
  })),
  labelSuccessRates: input.labels.map((label) => ({
    uid: label.uid,
    rate: "0.00",
  })),
  mode: input.settings.mode,
  error: {
    type: "card_count_exceeded",
    deckSize: error.deckSize,
    totalCards: error.totalCards,
    excess: error.excess,
  },
});

const hasPot = (input: CalculateInput) =>
  input.pot.desiresOrExtravagance.count > 0 || input.pot.prosperity.count > 0;
const hasVsSimulation = (input: CalculateInput) => input.vs?.enabled === true;

export const calculateOpenerRateDomain = (
  input: CalculateInput,
): CalculateOutput => {
  const normalized = normalizeCalculateInput(input);
  if (!normalized.ok) {
    return createCardCountExceededOutput(input, normalized.error);
  }

  const compiledPatterns = compilePatterns(normalized.value);
  const compiledSubPatterns = compileSubPatterns(normalized.value);

  if (
    input.settings.mode === "exact" &&
    (hasPot(input) || hasVsSimulation(input))
  ) {
    return calculateBySimulation({
      normalized: normalized.value,
      compiledPatterns,
      compiledSubPatterns,
      trials: input.settings.simulationTrials,
      mode: "simulation",
    });
  }

  if (input.settings.mode === "simulation") {
    return calculateBySimulation({
      normalized: normalized.value,
      compiledPatterns,
      compiledSubPatterns,
      trials: input.settings.simulationTrials,
      mode: "simulation",
    });
  }

  return calculateByExact({
    normalized: normalized.value,
    compiledPatterns,
    compiledSubPatterns,
  });
};
