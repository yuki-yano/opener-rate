import type {
  Pattern,
  PatternCondition,
  SubPattern,
  SubPatternEffect,
} from "../../../../shared/apiSchemas";

const resolveDuplicateName = (name: string, fallbackName: string) =>
  `${name.trim().length > 0 ? name : fallbackName} - コピー`;

const clonePatternCondition = (
  condition: PatternCondition,
): PatternCondition => {
  if ("rules" in condition) {
    return {
      ...condition,
      rules: condition.rules.map((rule) => ({
        ...rule,
        uids: [...rule.uids],
      })),
    };
  }

  return {
    ...condition,
    uids: [...condition.uids],
  };
};

const cloneSubPatternEffect = (effect: SubPatternEffect): SubPatternEffect => {
  if ("labelUids" in effect) {
    return {
      ...effect,
      labelUids: [...effect.labelUids],
    };
  }

  return {
    ...effect,
    disruptionCategoryUids: [...effect.disruptionCategoryUids],
  };
};

type CreateDuplicatedPatternParams = {
  source: Pattern;
  nextUid: string;
  fallbackName: string;
};

export const createDuplicatedPattern = ({
  source,
  nextUid,
  fallbackName,
}: CreateDuplicatedPatternParams): Pattern => ({
  ...source,
  uid: nextUid,
  name: resolveDuplicateName(source.name, fallbackName),
  active: true,
  conditions: source.conditions.map(clonePatternCondition),
  labels: source.labels.map((label) => ({ uid: label.uid })),
  effects: source.effects?.map(cloneSubPatternEffect),
});

type CreateDuplicatedSubPatternParams = {
  source: SubPattern;
  nextUid: string;
  fallbackName: string;
};

export const createDuplicatedSubPattern = ({
  source,
  nextUid,
  fallbackName,
}: CreateDuplicatedSubPatternParams): SubPattern => ({
  ...source,
  uid: nextUid,
  name: resolveDuplicateName(source.name, fallbackName),
  active: true,
  basePatternUids: [...source.basePatternUids],
  triggerConditions: source.triggerConditions.map(clonePatternCondition),
  triggerSourceUids: [...source.triggerSourceUids],
  effects: source.effects.map(cloneSubPatternEffect),
});
