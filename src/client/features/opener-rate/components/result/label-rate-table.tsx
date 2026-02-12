import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  calculationResultAtom,
  labelsAtom,
  previousCalculationResultAtom,
} from "../../state";
import { SectionCard } from "../layout/section-card";
import { resolveRateDiff } from "./rate-diff";
import { RateRow } from "./rate-row";

export const LabelRateTable = () => {
  const labels = useAtomValue(labelsAtom);
  const result = useAtomValue(calculationResultAtom);
  const previousResult = useAtomValue(previousCalculationResultAtom);
  const isExactDiffEnabled =
    result?.mode === "exact" && previousResult?.mode === "exact";
  const previousLabelRateMap = useMemo(
    () =>
      new Map(
        (previousResult?.labelSuccessRates ?? []).map((entry) => [
          entry.uid,
          entry.rate,
        ]),
      ),
    [previousResult?.labelSuccessRates],
  );

  const sortedLabels = useMemo(() => {
    const rateMap = new Map(
      (result?.labelSuccessRates ?? []).map((entry) => [entry.uid, entry.rate]),
    );

    return labels
      .map((label, index) => ({
        label,
        index,
        rate: rateMap.get(label.uid) ?? "0.00",
      }))
      .sort((a, b) => {
        const diff = Number.parseFloat(b.rate) - Number.parseFloat(a.rate);
        if (diff !== 0) return diff;
        return a.index - b.index;
      });
  }, [labels, result?.labelSuccessRates]);

  return (
    <SectionCard
      title="ラベル別成功率"
      description="ラベル単位の成功率を表示します。"
    >
      {labels.length === 0 ? (
        <p className="text-xs text-ui-subtext0">ラベルがありません。</p>
      ) : null}

      <div className="space-y-2">
        {sortedLabels.map(({ label, rate }, index) => {
          const rateDiff = isExactDiffEnabled
            ? resolveRateDiff(rate, previousLabelRateMap.get(label.uid))
            : null;

          return (
            <RateRow
              key={label.uid}
              index={index + 1}
              name={label.name.trim() || "名称未設定"}
              rate={rate}
              diff={rateDiff}
              isExcludedFromOverall={false}
            />
          );
        })}
      </div>
    </SectionCard>
  );
};
