import type { TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-20 w-full rounded-md border border-ui-surface0 bg-ui-mantle px-3 py-2 text-sm text-ui-text shadow-sm outline-none transition",
        "placeholder:text-ui-overlay1",
        "focus:border-ui-blue focus:ring-2 focus:ring-ui-blue/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
