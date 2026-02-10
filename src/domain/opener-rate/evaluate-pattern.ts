import type {
  CompiledBaseCondition,
  CompiledPattern,
  CompiledPatternCondition,
  EvaluationContext,
  EvaluationResult,
} from "./types";

const canSatisfyBaseConditions = (
  conditions: CompiledBaseCondition[],
  availableCounts: number[],
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
      if (visit(conditionIndex, slotIndex + 1)) {
        availableCounts[index] += 1;
        return true;
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

export const evaluateCompiledConditions = (
  conditions: CompiledPatternCondition[],
  context: EvaluationContext,
): boolean => {
  const required: CompiledBaseCondition[] = [];
  const leaveDeck: CompiledBaseCondition[] = [];

  for (const condition of conditions) {
    switch (condition.mode) {
      case "draw_total":
      case "remain_total": {
        if (!checkCountCondition(context, condition)) return false;
        break;
      }
      case "not_drawn": {
        const isDrawn = condition.indices.some(
          (index) => (context.handCounts[index] ?? 0) > 0,
        );
        if (isDrawn) return false;
        break;
      }
      case "required_distinct": {
        let distinctCount = 0;
        for (const index of condition.indices) {
          if ((context.handCounts[index] ?? 0) > 0) {
            distinctCount += 1;
          }
        }
        if (distinctCount < condition.count) return false;
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
        return false;
      }
    }
  }

  if (required.length > 0) {
    const copy = context.handCounts.slice();
    if (!canSatisfyBaseConditions(required, copy)) return false;
  }

  if (leaveDeck.length > 0) {
    const copy = context.deckCounts.slice();
    if (!canSatisfyBaseConditions(leaveDeck, copy)) return false;
  }

  return true;
};

export const evaluatePattern = (
  pattern: CompiledPattern,
  context: EvaluationContext,
): boolean => {
  if (!pattern.active) return false;
  return evaluateCompiledConditions(pattern.conditions, context);
};

export const evaluatePatterns = (
  patterns: CompiledPattern[],
  context: EvaluationContext,
): EvaluationResult => {
  const matchedPatternUids: string[] = [];
  const matchedLabelUids = new Set<string>();

  for (const pattern of patterns) {
    if (!evaluatePattern(pattern, context)) continue;
    matchedPatternUids.push(pattern.uid);
    for (const label of pattern.labels) {
      matchedLabelUids.add(label.uid);
    }
  }

  return {
    isSuccess: matchedPatternUids.length > 0 || matchedLabelUids.size > 0,
    matchedPatternUids,
    matchedLabelUids: Array.from(matchedLabelUids),
  };
};
