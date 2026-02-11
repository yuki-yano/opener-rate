import type {
  PatternCondition,
  SubPattern,
  SubPatternEffect,
} from "../../../../shared/apiSchemas";

export type ComposeSource = {
  value: string;
  label: string;
  conditions: PatternCondition[];
  basePatternUids: string[];
  triggerSourceUids: string[];
  effects: SubPatternEffect[];
};

type ComposePenetrationEntry = {
  disruptionCategoryUid: string;
  totalAmount: number;
};

const dedupe = (values: string[]) => Array.from(new Set(values));

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

export const resolveCategoryPenetrationAmount = (
  source: ComposeSource,
  disruptionCategoryUid: string,
) =>
  source.effects.reduce((total, effect) => {
    if (effect.type !== "add_penetration") return total;
    if (!effect.disruptionCategoryUids.includes(disruptionCategoryUid)) {
      return total;
    }
    return total + effect.amount;
  }, 0);

export const resolveComposeEntries = (
  mainSource: ComposeSource,
  filterSource: ComposeSource,
  categoryUids: string[],
): ComposePenetrationEntry[] =>
  dedupe(categoryUids)
    .map((disruptionCategoryUid) => {
      const amountFromMain = resolveCategoryPenetrationAmount(
        mainSource,
        disruptionCategoryUid,
      );
      const amountFromFilter = resolveCategoryPenetrationAmount(
        filterSource,
        disruptionCategoryUid,
      );
      return {
        disruptionCategoryUid,
        totalAmount: amountFromMain + amountFromFilter,
      };
    })
    .filter((entry) => entry.totalAmount > 0);

type BuildComposedSubPatternParams = {
  uid: string;
  name: string;
  mainSource: ComposeSource;
  filterSource: ComposeSource;
  selectedCategoryUids: string[];
  selectedLabelUids: string[];
};

export const buildComposedSubPattern = ({
  uid,
  name,
  mainSource,
  filterSource,
  selectedCategoryUids,
  selectedLabelUids,
}: BuildComposedSubPatternParams): SubPattern | null => {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return null;

  const composeEntries = resolveComposeEntries(
    mainSource,
    filterSource,
    selectedCategoryUids,
  );
  if (composeEntries.length === 0) return null;

  const normalizedLabelUids = dedupe(selectedLabelUids);
  const effects: SubPatternEffect[] = [
    ...(normalizedLabelUids.length > 0
      ? [
          {
            type: "add_label" as const,
            labelUids: normalizedLabelUids,
          },
        ]
      : []),
    ...composeEntries.map((entry) => ({
      type: "add_penetration" as const,
      disruptionCategoryUids: [entry.disruptionCategoryUid],
      amount: entry.totalAmount,
    })),
  ];

  return {
    uid,
    name: trimmedName,
    active: true,
    basePatternUids: dedupe(mainSource.basePatternUids),
    triggerConditions: filterSource.conditions.map(clonePatternCondition),
    triggerSourceUids: dedupe(filterSource.triggerSourceUids),
    applyLimit: "once_per_trial",
    effects,
    memo: `合成元(メイン): ${mainSource.label} / 合成元(フィルタ): ${filterSource.label}`,
  };
};
