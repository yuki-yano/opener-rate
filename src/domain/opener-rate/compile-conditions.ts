import type { PatternCondition } from "../../shared/apiSchemas";
import type {
  CompiledCountRule,
  CompiledPattern,
  CompiledPatternCondition,
  NormalizedDeck,
} from "./types";

const isCountCondition = (
  condition: PatternCondition,
): condition is Extract<
  PatternCondition,
  { mode: "draw_total" | "remain_total" }
> => condition.mode === "draw_total" || condition.mode === "remain_total";

const toIndices = (uidToIndex: Map<string, number>, uids: string[]) => {
  const indices: number[] = [];
  for (const uid of uids) {
    const index = uidToIndex.get(uid);
    if (index == null) continue;
    indices.push(index);
  }
  return indices;
};

const compileCountRules = (
  uidToIndex: Map<string, number>,
  condition: Extract<PatternCondition, { mode: "draw_total" | "remain_total" }>,
): CompiledCountRule[] =>
  condition.rules.map((rule) => ({
    mode: rule.mode,
    indices: toIndices(uidToIndex, rule.uids),
  }));

const compileCondition = (
  uidToIndex: Map<string, number>,
  condition: PatternCondition,
): CompiledPatternCondition => {
  if (isCountCondition(condition)) {
    return {
      ...condition,
      rules: compileCountRules(uidToIndex, condition),
    };
  }

  return {
    ...condition,
    indices: toIndices(uidToIndex, condition.uids),
  };
};

export const compilePatterns = (
  normalized: NormalizedDeck,
): CompiledPattern[] => {
  return normalized.patterns.map((pattern) => ({
    ...pattern,
    conditions: pattern.conditions.map((condition) =>
      compileCondition(normalized.uidToIndex, condition),
    ),
  }));
};
