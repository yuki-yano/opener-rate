import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: ReactNode;
  labelClassName?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, labelClassName, checked, ...props }, ref) => {
    return (
      <label
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-ui-surface0 bg-ui-mantle px-2 text-xs text-ui-subtext1 shadow-sm transition hover:border-ui-surface1",
          className,
        )}
      >
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            {...props}
          />
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-[4px] border border-ui-surface0 bg-ui-mantle text-transparent transition peer-checked:border-ui-blue peer-checked:bg-ui-blue/22 peer-checked:text-ui-blue">
            <Check className="h-3 w-3" />
          </span>
        </span>
        {label ? (
          <span className={cn("font-medium tracking-wide", labelClassName)}>
            {label}
          </span>
        ) : null}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
