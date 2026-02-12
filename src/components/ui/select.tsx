import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  selectRightRailClassName,
  selectTriggerFocusClassName,
} from "./select-style";

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
              "h-10 w-full items-stretch justify-between overflow-hidden pl-3 pr-0 text-left text-sm font-normal",
              selectTriggerFocusClassName,
              !selectedOption && "text-ui-overlay1",
              triggerClassName,
            )}
          >
            <span className="min-w-0 flex-1 self-center truncate">
              {selectedOption?.label ?? placeholder}
            </span>
            <span className={selectRightRailClassName}>
              <ChevronsUpDown className="h-4 w-4" />
            </span>
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
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-ui-text transition",
                    "hover:bg-ui-crust",
                    "focus-visible:bg-ui-crust focus-visible:outline-none",
                    selected && "bg-ui-crust",
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
                      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-ui-surface1",
                      selected && "border-ui-blue bg-ui-blue/16 text-ui-blue",
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
