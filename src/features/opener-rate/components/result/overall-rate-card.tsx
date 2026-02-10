import { useAtomValue, useSetAtom } from "jotai";
import { Calculator } from "lucide-react";
import { useMemo } from "react";

import { Badge, Button } from "../../../../components/ui";
import {
  canCalculateAtom,
  calculationResultAtom,
  deckSizeExceededAtom,
  isCalculatingAtom,
  patternsAtom,
  runCalculateAtom,
  totalCardCountAtom,
  transportErrorAtom,
} from "../../state";
import { SectionCard } from "../layout/section-card";

const rateBadgeClassName =
  "min-w-[4.75rem] justify-center rounded-md border-latte-blue/45 bg-latte-blue/18 px-2.5 py-1 text-sm font-semibold tabular-nums text-latte-blue";

const toModeLabel = (mode: "exact" | "simulation") =>
  mode === "exact" ? "厳密計算" : "シミュレーション";

const toErrorMessage = (value: string | null) => {
  if (value == null) return null;
  if (value === "card_count_exceeded") {
    return "デッキ枚数を超過しています。カード枚数の合計を見直してください。";
  }
  return value;
};

export const OverallRateCard = () => {
  const canCalculate = useAtomValue(canCalculateAtom);
  const isCalculating = useAtomValue(isCalculatingAtom);
  const result = useAtomValue(calculationResultAtom);
  const patterns = useAtomValue(patternsAtom);
  const transportError = useAtomValue(transportErrorAtom);
  const totalCardCount = useAtomValue(totalCardCountAtom);
  const deckExceeded = useAtomValue(deckSizeExceededAtom);
  const runCalculate = useSetAtom(runCalculateAtom);

  const sortedPatterns = useMemo(() => {
    const rateMap = new Map(
      (result?.patternSuccessRates ?? []).map((entry) => [entry.uid, entry.rate]),
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

  const errorMessage = toErrorMessage(
    transportError ?? result?.error?.type ?? null,
  );

  return (
    <SectionCard
      title="計算結果"
      description="現在の入力で初動率を計算します。"
      actions={
        <Button
          size="sm"
          onClick={() => {
            void runCalculate();
          }}
          disabled={!canCalculate || isCalculating}
        >
          <Calculator className="mr-1.5 h-4 w-4" />
          {isCalculating ? "計算中..." : "計算する"}
        </Button>
      }
    >
      <div className="rounded-md border border-latte-surface1 bg-latte-crust/70 px-4 py-3">
        <p className="text-xs tracking-wider text-latte-subtext0">全体成功率</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-latte-text">
          {result?.overallProbability ?? "0.00"}%
        </p>
        {result ? (
          <Badge className="mt-2">{toModeLabel(result.mode)}</Badge>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-xs tracking-wider text-latte-subtext0">
          パターン別成立率
        </p>
        {patterns.length === 0 ? (
          <p className="text-xs text-latte-subtext0">パターンがありません。</p>
        ) : (
          sortedPatterns.map(({ pattern, rate }, index) => (
            <div
              key={pattern.uid}
              className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-latte-surface1/70 bg-latte-crust/70 px-3 py-2"
            >
              <span className="text-xs tabular-nums text-latte-overlay1">
                {index + 1}
              </span>
              <p className="truncate text-sm text-latte-text">
                {pattern.name.trim() || "名称未設定"}
              </p>
              <Badge className={rateBadgeClassName}>{rate}%</Badge>
            </div>
          ))
        )}
      </div>

      {deckExceeded ? (
        <p className="rounded-md border border-latte-red/40 bg-latte-red/10 px-3 py-2 text-xs text-latte-red">
          デッキ枚数を超過しています（合計 {totalCardCount} 枚）。
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-latte-red/40 bg-latte-red/10 px-3 py-2 text-xs text-latte-red">
          {errorMessage}
        </p>
      ) : null}
    </SectionCard>
  );
};
