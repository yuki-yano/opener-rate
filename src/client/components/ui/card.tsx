import type { HTMLAttributes } from "react";

import { cn } from "../../lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-md border border-ui-surface0 bg-ui-mantle p-4 text-ui-text shadow-panel",
        className,
      )}
      {...props}
    />
  );
};
