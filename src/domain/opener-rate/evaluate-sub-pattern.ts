import { evaluateCompiledConditions } from "./evaluate-pattern";
import type {
  CompiledSubPattern,
  EvaluationContext,
  SubPatternEvaluationResult,
} from "./types";

type EvaluateSubPatternsParams = {
  compiledSubPatterns: CompiledSubPattern[];
  context: EvaluationContext;
  matchedPatternUids: string[];
};

const resolveApplyCount = (
  subPattern: CompiledSubPattern,
  context: EvaluationContext,
) => {
  if (subPattern.applyLimit === "once_per_trial") {
    return 1;
  }

  if (subPattern.triggerSourceIndices.length === 0) {
    return 1;
  }

  return subPattern.triggerSourceIndices.reduce((count, index) => {
    if ((context.handCounts[index] ?? 0) > 0) {
      return count + 1;
    }
    return count;
  }, 0);
};

const canApplyByBasePattern = (
  subPattern: CompiledSubPattern,
  matchedPatternSet: Set<string>,
) => {
  if (subPattern.basePatternUids.length === 0) {
    return matchedPatternSet.size > 0;
  }

  return subPattern.basePatternUids.some((uid) => matchedPatternSet.has(uid));
};

export const evaluateSubPatterns = (
  params: EvaluateSubPatternsParams,
): SubPatternEvaluationResult => {
  const { compiledSubPatterns, context, matchedPatternUids } = params;
  const matchedPatternSet = new Set(matchedPatternUids);
  const labelSet = new Set<string>();
  const penetrationByDisruptionKey: Record<string, number> = {};

  for (const subPattern of compiledSubPatterns) {
    if (!subPattern.active) continue;
    if (!canApplyByBasePattern(subPattern, matchedPatternSet)) continue;
    if (!evaluateCompiledConditions(subPattern.triggerConditions, context)) {
      continue;
    }

    const applyCount = resolveApplyCount(subPattern, context);
    if (applyCount <= 0) continue;

    for (const effect of subPattern.effects) {
      if (effect.type === "add_label") {
        for (const labelUid of effect.labelUids) {
          labelSet.add(labelUid);
        }
        continue;
      }

      for (const disruptionCardUid of effect.disruptionCardUids) {
        const current =
          penetrationByDisruptionKey[disruptionCardUid] ?? 0;
        const next = current + effect.amount * applyCount;
        penetrationByDisruptionKey[disruptionCardUid] = next;
      }
    }
  }

  return {
    addedLabelUids: Array.from(labelSet),
    penetrationByDisruptionKey,
  };
};
