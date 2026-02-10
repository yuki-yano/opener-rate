import type { HTMLAttributes } from "react";

import { cn } from "../../lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border border-latte-surface0 bg-latte-mantle p-4 text-latte-text shadow-sm",
        className,
      )}
      {...props}
    />
  );
};
