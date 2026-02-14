import type {
  CompiledBaseCondition,
  CompiledPattern,
  CompiledPatternCondition,
  EvaluationContext,
  EvaluationResult,
  PenetrationEffect,
} from "./types";

type MatchedCardCounts = Record<number, number>;

const toUniqueIndices = (indices: number[]) => Array.from(new Set(indices));

const normalizeBaseConditions = (conditions: CompiledBaseCondition[]) =>
  conditions
    .map((condition) => ({
      ...condition,
      indices: toUniqueIndices(condition.indices),
    }))
    .sort((left, right) => {
      const optionDiff = left.indices.length - right.indices.length;
      if (optionDiff !== 0) return optionDiff;
      return left.count - right.count;
    });

const totalAvailableForIndices = (
  availableCounts: number[],
  indices: number[],
) => indices.reduce((sum, index) => sum + (availableCounts[index] ?? 0), 0);

const serializeStateForIndices = (
  availableCounts: number[],
  indices: number[],
) => indices.map((index) => availableCounts[index] ?? 0).join(",");

type CompiledCountCondition = Extract<
  CompiledPatternCondition,
  { rules: unknown }
>;
type PreparedBaseConditionSet = {
  conditions: CompiledBaseCondition[];
  memoTargetIndices: number[];
  hasOverlap: boolean;
};
type PreparedConditions = {
  countConditions: CompiledCountCondition[];
  notDrawnConditions: CompiledBaseCondition[];
  requiredDistinctConditions: CompiledBaseCondition[];
  required: PreparedBaseConditionSet;
  leaveDeck: PreparedBaseConditionSet;
};

const prepareBaseConditions = (
  conditions: CompiledBaseCondition[],
): PreparedBaseConditionSet => {
  const normalizedConditions = normalizeBaseConditions(conditions);
  const seenIndices = new Set<number>();
  let hasOverlap = false;
  for (const condition of normalizedConditions) {
    for (const index of condition.indices) {
      if (seenIndices.has(index)) {
        hasOverlap = true;
      } else {
        seenIndices.add(index);
      }
    }
  }
  return {
    conditions: normalizedConditions,
    memoTargetIndices: toUniqueIndices(
      normalizedConditions.flatMap((condition) => condition.indices),
    ),
    hasOverlap,
  };
};

const preparedConditionsCache = new WeakMap<
  CompiledPatternCondition[],
  PreparedConditions
>();

const prepareConditions = (
  conditions: CompiledPatternCondition[],
): PreparedConditions => {
  const cached = preparedConditionsCache.get(conditions);
  if (cached != null) return cached;

  const countConditions: CompiledCountCondition[] = [];
  const notDrawnConditions: CompiledBaseCondition[] = [];
  const requiredDistinctConditions: CompiledBaseCondition[] = [];
  const requiredBaseConditions: CompiledBaseCondition[] = [];
  const leaveDeckBaseConditions: CompiledBaseCondition[] = [];

  for (const condition of conditions) {
    switch (condition.mode) {
      case "draw_total":
      case "remain_total": {
        countConditions.push(condition);
        break;
      }
      case "not_drawn": {
        notDrawnConditions.push(condition);
        break;
      }
      case "required_distinct": {
        requiredDistinctConditions.push({
          ...condition,
          indices: toUniqueIndices(condition.indices),
        });
        break;
      }
      case "required": {
        requiredBaseConditions.push(condition);
        break;
      }
      case "leave_deck": {
        leaveDeckBaseConditions.push(condition);
        break;
      }
      default: {
        break;
      }
    }
  }

  const prepared: PreparedConditions = {
    countConditions,
    notDrawnConditions,
    requiredDistinctConditions,
    required: prepareBaseConditions(requiredBaseConditions),
    leaveDeck: prepareBaseConditions(leaveDeckBaseConditions),
  };
  preparedConditionsCache.set(conditions, prepared);
  return prepared;
};

const addUsageCount = (
  usage: MatchedCardCounts,
  index: number,
  delta: number,
) => {
  const next = (usage[index] ?? 0) + delta;
  if (next <= 0) {
    delete usage[index];
    return;
  }
  usage[index] = next;
};

const canSatisfyBaseConditions = (
  prepared: PreparedBaseConditionSet,
  availableCounts: number[],
  usage?: MatchedCardCounts,
): boolean => {
  const { conditions, memoTargetIndices, hasOverlap } = prepared;
  if (conditions.length === 0) return true;
  for (const condition of conditions) {
    if (
      totalAvailableForIndices(availableCounts, condition.indices) <
      condition.count
    ) {
      return false;
    }
  }
  if (usage == null && !hasOverlap) {
    return true;
  }
  const memo = usage == null ? new Map<string, boolean>() : null;

  const visit = (conditionIndex: number, slotIndex: number): boolean => {
    if (conditionIndex >= conditions.length) return true;
    const memoKey =
      memo == null
        ? null
        : `${conditionIndex}:${slotIndex}:${serializeStateForIndices(
            availableCounts,
            memoTargetIndices,
          )}`;
    if (memo != null && memoKey != null) {
      const memoized = memo.get(memoKey);
      if (memoized != null) return memoized;
    }

    const condition = conditions[conditionIndex];
    if (slotIndex >= condition.count) {
      const result = visit(conditionIndex + 1, 0);
      if (memo != null && memoKey != null) {
        memo.set(memoKey, result);
      }
      return result;
    }

    for (const index of condition.indices) {
      if ((availableCounts[index] ?? 0) <= 0) continue;
      availableCounts[index] -= 1;
      if (usage != null) {
        addUsageCount(usage, index, 1);
      }
      if (visit(conditionIndex, slotIndex + 1)) {
        availableCounts[index] += 1;
        if (memo != null && memoKey != null) {
          memo.set(memoKey, true);
        }
        return true;
      }
      if (usage != null) {
        addUsageCount(usage, index, -1);
      }
      availableCounts[index] += 1;
    }

    if (memo != null && memoKey != null) {
      memo.set(memoKey, false);
    }
    return false;
  };

  return visit(0, 0);
};

