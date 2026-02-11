import { useAtomValue, useSetAtom } from "jotai";
import { Calculator, ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge, Button } from "../../../../components/ui";
import {
  canCalculateAtom,
  calculationResultAtom,
  deckSizeExceededAtom,
  isCalculatingAtom,
  patternsAtom,
  previousCalculationResultAtom,
  runCalculateAtom,
  totalCardCountAtom,
  transportErrorAtom,
} from "../../state";
import { SectionCard } from "../layout/section-card";

const rateBadgeClassName =
  "min-w-[5rem] justify-center px-2.5 py-1 text-sm tabular-nums";
const diffEpsilon = 0.005;

const toModeLabel = (mode: "exact" | "simulation") =>
  mode === "exact" ? "厳密計算" : "シミュレーション";

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
    className: diff > 0 ? "text-latte-green" : "text-latte-red",
    text: `${diff > 0 ? "+" : "-"}${Math.abs(diff).toFixed(2)}%`,
  };
};

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
  const previousResult = useAtomValue(previousCalculationResultAtom);
  const patterns = useAtomValue(patternsAtom);
  const transportError = useAtomValue(transportErrorAtom);
  const totalCardCount = useAtomValue(totalCardCountAtom);
  const deckExceeded = useAtomValue(deckSizeExceededAtom);
  const runCalculate = useSetAtom(runCalculateAtom);
  const [isPatternRatesExpanded, setIsPatternRatesExpanded] = useState(false);
  const isExactDiffEnabled =
    result?.mode === "exact" && previousResult?.mode === "exact";
  const previousPatternRateMap = useMemo(
    () =>
      new Map(
        (previousResult?.patternSuccessRates ?? []).map((entry) => [
          entry.uid,
          entry.rate,
        ]),
      ),
    [previousResult?.patternSuccessRates],
  );
  const overallRateDiff = isExactDiffEnabled
    ? resolveRateDiff(
        result?.overallProbability ?? "0",
        previousResult?.overallProbability,
      )
    : null;

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
          className="border-latte-surface0 bg-latte-surface0 text-latte-text ring-1 ring-latte-blue/28 hover:bg-latte-surface1/85 active:bg-latte-surface1"
          onClick={() => {
            void runCalculate();
          }}
          disabled={!canCalculate || isCalculating}
        >
          <Calculator className="mr-1.5 h-4 w-4 text-latte-blue" />
          {isCalculating ? "計算中..." : "計算する"}
        </Button>
      }
    >
      <div className="rounded-md border border-latte-surface0/80 bg-latte-mantle px-4 py-3.5">
        <p className="text-xs tracking-[0.08em] text-latte-subtext0">
          全体成功率
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums text-latte-text">
          {result?.overallProbability ?? "0.00"}%
          {overallRateDiff ? (
            <span className={`ml-2 text-sm ${overallRateDiff.className}`}>
              ({overallRateDiff.text})
            </span>
          ) : null}
        </p>
        {result ? (
          <Badge className="mt-2">{toModeLabel(result.mode)}</Badge>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs tracking-wider text-latte-subtext0">
            パターン別成立率
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-[11px] text-latte-subtext0"
            aria-expanded={isPatternRatesExpanded}
            onClick={() => setIsPatternRatesExpanded((current) => !current)}
          >
            {isPatternRatesExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {isPatternRatesExpanded ? "閉じる" : "開く"}
          </Button>
        </div>
        {isPatternRatesExpanded ? (
          patterns.length === 0 ? (
            <p className="text-xs text-latte-subtext0">
              パターンがありません。
            </p>
          ) : (
            sortedPatterns.map(({ pattern, rate }, index) => {
              const rateDiff = isExactDiffEnabled
                ? resolveRateDiff(rate, previousPatternRateMap.get(pattern.uid))
                : null;

              return (
                <div
                  key={pattern.uid}
                  className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-latte-surface0/70 bg-latte-mantle px-3 py-2.5"
                >
                  <span className="text-xs tabular-nums text-latte-overlay1">
                    {index + 1}
                  </span>
                  <p className="truncate text-sm text-latte-text">
                    {pattern.name.trim() || "名称未設定"}
                  </p>
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
            })
          )
        ) : null}
      </div>

      {result?.vsBreakdown ? (
        <div className="space-y-2">
          <p className="text-xs tracking-wider text-latte-subtext0">
            対妨害シミュレーション内訳
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-latte-surface0/70 bg-latte-mantle px-3 py-2.5">
              <p className="text-[11px] text-latte-subtext0">妨害なし成功</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-latte-text">
                {result.vsBreakdown.noDisruptionSuccessRate}%
              </p>
            </div>
            <div className="rounded-md border border-latte-surface0/70 bg-latte-mantle px-3 py-2.5">
              <p className="text-[11px] text-latte-subtext0">
                妨害あり突破成功
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-latte-text">
                {result.vsBreakdown.disruptedButPenetratedRate}%
              </p>
            </div>
            <div className="rounded-md border border-latte-surface0/70 bg-latte-mantle px-3 py-2.5">
              <p className="text-[11px] text-latte-subtext0">妨害あり失敗</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-latte-text">
                {result.vsBreakdown.disruptedAndFailedRate}%
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {deckExceeded ? (
        <p className="rounded-md border border-latte-red/40 bg-latte-red/12 px-3 py-2 text-xs text-latte-red">
          デッキ枚数を超過しています（合計 {totalCardCount} 枚）。
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-latte-red/40 bg-latte-red/12 px-3 py-2 text-xs text-latte-red">
          {errorMessage}
        </p>
      ) : null}
    </SectionCard>
  );
};
