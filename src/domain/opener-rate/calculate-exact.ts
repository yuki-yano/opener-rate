import type { CalculateOutput } from "../../shared/apiSchemas";
import type {
  CompiledPattern,
  CompiledSubPattern,
  NormalizedDeck,
} from "./types";
import { evaluatePatterns } from "./evaluate-pattern";
import { evaluateSubPatterns } from "./evaluate-sub-pattern";

const combinationMemo = new Map<string, bigint>();

const combinations = (n: number, k: number): bigint => {
  if (k < 0 || k > n) return 0n;
  if (k === 0 || k === n) return 1n;

  const normalizedK = k > n / 2 ? n - k : k;
  const key = `${n}:${normalizedK}`;
  const memoized = combinationMemo.get(key);
  if (memoized != null) return memoized;

  let result = 1n;
  for (let i = 1; i <= normalizedK; i += 1) {
    result = (result * BigInt(n - i + 1)) / BigInt(i);
  }
  combinationMemo.set(key, result);
  return result;
};

const toRateString = (success: bigint, total: bigint) => {
  if (total <= 0n) return "0.00";
  const scaled = (success * 10000n) / total;
  return (Number(scaled) / 100).toFixed(2);
};

const collectCountablePatternEffects = (
  matchedPatternUids: string[],
  compiledPatternByUid: Map<string, CompiledPattern>,
) => {
  const countableMatchedPatternUids: string[] = [];
  const countableMatchedLabelUids = new Set<string>();
  const penetrationByDisruptionKey: Record<string, number> = {};

  for (const patternUid of matchedPatternUids) {
    const pattern = compiledPatternByUid.get(patternUid);
    if (pattern == null) continue;
    if (pattern.excludeFromOverall) continue;

    countableMatchedPatternUids.push(patternUid);
    for (const label of pattern.labels) {
      countableMatchedLabelUids.add(label.uid);
    }
    for (const effect of pattern.effects ?? []) {
      if (effect.type === "add_label") {
        for (const labelUid of effect.labelUids) {
          countableMatchedLabelUids.add(labelUid);
        }
        continue;
      }
      for (const disruptionCategoryUid of effect.disruptionCategoryUids) {
        const current = penetrationByDisruptionKey[disruptionCategoryUid] ?? 0;
        penetrationByDisruptionKey[disruptionCategoryUid] =
          current + effect.amount;
      }
    }
  }

  return {
    countableMatchedPatternUids,
    countableMatchedLabelUids,
    penetrationByDisruptionKey,
  };
};

export const calculateByExact = (params: {
  normalized: NormalizedDeck;
  compiledPatterns: CompiledPattern[];
  compiledSubPatterns: CompiledSubPattern[];
}): CalculateOutput => {
  const { normalized, compiledPatterns, compiledSubPatterns } = params;

  const totalKinds = normalized.deckCounts.length;
  const handCounts = new Array(totalKinds).fill(0);
  const nonZeroIndices = normalized.deckCounts
    .map((count, index) => ({ count, index }))
    .filter((entry) => entry.count > 0)
    .map((entry) => entry.index);

  const patternOrder = normalized.patterns.map((pattern) => pattern.uid);
  const compiledPatternByUid = new Map(
    compiledPatterns.map((pattern) => [pattern.uid, pattern]),
  );
  const labelOrder = normalized.labels.map((label) => label.uid);
  const patternIndexByUid = new Map(
    patternOrder.map((uid, index) => [uid, index]),
  );
  const labelIndexByUid = new Map(labelOrder.map((uid, index) => [uid, index]));

  let totalCombinations = 0n;
  let overallSuccess = 0n;
  const patternSuccess = new Array<bigint>(patternOrder.length).fill(0n);
  const labelSuccess = new Array<bigint>(labelOrder.length).fill(0n);

  const recurse = (
    cursor: number,
    remainingSlots: number,
    weight: bigint,
  ): void => {
    if (remainingSlots === 0) {
      const deckCounts = normalized.deckCounts.map(
        (deckCount, index) => deckCount - (handCounts[index] ?? 0),
      );
      const evaluation = evaluatePatterns(compiledPatterns, {
        handCounts,
        deckCounts,
      });
      const subPatternEvaluation = evaluateSubPatterns({
        compiledSubPatterns,
        context: { handCounts, deckCounts },
        matchedPatternUids: evaluation.matchedPatternUids,
        matchedCardCountsByPatternUid: evaluation.matchedCardCountsByPatternUid,
      });
      const countablePatternEffects = collectCountablePatternEffects(
        evaluation.matchedPatternUids,
        compiledPatternByUid,
      );
      const countableSubPatternEvaluation = evaluateSubPatterns({
        compiledSubPatterns,
        context: { handCounts, deckCounts },
        matchedPatternUids: countablePatternEffects.countableMatchedPatternUids,
        matchedCardCountsByPatternUid: evaluation.matchedCardCountsByPatternUid,
      });
      const matchedLabelUids = new Set([
        ...evaluation.matchedLabelUids,
        ...subPatternEvaluation.addedLabelUids,
      ]);
      const countableMatchedLabelUids = new Set([
        ...countablePatternEffects.countableMatchedLabelUids,
        ...countableSubPatternEvaluation.addedLabelUids,
      ]);
      totalCombinations += weight;
      if (
        countablePatternEffects.countableMatchedPatternUids.length > 0 ||
        countableMatchedLabelUids.size > 0
      ) {
        overallSuccess += weight;
      }
      for (const patternUid of evaluation.matchedPatternUids) {
        const index = patternIndexByUid.get(patternUid);
        if (index == null) continue;
        patternSuccess[index] += weight;
      }
      for (const labelUid of matchedLabelUids) {
        const index = labelIndexByUid.get(labelUid);
        if (index == null) continue;
        labelSuccess[index] += weight;
      }
      return;
    }

    if (cursor >= nonZeroIndices.length) {
      return;
    }

    const currentIndex = nonZeroIndices[cursor];
    const availableCount = normalized.deckCounts[currentIndex] ?? 0;
    const maxTake = Math.min(availableCount, remainingSlots);

    for (let take = 0; take <= maxTake; take += 1) {
      handCounts[currentIndex] = take;
      const comb = combinations(availableCount, take);
      if (comb > 0n) {
        recurse(cursor + 1, remainingSlots - take, weight * comb);
      }
    }

    handCounts[currentIndex] = 0;
  };

  recurse(0, normalized.deck.firstHand, 1n);

  return {
    overallProbability: toRateString(overallSuccess, totalCombinations),
    patternSuccessRates: patternOrder.map((uid, index) => ({
      uid,
      rate: toRateString(patternSuccess[index] ?? 0n, totalCombinations),
    })),
    labelSuccessRates: labelOrder.map((uid, index) => ({
      uid,
      rate: toRateString(labelSuccess[index] ?? 0n, totalCombinations),
    })),
    mode: "exact",
  };
};
