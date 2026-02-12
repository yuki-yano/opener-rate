export type RateDiff = {
  className: string;
  text: string;
};

export const rateBadgeClassName =
  "min-w-[5rem] justify-center px-2.5 py-1 text-sm tabular-nums";

const diffEpsilon = 0.005;

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
