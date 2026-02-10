import { useAtomValue } from "jotai";
import { useMemo } from "react";

import { Badge } from "../../../../components/ui";
import { calculationResultAtom, labelsAtom } from "../../state";
import { SectionCard } from "../layout/section-card";

const rateBadgeClassName =
  "min-w-[4.75rem] justify-center rounded-md border-latte-blue/45 bg-latte-blue/18 px-2.5 py-1 text-sm font-semibold tabular-nums text-latte-blue";

export const LabelRateTable = () => {
  const labels = useAtomValue(labelsAtom);
  const result = useAtomValue(calculationResultAtom);

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
        <p className="text-xs text-latte-subtext0">ラベルがありません。</p>
      ) : null}

      <div className="space-y-2">
        {sortedLabels.map(({ label, rate }, index) => (
          <div
            key={label.uid}
            className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-latte-surface1/70 bg-latte-crust/70 px-3 py-2"
          >
            <span className="text-xs tabular-nums text-latte-overlay1">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-latte-text">
                {label.name.trim() || "名称未設定"}
              </p>
            </div>
            <Badge className={rateBadgeClassName}>{rate}%</Badge>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};
