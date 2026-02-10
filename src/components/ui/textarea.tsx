import type { TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-20 w-full rounded-md border border-latte-surface1 bg-latte-crust px-3 py-2 text-sm text-latte-text shadow-sm outline-none transition",
        "placeholder:text-latte-overlay1",
        "focus:border-latte-blue focus:ring-2 focus:ring-latte-blue/25",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
