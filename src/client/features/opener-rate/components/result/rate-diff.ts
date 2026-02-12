export type RateDiff = {
  className: string;
  text: string;
};

export const rateBadgeClassName =
  "min-w-[5rem] justify-center px-2.5 py-1 text-sm tabular-nums";

const excludedPatternRateBadgeClassName =
  "border-ui-yellow/60 bg-ui-yellow/16 text-ui-yellow shadow-[inset_0_0_0_1px_rgb(var(--theme-yellow)/0.22)]";

const diffEpsilon = 0.005;

export const resolvePatternRateBadgeClassName = (
  isExcludedFromOverall: boolean,
) =>
  isExcludedFromOverall
    ? `${rateBadgeClassName} ${excludedPatternRateBadgeClassName}`
    : rateBadgeClassName;

export const resolveRateDiff = (
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
