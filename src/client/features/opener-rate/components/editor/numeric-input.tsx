import type { ComponentProps } from "react";
import { useState } from "react";

import { Input } from "../../../../components/ui";

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
  ...props
}: NumericInputProps) => {
  const [draftValue, setDraftValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Input
      {...props}
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

        const nextValue = clamp(parseIntOr(nextText, value), min, max);
        onValueChange(nextValue);
        setDraftValue(String(nextValue));
      }}
      onBlur={(event) => {
        setIsFocused(false);
        const nextValue = clamp(parseIntOr(event.target.value, 0), min, max);
        onValueChange(nextValue);
        setDraftValue(String(nextValue));
        onBlur?.(event);
      }}
    />
  );
};
