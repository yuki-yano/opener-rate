import { evaluateCompiledConditions } from "./evaluate-pattern";
import type {
  CompiledBaseMatchCountCondition,
  CompiledPatternCondition,
  CompiledSubPattern,
  EvaluationContext,
  PenetrationEffect,
  SubPatternEvaluationResult,
} from "./types";

type EvaluateSubPatternsParams = {
  compiledSubPatterns: CompiledSubPattern[];
  context: EvaluationContext;
  matchedPatternUids: string[];
  matchedCardCountsByPatternUid?: Record<string, Record<number, number>>;
};

type PreparedSubPattern = {
  regularConditions: CompiledPatternCondition[];
  baseMatchConditions: CompiledBaseMatchCountCondition[];
  basePatternUidSet: Set<string> | null;
};

const preparedSubPatternCache = new WeakMap<
  CompiledSubPattern,
  PreparedSubPattern
>();

const prepareSubPattern = (
  subPattern: CompiledSubPattern,
): PreparedSubPattern => {
  const cached = preparedSubPatternCache.get(subPattern);
  if (cached != null) return cached;

  const baseMatchConditions: CompiledBaseMatchCountCondition[] = [];
  const regularConditions: CompiledPatternCondition[] = [];
  for (const condition of subPattern.triggerConditions) {
    if (condition.mode === "base_match_total") {
      baseMatchConditions.push(condition);
      continue;
    }
    regularConditions.push(condition);
  }

  const prepared: PreparedSubPattern = {
    regularConditions,
    baseMatchConditions,
    basePatternUidSet:
      subPattern.basePatternUids.length > 0
        ? new Set(subPattern.basePatternUids)
        : null,
  };
  preparedSubPatternCache.set(subPattern, prepared);
  return prepared;
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

  let count = 0;
  for (const index of subPattern.triggerSourceIndices) {
    if ((context.handCounts[index] ?? 0) > 0) {
      count += 1;
    }
  }
  return count;
};

const canApplyByBasePattern = (
  preparedSubPattern: PreparedSubPattern,
  matchedPatternSet: Set<string>,
) => {
  if (preparedSubPattern.basePatternUidSet == null) {
    return matchedPatternSet.size > 0;
  }

  for (const uid of preparedSubPattern.basePatternUidSet) {
    if (matchedPatternSet.has(uid)) return true;
  }
  return false;
};

const checkBaseMatchCountCondition = (
  condition: CompiledBaseMatchCountCondition,
  sourceCounts: Record<number, number> | number[],
) => {
  let total = 0;
  for (const rule of condition.rules) {
    let raw = 0;
    for (const index of rule.indices) {
      raw += sourceCounts[index] ?? 0;
    }
    if (rule.mode === "cap1") {
      total += Math.min(raw, 1);
      continue;
    }
    total += raw;
  }

  if (condition.operator === "eq") {
    return total === condition.threshold;
  }
  return total >= condition.threshold;
};

const hasAnyMatchedCardCount = (
  matchedCardCounts: Record<number, number> | undefined,
) => {
  if (matchedCardCounts == null) return false;
  for (const _ in matchedCardCounts) {
    return true;
  }
  return false;
};

const canApplyByBaseMatchedCards = (params: {
  preparedSubPattern: PreparedSubPattern;
  matchedPatternUids: string[];
  matchedCardCountsByPatternUid: Record<string, Record<number, number>>;
  context: EvaluationContext;
}) => {
  const {
    preparedSubPattern,
    matchedPatternUids,
    matchedCardCountsByPatternUid,
    context,
  } = params;
  const { baseMatchConditions, basePatternUidSet } = preparedSubPattern;
  if (baseMatchConditions.length === 0) return true;

  for (const uid of matchedPatternUids) {
    if (basePatternUidSet != null && !basePatternUidSet.has(uid)) {
      continue;
    }
    const matchedCardCounts = matchedCardCountsByPatternUid[uid];
    const sourceCounts = hasAnyMatchedCardCount(matchedCardCounts)
      ? matchedCardCounts
      : context.handCounts;
    let isSatisfied = true;
    for (const condition of baseMatchConditions) {
      if (!checkBaseMatchCountCondition(condition, sourceCounts)) {
        isSatisfied = false;
        break;
      }
    }
    if (isSatisfied) {
      return true;
    }
  }
  return false;
};

const collectSubPatternRelatedCardIndices = (params: {
  preparedSubPattern: PreparedSubPattern;
  subPattern: CompiledSubPattern;
  target: Set<number>;
}) => {
  const { preparedSubPattern, subPattern, target } = params;
  for (const condition of preparedSubPattern.regularConditions) {
    if ("indices" in condition) {
      for (const index of condition.indices) {
        target.add(index);
      }
      continue;
    }
    for (const rule of condition.rules) {
      for (const index of rule.indices) {
        target.add(index);
      }
    }
  }
  for (const condition of preparedSubPattern.baseMatchConditions) {
    for (const rule of condition.rules) {
      for (const index of rule.indices) {
        target.add(index);
      }
    }
  }
  for (const index of subPattern.triggerSourceIndices) {
    target.add(index);
  }
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
  const penetrationEffects: PenetrationEffect[] = [];
  const relatedCardIndexSet = new Set<number>();

  for (const subPattern of compiledSubPatterns) {
    const preparedSubPattern = prepareSubPattern(subPattern);
    if (!subPattern.active) continue;
    if (!canApplyByBasePattern(preparedSubPattern, matchedPatternSet)) continue;
    if (
      !canApplyByBaseMatchedCards({
        preparedSubPattern,
        matchedPatternUids,
        matchedCardCountsByPatternUid,
        context,
      })
    ) {
      continue;
    }
    if (
      !evaluateCompiledConditions(preparedSubPattern.regularConditions, context)
    ) {
      continue;
    }

    const applyCount = resolveApplyCount(subPattern, context);
    if (applyCount <= 0) continue;
    let hasPenetrationEffect = false;

    for (const effect of subPattern.effects) {
      if (effect.type === "add_label") {
        for (const labelUid of effect.labelUids) {
          labelSet.add(labelUid);
        }
        continue;
      }
      hasPenetrationEffect = true;
      const amount = effect.amount * applyCount;
      if (amount > 0 && effect.disruptionCategoryUids.length > 0) {
        penetrationEffects.push({
          disruptionCategoryUids: [...effect.disruptionCategoryUids],
          amount,
          poolId: effect.poolId,
        });
      }

      for (const disruptionCategoryUid of effect.disruptionCategoryUids) {
        const current = penetrationByDisruptionKey[disruptionCategoryUid] ?? 0;
        const next = current + amount;
        penetrationByDisruptionKey[disruptionCategoryUid] = next;
      }
    }
    if (hasPenetrationEffect) {
      collectSubPatternRelatedCardIndices({
        preparedSubPattern,
        subPattern,
        target: relatedCardIndexSet,
      });
    }
  }

  return {
    addedLabelUids: Array.from(labelSet),
    penetrationByDisruptionKey,
    penetrationEffects,
    relatedCardIndices: Array.from(relatedCardIndexSet).sort((a, b) => a - b),
  };
};
