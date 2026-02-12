import { evaluateCompiledConditions } from "./evaluate-pattern";
import type {
  CompiledBaseMatchCountCondition,
  CompiledPatternCondition,
  CompiledSubPattern,
  EvaluationContext,
  SubPatternEvaluationResult,
} from "./types";

type EvaluateSubPatternsParams = {
  compiledSubPatterns: CompiledSubPattern[];
  context: EvaluationContext;
  matchedPatternUids: string[];
  matchedCardCountsByPatternUid?: Record<string, Record<number, number>>;
};

const resolveApplyCount = (
  subPattern: CompiledSubPattern,
  context: EvaluationContext,
) => {
  if (subPattern.applyLimit === "once_per_trial") {
    return 1;
  }

  if (subPattern.triggerSourceIndices.length === 0) {
    if (subPattern.hasTriggerSourceUids === true) {
      return 0;
    }
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

const checkBaseMatchCountCondition = (
  condition: CompiledBaseMatchCountCondition,
  matchedCardCounts: Record<number, number>,
) => {
  const total = condition.rules.reduce((acc, rule) => {
    const raw = rule.indices.reduce(
      (sum, index) => sum + (matchedCardCounts[index] ?? 0),
      0,
    );
    if (rule.mode === "cap1") return acc + Math.min(raw, 1);
    return acc + raw;
  }, 0);

  if (condition.operator === "eq") {
    return total === condition.threshold;
  }
  return total >= condition.threshold;
};

const canApplyByBaseMatchedCards = (params: {
  subPattern: CompiledSubPattern;
  matchedPatternUids: string[];
  matchedCardCountsByPatternUid: Record<string, Record<number, number>>;
  context: EvaluationContext;
}) => {
  const {
    subPattern,
    matchedPatternUids,
    matchedCardCountsByPatternUid,
    context,
  } = params;
  const baseMatchConditions: CompiledBaseMatchCountCondition[] = [];
  const regularConditions: CompiledPatternCondition[] = [];

  for (const condition of subPattern.triggerConditions) {
    if (condition.mode === "base_match_total") {
      baseMatchConditions.push(condition);
      continue;
    }
    regularConditions.push(condition);
  }

  const targetPatternUids =
    subPattern.basePatternUids.length > 0
      ? matchedPatternUids.filter((uid) =>
          subPattern.basePatternUids.includes(uid),
        )
      : matchedPatternUids;

  if (baseMatchConditions.length === 0) {
    return {
      canApply: true,
      regularConditions,
    };
  }

  const hasMatchedPatternWithSatisfiedCards = targetPatternUids.some((uid) => {
    const matchedCardCounts = matchedCardCountsByPatternUid[uid] ?? {};
    const resolvedMatchedCardCounts =
      Object.keys(matchedCardCounts).length > 0
        ? matchedCardCounts
        : baseMatchConditions
            .flatMap((condition) => condition.rules)
            .flatMap((rule) => rule.indices)
            .reduce<Record<number, number>>((acc, index) => {
              const count = context.handCounts[index] ?? 0;
              if (count > 0) {
                acc[index] = count;
              }
              return acc;
            }, {});
    return baseMatchConditions.every((condition) =>
      checkBaseMatchCountCondition(condition, resolvedMatchedCardCounts),
    );
  });

  return {
    canApply: hasMatchedPatternWithSatisfiedCards,
    regularConditions,
  };
};

export const evaluateSubPatterns = (
  params: EvaluateSubPatternsParams,
): SubPatternEvaluationResult => {
  const {
    compiledSubPatterns,
    context,
    matchedPatternUids,
    matchedCardCountsByPatternUid = {},
  } = params;
  const matchedPatternSet = new Set(matchedPatternUids);
  const labelSet = new Set<string>();
  const penetrationByDisruptionKey: Record<string, number> = {};

  for (const subPattern of compiledSubPatterns) {
    if (!subPattern.active) continue;
    if (!canApplyByBasePattern(subPattern, matchedPatternSet)) continue;
    const baseMatchCheck = canApplyByBaseMatchedCards({
      subPattern,
      matchedPatternUids,
      matchedCardCountsByPatternUid,
      context,
    });
    if (!baseMatchCheck.canApply) continue;
    if (
      !evaluateCompiledConditions(baseMatchCheck.regularConditions, context)
    ) {
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

      for (const disruptionCategoryUid of effect.disruptionCategoryUids) {
        const current = penetrationByDisruptionKey[disruptionCategoryUid] ?? 0;
        const next = current + effect.amount * applyCount;
        penetrationByDisruptionKey[disruptionCategoryUid] = next;
      }
    }
  }

  return {
    addedLabelUids: Array.from(labelSet),
    penetrationByDisruptionKey,
  };
};
