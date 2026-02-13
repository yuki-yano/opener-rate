import type { ComponentProps } from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Input } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";

type NumericInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode" | "pattern"
> & {
  value: number;
  min?: number;
  max?: number;
  onValueChange: (nextValue: number) => void;
};

const numberOnlyPattern = /^\d*$/;

const clamp = (value: number, min?: number, max?: number) => {
  let next = value;
  if (min != null) {
    next = Math.max(min, next);
  }
  if (max != null) {
    next = Math.min(max, next);
  }
  return next;
};

const parseIntOr = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

export const NumericInput = ({
  value,
  min,
  max,
  onValueChange,
  onFocus,
  onBlur,
  className,
  onKeyDown,
  disabled,
  ...props
}: NumericInputProps) => {
  const [draftValue, setDraftValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const applyNextValue = (rawValue: number) => {
    const nextValue = clamp(rawValue, min, max);
    onValueChange(nextValue);
    setDraftValue(String(nextValue));
  };

  const handleStep = (step: 1 | -1) => {
    if (disabled) return;
    const baseValue = isFocused ? parseIntOr(draftValue, value) : value;
    applyNextValue(baseValue + step);
  };

  return (
    <div className={cn("relative h-9 w-full sm:w-14", className)}>
      <Input
        {...props}
        disabled={disabled}
        className="h-full w-full pr-7"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={isFocused ? draftValue : String(value)}
        onFocus={(event) => {
          setIsFocused(true);
          setDraftValue(String(value));
          onFocus?.(event);
        }}
        onChange={(event) => {
          const nextText = event.target.value;
          if (!numberOnlyPattern.test(nextText)) {
            return;
          }
          if (nextText.length === 0) {
            setDraftValue("");
            return;
          }

          applyNextValue(parseIntOr(nextText, value));
        }}
        onBlur={(event) => {
          setIsFocused(false);
          applyNextValue(parseIntOr(event.target.value, 0));
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            handleStep(1);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            handleStep(-1);
          }
          onKeyDown?.(event);
        }}
      />
      <div className="absolute inset-y-0 right-1 flex flex-col items-center justify-center gap-0.5">
        <div className="relative h-3.5 w-4">
          <button
            type="button"
            aria-label="値を増やす"
            disabled={disabled}
            className="group absolute -inset-1 inline-flex items-center justify-center rounded-md text-ui-text3 transition hover:text-ui-primary disabled:cursor-not-allowed disabled:opacity-50"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleStep(1)}
          >
            <span className="inline-flex h-3.5 w-4 items-center justify-center rounded-[4px] border border-ui-border1/80 bg-ui-layer2 transition group-hover:border-ui-primary/50">
              <ChevronUp className="h-3 w-3" />
            </span>
          </button>
        </div>
        <div className="relative h-3.5 w-4">
          <button
            type="button"
            aria-label="値を減らす"
            disabled={disabled}
            className="group absolute -inset-1 inline-flex items-center justify-center rounded-md text-ui-text3 transition hover:text-ui-primary disabled:cursor-not-allowed disabled:opacity-50"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleStep(-1)}
          >
            <span className="inline-flex h-3.5 w-4 items-center justify-center rounded-[4px] border border-ui-border1/80 bg-ui-layer2 transition group-hover:border-ui-primary/50">
              <ChevronDown className="h-3 w-3" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
