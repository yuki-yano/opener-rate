import type { HTMLAttributes } from "react";

import { cn } from "../../lib/cn";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "muted" | "danger" | "success";
};

export const Badge = ({
  className,
  variant = "default",
  ...props
}: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" &&
          "bg-latte-lavender/20 text-latte-lavender border border-latte-lavender/35",
        variant === "muted" &&
          "bg-latte-surface0/60 text-latte-subtext1 border border-latte-surface1",
        variant === "danger" &&
          "bg-latte-red/20 text-latte-red border border-latte-red/35",
        variant === "success" &&
          "bg-latte-green/20 text-latte-green border border-latte-green/35",
        className,
      )}
      {...props}
    />
  );
};
