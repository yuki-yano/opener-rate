import type { TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-20 w-full rounded-md border border-ui-border1 bg-ui-layer1 px-3 py-2 text-sm text-ui-text shadow-sm outline-none transition",
        "placeholder:text-ui-tone2",
        "focus:border-ui-primary focus:ring-2 focus:ring-ui-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
