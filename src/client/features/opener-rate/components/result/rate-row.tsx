import { Badge } from "../../../../components/ui";
import type { RateDiff } from "./rate-diff";
import { resolvePatternRateBadgeClassName } from "./rate-diff";

type RateRowProps = {
  index: number;
  name: string;
  rate: string;
  diff: RateDiff | null;
  isExcludedFromOverall: boolean;
};

export const RateRow = ({
  index,
  name,
  rate,
  diff,
  isExcludedFromOverall,
}: RateRowProps) => {
  return (
    <div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-ui-border1/70 bg-ui-layer1 px-3 py-2.5">
      <span className="text-xs tabular-nums text-ui-tone2">{index}</span>
      <p className="truncate text-sm text-ui-text">{name}</p>
      <div className="flex items-center gap-2">
        {diff ? (
          <span className={`text-xs ${diff.className}`}>({diff.text})</span>
        ) : null}
        <Badge
          className={resolvePatternRateBadgeClassName(isExcludedFromOverall)}
        >
          {rate}%
        </Badge>
      </div>
    </div>
  );
};
