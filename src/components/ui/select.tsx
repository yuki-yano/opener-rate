import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (nextValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  listClassName?: string;
  ariaLabel?: string;
};

export const Select = ({
  value,
  options,
  onChange,
  placeholder = "選択してください",
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  listClassName,
  ariaLabel,
}: SelectProps) => {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  return (
    <div className={cn("min-w-0", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            disabled={disabled}
            className={cn(
              "h-10 w-full justify-between px-3 text-left text-sm font-normal",
              !selectedOption && "text-latte-overlay1",
              triggerClassName,
            )}
          >
            <span className="truncate">
              {selectedOption?.label ?? placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-latte-overlay1" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={cn(
            "w-[min(var(--radix-popover-trigger-width),calc(100vw-1rem))] max-w-[calc(100vw-1rem)] p-1",
            contentClassName,
          )}
        >
          <div
            role="listbox"
            className={cn("max-h-56 overflow-y-auto", listClassName)}
          >
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={option.disabled}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-latte-text transition",
                    "hover:bg-latte-surface0/70",
                    "focus-visible:bg-latte-surface0/80 focus-visible:outline-none",
                    selected && "bg-latte-surface0/80",
                    option.disabled && "cursor-not-allowed opacity-50",
                  )}
                  onClick={() => {
                    if (option.disabled) return;
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span
                    className={cn(
                      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-latte-surface1",
                      selected &&
                        "border-latte-blue bg-latte-blue/20 text-latte-blue",
                    )}
                  >
                    <Check
                      className={cn("h-3 w-3", !selected && "opacity-0")}
                    />
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
