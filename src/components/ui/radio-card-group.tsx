import { cn } from "../../lib/cn";
import { RadioGroup, RadioGroupItem } from "./radio-group";

export type RadioCardOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type RadioCardGroupProps<T extends string> = {
  name: string;
  value: T;
  options: readonly RadioCardOption<T>[];
  onChange: (next: T) => void;
  disabled?: boolean;
  className?: string;
};

export const RadioCardGroup = <T extends string>({
  name,
  value,
  options,
  onChange,
  disabled = false,
  className,
}: RadioCardGroupProps<T>) => {
  return (
    <RadioGroup
      name={name}
      value={value}
      disabled={disabled}
      onValueChange={(next) => onChange(next as T)}
      className={cn(
        "grid grid-cols-1 gap-1 rounded-md border border-ui-surface0/80 bg-ui-mantle p-1",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const itemDisabled = disabled || option.disabled === true;
        return (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors",
              selected
                ? "border-ui-blue/45 bg-ui-blue/12 text-ui-blue"
                : "border-ui-surface0/70 bg-ui-mantle text-ui-subtext0 hover:bg-ui-crust/45",
              itemDisabled &&
                "cursor-not-allowed opacity-60 hover:bg-ui-mantle",
            )}
          >
            <RadioGroupItem
              value={option.value}
              disabled={itemDisabled}
            />
            <span className="break-words leading-4">{option.label}</span>
          </label>
        );
      })}
    </RadioGroup>
  );
};
