import { useAtomValue } from "jotai";
import { useMemo } from "react";

import { Badge } from "../../../../components/ui";
import {
  calculationResultAtom,
  labelsAtom,
  previousCalculationResultAtom,
} from "../../state";
import { SectionCard } from "../layout/section-card";

const rateBadgeClassName =
  "min-w-[5rem] justify-center px-2.5 py-1 text-sm tabular-nums";
const diffEpsilon = 0.005;

type RateDiff = {
  className: string;
  text: string;
};

const resolveRateDiff = (
  currentRate: string,
  previousRate?: string,
): RateDiff | null => {
  const current = Number.parseFloat(currentRate);
  if (!Number.isFinite(current)) return null;

  const previousValue = Number.parseFloat(previousRate ?? "0");
  const previous = Number.isFinite(previousValue) ? previousValue : 0;
  const diff = current - previous;
  if (Math.abs(diff) < diffEpsilon) return null;

  return {
    className: diff > 0 ? "text-ui-green" : "text-ui-red",
    text: `${diff > 0 ? "+" : "-"}${Math.abs(diff).toFixed(2)}%`,
  };
};

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
            <div
              key={label.uid}
              className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-ui-surface0/70 bg-ui-mantle px-3 py-2.5"
            >
              <span className="text-xs tabular-nums text-ui-overlay1">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm text-ui-text">
                  {label.name.trim() || "名称未設定"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {rateDiff ? (
                  <span className={`text-xs ${rateDiff.className}`}>
                    ({rateDiff.text})
                  </span>
                ) : null}
                <Badge className={rateBadgeClassName}>{rate}%</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};
