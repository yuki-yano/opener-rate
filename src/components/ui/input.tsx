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
          "h-10 w-full rounded-md border border-ui-surface0 bg-ui-mantle px-3 text-sm text-ui-text shadow-sm outline-none transition",
          "placeholder:text-ui-overlay1",
          "focus:border-ui-blue focus:ring-2 focus:ring-ui-blue/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