const checkCountCondition = (
  context: EvaluationContext,
  condition: CompiledCountCondition,
) => {
  const source =
    condition.mode === "draw_total" ? context.handCounts : context.deckCounts;

  const total = condition.rules.reduce((acc, rule) => {
    const raw = rule.indices.reduce(
      (sum, index) => sum + (source[index] ?? 0),
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

type ConditionEvaluationDetail = {
  isMatched: boolean;
  matchedCardCounts: MatchedCardCounts;
};

const evaluateCompiledConditionsWithDetail = (
  conditions: CompiledPatternCondition[],
  context: EvaluationContext,
): ConditionEvaluationDetail => {
  const prepared = prepareConditions(conditions);
  const requiredDistinctSelections: number[][] = [];
  const matchedCardCounts: MatchedCardCounts = {};

  for (const condition of prepared.countConditions) {
    if (!checkCountCondition(context, condition)) {
      return { isMatched: false, matchedCardCounts: {} };
    }
  }

  for (const condition of prepared.notDrawnConditions) {
    const isDrawn = condition.indices.some(
      (index) => (context.handCounts[index] ?? 0) > 0,
    );
    if (isDrawn) {
      return { isMatched: false, matchedCardCounts: {} };
    }
  }

  for (const condition of prepared.requiredDistinctConditions) {
    const distinctIndices = condition.indices.filter(
      (index) => (context.handCounts[index] ?? 0) > 0,
    );
    if (distinctIndices.length < condition.count) {
      return { isMatched: false, matchedCardCounts: {} };
    }
    requiredDistinctSelections.push(distinctIndices);
  }

  if (prepared.required.conditions.length > 0) {
    const copy = context.handCounts.slice();
    if (!canSatisfyBaseConditions(prepared.required, copy, matchedCardCounts)) {
      return { isMatched: false, matchedCardCounts: {} };
    }
  }

  for (const selection of requiredDistinctSelections) {
    for (const index of selection) {
      const current = matchedCardCounts[index] ?? 0;
      if (current < 1) {
        matchedCardCounts[index] = 1;
      }
    }
  }

  if (prepared.leaveDeck.conditions.length > 0) {
    const copy = context.deckCounts.slice();
    if (!canSatisfyBaseConditions(prepared.leaveDeck, copy)) {
      return { isMatched: false, matchedCardCounts: {} };
    }
  }

  return {
    isMatched: true,
    matchedCardCounts,
  };
};

export const evaluateCompiledConditions = (
  conditions: CompiledPatternCondition[],
  context: EvaluationContext,
): boolean =>
  evaluateCompiledConditionsWithDetail(conditions, context).isMatched;

const evaluatePatternWithDetail = (
  pattern: CompiledPattern,
  context: EvaluationContext,
) => {
  if (!pattern.active) {
    return { isMatched: false, matchedCardCounts: {} as MatchedCardCounts };
  }

  return evaluateCompiledConditionsWithDetail(pattern.conditions, context);
};

export const evaluatePattern = (
  pattern: CompiledPattern,
  context: EvaluationContext,
): boolean => evaluatePatternWithDetail(pattern, context).isMatched;

export const evaluatePatterns = (
  patterns: CompiledPattern[],
  context: EvaluationContext,
): EvaluationResult => {
  const matchedPatternUids: string[] = [];
  const matchedCardCountsByPatternUid: Record<string, MatchedCardCounts> = {};
  const matchedLabelUids = new Set<string>();
  const penetrationByDisruptionKey: Record<string, number> = {};
  const penetrationEffects: PenetrationEffect[] = [];

  for (const pattern of patterns) {
    const detail = evaluatePatternWithDetail(pattern, context);
    if (!detail.isMatched) continue;

    matchedPatternUids.push(pattern.uid);
    matchedCardCountsByPatternUid[pattern.uid] = detail.matchedCardCounts;
    for (const label of pattern.labels) {
      matchedLabelUids.add(label.uid);
    }
    for (const effect of pattern.effects ?? []) {
      if (effect.type === "add_label") {
        for (const labelUid of effect.labelUids) {
          matchedLabelUids.add(labelUid);
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
    isSuccess: matchedPatternUids.length > 0 || matchedLabelUids.size > 0,
    matchedPatternUids,
    matchedCardCountsByPatternUid,
    matchedLabelUids: Array.from(matchedLabelUids),
    penetrationByDisruptionKey,
    penetrationEffects,
  };
};
