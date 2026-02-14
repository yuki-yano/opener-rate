import { evaluatePatterns } from "./evaluate-pattern";
import { evaluateSubPatterns } from "./evaluate-sub-pattern";
import type {
  CompiledPattern,
  CompiledSubPattern,
  PenetrationEffect,
} from "./types";

export const collectCountablePatternEffects = (
  matchedPatternUids: string[],
  compiledPatternByUid: Map<string, CompiledPattern>,
) => {
  const countableMatchedPatternUids: string[] = [];
  const countableMatchedLabelUids = new Set<string>();
  const penetrationByDisruptionKey: Record<string, number> = {};
  const penetrationEffects: PenetrationEffect[] = [];

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
      if (effect.amount > 0 && effect.disruptionCategoryUids.length > 0) {
        penetrationEffects.push({
          disruptionCategoryUids: [...effect.disruptionCategoryUids],
          amount: effect.amount,
          poolId: effect.poolId,
        });
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
    penetrationEffects,
  };
};

export const evaluateMatchedOutcome = (params: {
  evaluation: ReturnType<typeof evaluatePatterns>;
  compiledPatternByUid: Map<string, CompiledPattern>;
  compiledSubPatterns: CompiledSubPattern[];
  handCounts: number[];
  deckCounts: number[];
}) => {
  const {
    evaluation,
    compiledPatternByUid,
    compiledSubPatterns,
    handCounts,
    deckCounts,
  } = params;
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
  const baseSuccess =
    countablePatternEffects.countableMatchedPatternUids.length > 0 ||
    countableMatchedLabelUids.size > 0;

  return {
    baseSuccess,
    countableMatchedLabelUids,
    countablePatternEffects,
    countableSubPatternEvaluation,
    matchedLabelUids,
    subPatternEvaluation,
  };
};

export const evaluateTrialOutcome = (params: {
  compiledPatterns: CompiledPattern[];
  compiledPatternByUid: Map<string, CompiledPattern>;
  compiledSubPatterns: CompiledSubPattern[];
  handCounts: number[];
  deckCounts: number[];
}) => {
  const {
    compiledPatterns,
    compiledPatternByUid,
    compiledSubPatterns,
    handCounts,
    deckCounts,
  } = params;
  const evaluation = evaluatePatterns(compiledPatterns, {
    handCounts,
    deckCounts,
  });

  return {
    evaluation,
    ...evaluateMatchedOutcome({
      evaluation,
      compiledPatternByUid,
      compiledSubPatterns,
      handCounts,
      deckCounts,
    }),
  };
};

export const toRateStringFromNumber = (successCount: number, total: number) => {
  if (total <= 0) return "0.00";
  return ((successCount / total) * 100).toFixed(2);
};

export const toRateStringFromBigInt = (success: bigint, total: bigint) => {
  if (total <= 0n) return "0.00";
  const scaled = (success * 10000n) / total;
  return (Number(scaled) / 100).toFixed(2);
};
