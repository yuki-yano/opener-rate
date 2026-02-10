import type { CalculateOutput } from "../../shared/apiSchemas";
import type { CompiledPattern, NormalizedDeck } from "./types";
import { evaluatePatterns } from "./evaluate-pattern";

const toRateString = (successCount: number, total: number) => {
  if (total <= 0) return "0.00";
  return ((successCount / total) * 100).toFixed(2);
};

const scoreEvaluation = (evaluation: ReturnType<typeof evaluatePatterns>) =>
  (evaluation.isSuccess ? 1_000_000 : 0) +
  evaluation.matchedPatternUids.length * 1000 +
  evaluation.matchedLabelUids.length;

const createDeckOrder = (deckCounts: number[]) => {
  const deckOrder: number[] = [];
  for (let cardIndex = 0; cardIndex < deckCounts.length; cardIndex += 1) {
    const count = deckCounts[cardIndex] ?? 0;
    for (let i = 0; i < count; i += 1) {
      deckOrder.push(cardIndex);
    }
  }
  return deckOrder;
};

const shuffle = (array: number[]) => {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
};

const runPotResolution = (
  normalized: NormalizedDeck,
  compiledPatterns: CompiledPattern[],
  handCounts: number[],
  deckCounts: number[],
  remainingDeckOrder: number[],
) => {
  const prosperityIndex = normalized.prosperityIndex;
  const desiresIndex = normalized.desiresIndex;

  if (
    prosperityIndex != null &&
    (handCounts[prosperityIndex] ?? 0) > 0 &&
    normalized.pot.prosperity.count > 0
  ) {
    handCounts[prosperityIndex] -= 1;
    const cost = normalized.pot.prosperity.cost;
    const revealed = remainingDeckOrder.slice(0, cost);
    if (revealed.length >= cost) {
      let bestRevealPosition = 0;
      let bestScore = -1;

      for (
        let revealPosition = 0;
        revealPosition < revealed.length;
        revealPosition += 1
      ) {
        const selectedIndex = revealed[revealPosition];
        const candidateHand = handCounts.slice();
        const candidateDeck = deckCounts.slice();
        candidateHand[selectedIndex] += 1;
        candidateDeck[selectedIndex] -= 1;

        const evaluation = evaluatePatterns(compiledPatterns, {
          handCounts: candidateHand,
          deckCounts: candidateDeck,
        });
        const score = scoreEvaluation(evaluation);
        if (score > bestScore) {
          bestScore = score;
          bestRevealPosition = revealPosition;
        }
      }

      const selected = revealed[bestRevealPosition];
      handCounts[selected] += 1;
      deckCounts[selected] -= 1;

      const remained = remainingDeckOrder.slice(cost);
      const backToBottom = revealed.filter(
        (_, index) => index !== bestRevealPosition,
      );
      remainingDeckOrder.splice(
        0,
        remainingDeckOrder.length,
        ...remained,
        ...backToBottom,
      );
    }
    return;
  }

  if (
    desiresIndex != null &&
    (handCounts[desiresIndex] ?? 0) > 0 &&
    normalized.pot.desiresOrExtravagance.count > 0
  ) {
    const drawCount = Math.min(2, remainingDeckOrder.length);
    for (let i = 0; i < drawCount; i += 1) {
      const drawn = remainingDeckOrder[i];
      handCounts[drawn] += 1;
      deckCounts[drawn] -= 1;
    }
    remainingDeckOrder.splice(0, drawCount);
  }
};

export const calculateBySimulation = (params: {
  normalized: NormalizedDeck;
  compiledPatterns: CompiledPattern[];
  trials: number;
  mode?: CalculateOutput["mode"];
}): CalculateOutput => {
  const { normalized, compiledPatterns, trials } = params;
  const mode = params.mode ?? "simulation";

  const deckOrderTemplate = createDeckOrder(normalized.deckCounts);

  const labelOrder = normalized.labels.map((label) => label.uid);
  const patternOrder = normalized.patterns.map((pattern) => pattern.uid);
  const labelIndexByUid = new Map(labelOrder.map((uid, index) => [uid, index]));
  const patternIndexByUid = new Map(
    patternOrder.map((uid, index) => [uid, index]),
  );

  let overallSuccessCount = 0;
  const labelSuccessCount = new Array(labelOrder.length).fill(0);
  const patternSuccessCount = new Array(patternOrder.length).fill(0);

  for (let trial = 0; trial < trials; trial += 1) {
    const deckOrder = deckOrderTemplate.slice();
    shuffle(deckOrder);

    const handCounts = new Array(normalized.deckCounts.length).fill(0);
    const deckCounts = normalized.deckCounts.slice();

    for (let i = 0; i < normalized.deck.firstHand; i += 1) {
      const drawn = deckOrder[i];
      handCounts[drawn] += 1;
      deckCounts[drawn] -= 1;
    }

    const remainingDeckOrder = deckOrder.slice(normalized.deck.firstHand);
    runPotResolution(
      normalized,
      compiledPatterns,
      handCounts,
      deckCounts,
      remainingDeckOrder,
    );

    const evaluation = evaluatePatterns(compiledPatterns, {
      handCounts,
      deckCounts,
    });
    if (evaluation.isSuccess) {
      overallSuccessCount += 1;
    }
    for (const patternUid of evaluation.matchedPatternUids) {
      const index = patternIndexByUid.get(patternUid);
      if (index == null) continue;
      patternSuccessCount[index] += 1;
    }
    for (const labelUid of evaluation.matchedLabelUids) {
      const index = labelIndexByUid.get(labelUid);
      if (index == null) continue;
      labelSuccessCount[index] += 1;
    }
  }

  return {
    overallProbability: toRateString(overallSuccessCount, trials),
    patternSuccessRates: patternOrder.map((uid, index) => ({
      uid,
      rate: toRateString(patternSuccessCount[index] ?? 0, trials),
    })),
    labelSuccessRates: labelOrder.map((uid, index) => ({
      uid,
      rate: toRateString(labelSuccessCount[index] ?? 0, trials),
    })),
    mode,
  };
};
