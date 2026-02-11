import type {
  CompiledBaseCondition,
  CompiledPattern,
  CompiledPatternCondition,
  EvaluationContext,
  EvaluationResult,
} from "./types";

type MatchedCardCounts = Record<number, number>;

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
  conditions: CompiledBaseCondition[],
  availableCounts: number[],
  usage?: MatchedCardCounts,
): boolean => {
  if (conditions.length === 0) return true;

  const visit = (conditionIndex: number, slotIndex: number): boolean => {
    if (conditionIndex >= conditions.length) return true;

    const condition = conditions[conditionIndex];
    if (slotIndex >= condition.count) {
      return visit(conditionIndex + 1, 0);
    }

    for (const index of condition.indices) {
      if ((availableCounts[index] ?? 0) <= 0) continue;
      availableCounts[index] -= 1;
      if (usage != null) {
        addUsageCount(usage, index, 1);
      }
      if (visit(conditionIndex, slotIndex + 1)) {
        availableCounts[index] += 1;
        return true;
      }
      if (usage != null) {
        addUsageCount(usage, index, -1);
      }
      availableCounts[index] += 1;
    }

    return false;
  };

  return visit(0, 0);
};

const checkCountCondition = (
  context: EvaluationContext,
  condition: Extract<
    CompiledPattern["conditions"][number],
    { mode: "draw_total" | "remain_total" }
  >,
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
  const required: CompiledBaseCondition[] = [];
  const requiredDistinctSelections: number[][] = [];
  const leaveDeck: CompiledBaseCondition[] = [];
  const matchedCardCounts: MatchedCardCounts = {};

  for (const condition of conditions) {
    switch (condition.mode) {
      case "draw_total":
      case "remain_total": {
        if (!checkCountCondition(context, condition)) {
          return { isMatched: false, matchedCardCounts: {} };
        }
        break;
      }
      case "not_drawn": {
        const isDrawn = condition.indices.some(
          (index) => (context.handCounts[index] ?? 0) > 0,
        );
        if (isDrawn) {
          return { isMatched: false, matchedCardCounts: {} };
        }
        break;
      }
      case "required_distinct": {
        const selected: number[] = [];
        for (const index of condition.indices) {
          if ((context.handCounts[index] ?? 0) <= 0) continue;
          if (selected.includes(index)) continue;
          selected.push(index);
          if (selected.length >= condition.count) break;
        }
        if (selected.length < condition.count) {
          return { isMatched: false, matchedCardCounts: {} };
        }
        requiredDistinctSelections.push(selected);
        break;
      }
      case "required": {
        required.push(condition);
        break;
      }
      case "leave_deck": {
        leaveDeck.push(condition);
        break;
      }
      default: {
        return { isMatched: false, matchedCardCounts: {} };
      }
    }
  }

  if (required.length > 0) {
    const copy = context.handCounts.slice();
    if (!canSatisfyBaseConditions(required, copy, matchedCardCounts)) {
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

  if (leaveDeck.length > 0) {
    const copy = context.deckCounts.slice();
    if (!canSatisfyBaseConditions(leaveDeck, copy)) {
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
  };
};
