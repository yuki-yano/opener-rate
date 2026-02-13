import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/ui";
import {
  selectCheckIndicatorBaseClassName,
  selectCheckIndicatorSelectedClassName,
  selectRightRailClassName,
  selectTriggerFocusClassName,
  selectTriggerInteractionClassName,
  selectTriggerLayoutClassName,
} from "../../../../components/ui/select-style";
import { cn } from "../../../../lib/cn";

export type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  enableBulkActions?: boolean;
  selectAllLabel?: string;
  clearAllLabel?: string;
};

const toSearchableValue = (option: MultiSelectOption) =>
  `${option.label}::${option.value}`;

export const MultiSelect = ({
  options,
  value,
  onChange,
  placeholder = "項目を選択",
  emptyText = "候補がありません",
  disabled = false,
  enableBulkActions = false,
  selectAllLabel = "全選択",
  clearAllLabel = "全解除",
}: MultiSelectProps) => {
  const [open, setOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedOptions = useMemo(
    () => options.filter((option) => selectedSet.has(option.value)),
    [options, selectedSet],
  );

  const handleToggle = (targetValue: string) => {
    if (selectedSet.has(targetValue)) {
      onChange(value.filter((entry) => entry !== targetValue));
      return;
    }
    onChange([...value, targetValue]);
  };

  const canSelectAll =
    options.length > 0 && selectedOptions.length < options.length;
  const canClearAll = selectedOptions.length > 0;

  const handleSelectAll = () => {
    if (!canSelectAll) return;
    onChange(options.map((option) => option.value));
  };

  const handleClearAll = () => {
    if (!canClearAll) return;
    onChange([]);
  };

  return (
    <div className="min-w-0 space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-auto min-h-9 w-full text-sm font-medium",
              selectTriggerLayoutClassName,
              selectTriggerInteractionClassName,
              selectTriggerFocusClassName,
              selectedOptions.length === 0 && "text-ui-tone2",
            )}
          >
            <span className="min-w-0 flex-1 py-1.5">
              {selectedOptions.length === 0 ? (
                <span className="block truncate">{placeholder}</span>
              ) : (
                <span className="flex flex-wrap gap-1">
                  {selectedOptions.map((option) => (
                    <span
                      key={`selected-${option.value}`}
                      className="inline-flex max-w-full items-center rounded-md border border-ui-border2 bg-ui-layer2 px-1.5 py-0.5 text-xs font-medium leading-5 text-ui-text2"
                    >
                      <span className="break-all">{option.label}</span>
                    </span>
                  ))}
                </span>
              )}
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
          className="max-h-[min(80dvh,32rem)] w-[min(var(--radix-popover-trigger-width),calc(100vw-1rem))] max-w-[calc(100vw-1rem)] overflow-hidden p-0"
        >
          <Command className="bg-ui-layer1 text-ui-text">
            {enableBulkActions ? (
              <div className="flex items-center justify-end gap-1 border-b border-ui-border1/70 px-2 py-1.5">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={disabled || !canSelectAll}
                  className="rounded-md px-2 py-1 text-xs font-medium text-ui-primary transition disabled:cursor-not-allowed disabled:text-ui-tone1"
                >
                  {selectAllLabel}
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={disabled || !canClearAll}
                  className="rounded-md px-2 py-1 text-xs font-medium text-ui-text3 transition disabled:cursor-not-allowed disabled:text-ui-tone1"
                >
                  {clearAllLabel}
                </button>
              </div>
            ) : null}
            <Command.List
              className="max-h-[min(60dvh,24rem)] overflow-y-auto overscroll-contain p-1 [touch-action:pan-y]"
              style={{ WebkitOverflowScrolling: "touch" }}
              onWheelCapture={(event) => event.stopPropagation()}
              onTouchMoveCapture={(event) => event.stopPropagation()}
            >
              <Command.Empty className="px-2 py-3 text-xs text-ui-text3">
                {emptyText}
              </Command.Empty>
              <Command.Group>
                {options.map((option) => {
                  const selected = selectedSet.has(option.value);
                  return (
                    <Command.Item
                      key={option.value}
                      value={toSearchableValue(option)}
                      onSelect={() => handleToggle(option.value)}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none transition data-[selected=true]:ring-1 data-[selected=true]:ring-ui-border1/65"
                    >
                      <span
                        className={cn(
                          selectCheckIndicatorBaseClassName,
                          selected && selectCheckIndicatorSelectedClassName,
                        )}
                      >
                        <Check
                          className={cn("h-3 w-3", !selected && "opacity-0")}
                        />
                      </span>
                      <span className="truncate">{option.label}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            </Command.List>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
