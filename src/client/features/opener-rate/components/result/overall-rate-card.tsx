import { useAtomValue, useSetAtom } from "jotai";
import { Calculator, ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Badge,
  Button,
  uiDangerNoticeClassName,
} from "../../../../components/ui";
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
import { resolveRateDiff } from "./rate-diff";
import { RateRow } from "./rate-row";

const toModeLabel = (mode: "exact" | "simulation") =>
  mode === "exact" ? "厳密計算" : "シミュレーション";

const toErrorMessage = (value: string | null) => {
  if (value == null) return null;
  if (value === "card_count_exceeded") {
    return "デッキ枚数を超過しています。カード枚数の合計を見直してください。";
  }
  return value;
};

const breakdownCardClassName =
  "rounded-md border border-ui-border1/70 bg-ui-layer1 px-3 py-2.5";
const breakdownLabelClassName = "text-[11px] text-ui-text3";
const percentageTextClassName = "font-numeric tabular-nums tracking-[0.005em]";
const overallRateValueClassName = `mt-1 text-3xl font-semibold text-ui-text ${percentageTextClassName}`;
const breakdownValueClassName = `mt-1 text-base font-semibold text-ui-text ${percentageTextClassName}`;

const VsBreakdownItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <div className={breakdownCardClassName}>
      <p className={breakdownLabelClassName}>{label}</p>
      <p className={breakdownValueClassName}>{value}%</p>
    </div>
  );
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
          className="border-ui-border1 bg-white text-ui-text ring-1 ring-ui-primary/28 hover:bg-ui-layer1 active:bg-ui-layer1/90"
          onClick={() => {
            void runCalculate();
          }}
          disabled={!canCalculate || isCalculating}
        >
          <Calculator className="mr-1.5 h-4 w-4 text-ui-primary" />
          {isCalculating ? "計算中..." : "計算する"}
        </Button>
      }
    >
      <div className="rounded-md border border-ui-border1/80 bg-ui-layer1 px-4 py-3.5">
        <p className="text-xs tracking-[0.08em] text-ui-text3">全体成功率</p>
        <p className={overallRateValueClassName}>
          {result?.overallProbability ?? "0.00"}%
          {overallRateDiff ? (
            <span
              className={`ml-2 text-sm font-numeric tabular-nums ${overallRateDiff.className}`}
            >
              ({overallRateDiff.text})
            </span>
          ) : null}
        </p>
        {result ? (
          <Badge className="mt-2">{toModeLabel(result.mode)}</Badge>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 rounded-md border border-ui-border1/70 bg-ui-layer2/60 px-2.5 py-2">
          <div className="space-y-0.5">
            <p className="text-xs tracking-wider text-ui-text3">
              パターン別成立率
            </p>
            <p className="text-[11px] text-ui-tone2">
              {patterns.length > 0 ? `${patterns.length}件` : "パターンなし"}・
              {isPatternRatesExpanded ? "表示中" : "非表示"}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 px-2.5 text-xs"
            aria-expanded={isPatternRatesExpanded}
            onClick={() => setIsPatternRatesExpanded((current) => !current)}
          >
            {isPatternRatesExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            {isPatternRatesExpanded ? "一覧を隠す" : "一覧を表示"}
          </Button>
        </div>
        {isPatternRatesExpanded ? (
          patterns.length === 0 ? (
            <p className="text-xs text-ui-text3">パターンがありません。</p>
          ) : (
            sortedPatterns.map(({ pattern, rate }, index) => {
              const rateDiff = isExactDiffEnabled
                ? resolveRateDiff(rate, previousPatternRateMap.get(pattern.uid))
                : null;

              return (
                <RateRow
                  key={pattern.uid}
                  index={index + 1}
                  name={pattern.name.trim() || "名称未設定"}
                  rate={rate}
                  diff={rateDiff}
                  isExcludedFromOverall={pattern.excludeFromOverall === true}
                />
              );
            })
          )
        ) : null}
      </div>

      {result?.vsBreakdown ? (
        <div className="space-y-2">
          <p className="text-xs tracking-wider text-ui-text3">
            対妨害シミュレーション内訳
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <VsBreakdownItem
              label="妨害なし成功"
              value={result.vsBreakdown.noDisruptionSuccessRate}
            />
            <VsBreakdownItem
              label="妨害あり突破成功"
              value={result.vsBreakdown.disruptedButPenetratedRate}
            />
            <VsBreakdownItem
              label="妨害あり失敗"
              value={result.vsBreakdown.disruptedAndFailedRate}
            />
          </div>
          {result.vsPenetrationCombinations != null &&
          result.vsPenetrationCombinations.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] text-ui-tone2">
                妨害あり突破成功の組み合わせ内訳
              </p>
              <div className="space-y-1.5">
                {result.vsPenetrationCombinations.map((entry) => (
                  <div
                    key={entry.combinationKey}
                    className="flex items-start justify-between gap-3 rounded-md border border-ui-border1/70 bg-ui-layer1 px-3 py-2.5"
                  >
                    <p className="min-w-0 text-sm leading-snug text-ui-text">
                      {entry.combinationLabel}
                    </p>
                    <div className="flex min-w-[11.5rem] shrink-0 flex-col items-end gap-1">
                      <div className="flex items-center gap-2 rounded-md border border-ui-border1/70 bg-ui-layer2/60 px-2 py-1">
                        <p className="text-[10px] tracking-wide text-ui-tone2">
                          発生率
                        </p>
                        <p
                          className={`text-xs text-ui-text ${percentageTextClassName}`}
                        >
                          {entry.occurrenceRate}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-md border border-ui-border1/70 bg-ui-layer2/60 px-2 py-1">
                        <p className="text-[10px] tracking-wide text-ui-tone2">
                          内成功率
                        </p>
                        <p
                          className={`text-xs text-ui-text ${percentageTextClassName}`}
                        >
                          {entry.successRate}%
                        </p>
                      </div>
                      <p
                        className={`text-[10px] text-ui-text3 ${percentageTextClassName}`}
                      >
                        回数 {entry.successCount}/{entry.occurrenceCount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {deckExceeded ? (
        <p className={uiDangerNoticeClassName}>
          デッキ枚数を超過しています（合計 {totalCardCount} 枚）。
        </p>
      ) : null}

      {errorMessage ? (
        <p className={uiDangerNoticeClassName}>{errorMessage}</p>
      ) : null}
    </SectionCard>
  );
};
