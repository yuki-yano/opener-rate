import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border border-ui-border1 bg-ui-layer1 px-3 text-sm text-ui-text shadow-sm outline-none transition",
          "placeholder:text-ui-tone2",
          "focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
