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
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium",
        variant === "default" &&
          "border-latte-blue/35 bg-latte-blue/12 text-latte-blue",
        variant === "muted" &&
          "border-latte-surface0 bg-latte-crust text-latte-subtext1",
        variant === "danger" &&
          "border-latte-red/35 bg-latte-red/12 text-latte-red",
        variant === "success" &&
          "border-latte-green/35 bg-latte-green/12 text-latte-green",
        className,
      )}
      {...props}
    />
  );
};
