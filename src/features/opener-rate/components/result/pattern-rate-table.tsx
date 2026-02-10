import { useAtomValue } from "jotai";
import { useMemo } from "react";

import { Badge } from "../../../../components/ui";
import { calculationResultAtom, patternsAtom } from "../../state";
import { SectionCard } from "../layout/section-card";

const rateBadgeClassName =
  "min-w-[4.75rem] justify-center rounded-md border-latte-blue/45 bg-latte-blue/18 px-2.5 py-1 text-sm font-semibold tabular-nums text-latte-blue";

export const PatternRateTable = () => {
  const patterns = useAtomValue(patternsAtom);
  const result = useAtomValue(calculationResultAtom);

  const sortedPatterns = useMemo(() => {
    const rateMap = new Map(
      (result?.patternSuccessRates ?? []).map((entry) => [
        entry.uid,
        entry.rate,
      ]),
    );

    return patterns
      .map((pattern, index) => ({
        pattern,
        index,
        rate: rateMap.get(pattern.uid) ?? "0.00",
      }))
      .sort((a, b) => {
        const diff = Number.parseFloat(b.rate) - Number.parseFloat(a.rate);
        if (diff !== 0) return diff;
        return a.index - b.index;
      });
  }, [patterns, result?.patternSuccessRates]);

  return (
    <SectionCard
      title="パターン別成功率"
      description="パターン単位の成功率（表示順は配列順）"
    >
      {patterns.length === 0 ? (
        <p className="text-xs text-latte-subtext0">パターンがありません。</p>
      ) : null}

      <div className="space-y-2">
        {sortedPatterns.map(({ pattern, rate }, index) => (
          <div
            key={pattern.uid}
            className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-latte-surface1/70 bg-latte-crust/70 px-3 py-2"
          >
            <span className="text-xs tabular-nums text-latte-overlay1">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-latte-text">
                {pattern.name.trim() || "名称未設定"}
              </p>
            </div>
            <Badge className={rateBadgeClassName}>{rate}%</Badge>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};
