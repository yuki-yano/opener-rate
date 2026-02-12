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
          "border-ui-primary/35 bg-ui-primary/12 text-ui-primary",
        variant === "muted" && "border-ui-border1 bg-ui-layer2 text-ui-text2",
        variant === "danger" && "border-ui-red/35 bg-ui-red/12 text-ui-red",
        variant === "success" &&
          "border-ui-green/35 bg-ui-green/12 text-ui-green",
        className,
      )}
      {...props}
    />
  );
};
