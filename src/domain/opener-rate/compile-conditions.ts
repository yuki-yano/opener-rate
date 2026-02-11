import type {
  PatternCondition,
  SubPatternTriggerCondition,
} from "../../shared/apiSchemas";
import type {
  CompiledBaseMatchCountCondition,
  CompiledCountRule,
  CompiledPattern,
  CompiledPatternCondition,
  CompiledSubPatternTriggerCondition,
  NormalizedDeck,
} from "./types";

const isCountCondition = (
  condition: PatternCondition | SubPatternTriggerCondition,
): condition is Extract<
  PatternCondition | SubPatternTriggerCondition,
  { mode: "draw_total" | "remain_total" }
> => condition.mode === "draw_total" || condition.mode === "remain_total";

const isBaseMatchCountCondition = (
  condition: SubPatternTriggerCondition,
): condition is Extract<
  SubPatternTriggerCondition,
  { mode: "base_match_total" }
> => condition.mode === "base_match_total";

export const toIndices = (uidToIndex: Map<string, number>, uids: string[]) => {
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
  condition: Extract<
    PatternCondition | SubPatternTriggerCondition,
    { mode: "draw_total" | "remain_total" | "base_match_total" }
  >,
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

export const compilePatternConditions = (
  uidToIndex: Map<string, number>,
  conditions: PatternCondition[],
): CompiledPatternCondition[] =>
  conditions.map((condition) => compileCondition(uidToIndex, condition));

const compileSubPatternTriggerCondition = (
  uidToIndex: Map<string, number>,
  condition: SubPatternTriggerCondition,
): CompiledSubPatternTriggerCondition => {
  if (isBaseMatchCountCondition(condition)) {
    const compiled: CompiledBaseMatchCountCondition = {
      ...condition,
      rules: compileCountRules(uidToIndex, condition),
    };
    return compiled;
  }

  return compileCondition(uidToIndex, condition);
};

export const compileSubPatternTriggerConditions = (
  uidToIndex: Map<string, number>,
  conditions: SubPatternTriggerCondition[],
): CompiledSubPatternTriggerCondition[] =>
  conditions.map((condition) =>
    compileSubPatternTriggerCondition(uidToIndex, condition),
  );

export const compilePatterns = (
  normalized: NormalizedDeck,
): CompiledPattern[] => {
  return normalized.patterns.map((pattern) => ({
    ...pattern,
    conditions: compilePatternConditions(
      normalized.uidToIndex,
      pattern.conditions,
    ),
  }));
};
