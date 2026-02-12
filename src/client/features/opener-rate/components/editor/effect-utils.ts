import type { SubPatternEffect } from "../../../../../shared/apiSchemas";

export const effectTypeOptions = [
  {
    value: "add_label",
    label: "ラベル付与",
  },
  {
    value: "add_penetration",
    label: "貫通値加算",
  },
] as const;

export const createDefaultEffect = (): SubPatternEffect => {
  return {
    type: "add_label",
    labelUids: [],
  };
};

export const createDefaultPenetrationEffect = (): SubPatternEffect => {
  return {
    type: "add_penetration",
    disruptionCategoryUids: [],
    amount: 1,
  };
};

export const switchEffectType = (
  current: SubPatternEffect,
  nextType: SubPatternEffect["type"],
): SubPatternEffect => {
  if (nextType === "add_label") {
    if (current.type === "add_label") {
      return current;
    }
    return createDefaultEffect();
  }

  if (current.type === "add_penetration") {
    return current;
  }
  return createDefaultPenetrationEffect();
};

type PruneResult = {
  effects: SubPatternEffect[];
  changed: boolean;
};

export const pruneUnavailablePenetrationCategories = (
  effects: SubPatternEffect[],
  availableCategoryUids: Set<string>,
): PruneResult => {
  let changed = false;
  const next = effects.map((effect) => {
    if (effect.type !== "add_penetration") return effect;
    const filtered = effect.disruptionCategoryUids.filter((uid) =>
      availableCategoryUids.has(uid),
    );
    if (filtered.length === effect.disruptionCategoryUids.length) {
      return effect;
    }
    changed = true;
    return { ...effect, disruptionCategoryUids: filtered };
  });

  return { effects: changed ? next : effects, changed };
};
