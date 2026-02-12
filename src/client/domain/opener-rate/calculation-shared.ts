import type { CompiledPattern } from "./types";

export const collectCountablePatternEffects = (
  matchedPatternUids: string[],
  compiledPatternByUid: Map<string, CompiledPattern>,
) => {
  const countableMatchedPatternUids: string[] = [];
  const countableMatchedLabelUids = new Set<string>();
  const penetrationByDisruptionKey: Record<string, number> = {};

  for (const patternUid of matchedPatternUids) {
    const pattern = compiledPatternByUid.get(patternUid);
    if (pattern == null) continue;
    if (pattern.excludeFromOverall) continue;

    countableMatchedPatternUids.push(patternUid);
    for (const label of pattern.labels) {
      countableMatchedLabelUids.add(label.uid);
    }
    for (const effect of pattern.effects ?? []) {
      if (effect.type === "add_label") {
        for (const labelUid of effect.labelUids) {
          countableMatchedLabelUids.add(labelUid);
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
    countableMatchedPatternUids,
    countableMatchedLabelUids,
    penetrationByDisruptionKey,
  };
};

export const toRateStringFromNumber = (successCount: number, total: number) => {
  if (total <= 0) return "0.00";
  return ((successCount / total) * 100).toFixed(2);
};

export const toRateStringFromBigInt = (success: bigint, total: bigint) => {
  if (total <= 0n) return "0.00";
  const scaled = (success * 10000n) / total;
  return (Number(scaled) / 100).toFixed(2);
};
