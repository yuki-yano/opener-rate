import { Trash2 } from "lucide-react";

import {
  Button,
  Input,
  Select,
  type SelectOption,
} from "../../../../components/ui";
import type {
  CountCondition,
  PatternCondition,
} from "../../../../shared/apiSchemas";
import { MultiSelect, type MultiSelectOption } from "../common/multi-select";

type PatternConditionEditorProps = {
  condition: PatternCondition;
  index: number;
  cardOptions: MultiSelectOption[];
  onChange: (next: PatternCondition) => void;
  onRemove: () => void;
};

type BaseMode = "required" | "required_distinct" | "leave_deck" | "not_drawn";
type CountMode = "draw_total" | "remain_total";

const baseModeOptions: Array<{ value: BaseMode; label: string }> = [
  { value: "required", label: "指定カードを引く" },
  { value: "required_distinct", label: "指定カードを別名で引く" },
  { value: "leave_deck", label: "指定カードをデッキに残す" },
  { value: "not_drawn", label: "指定カードを引かない" },
];

const countModeOptions: Array<{ value: CountMode; label: string }> = [
  { value: "draw_total", label: "合計ドロー数" },
  { value: "remain_total", label: "合計残枚数" },
];

const allModeOptions: SelectOption[] = [
  ...baseModeOptions,
  ...countModeOptions,
];

const countOperatorOptions: SelectOption[] = [
  { value: "gte", label: "以上" },
  { value: "eq", label: "ちょうど" },
];

const countRuleModeOptions: SelectOption[] = [
  { value: "cap1", label: "種類ごと最大1枚" },
  { value: "raw", label: "実枚数" },
];

const isCountCondition = (
  condition: PatternCondition,
): condition is CountCondition =>
  condition.mode === "draw_total" || condition.mode === "remain_total";

const createDefaultBaseCondition = (mode: BaseMode): PatternCondition => ({
  mode,
  count: 1,
  uids: [],
});

const createDefaultCountCondition = (mode: CountMode): PatternCondition => ({
  mode,
  operator: "gte",
  threshold: 1,
  rules: [{ mode: "cap1", uids: [] }],
});

const switchConditionMode = (
  current: PatternCondition,
  nextMode: PatternCondition["mode"],
): PatternCondition => {
  if (nextMode === "draw_total" || nextMode === "remain_total") {
    if (isCountCondition(current)) {
      return {
        ...current,
        mode: nextMode,
      };
    }
    return createDefaultCountCondition(nextMode);
  }

  if (isCountCondition(current)) {
    return createDefaultBaseCondition(nextMode);
  }

  return {
    ...current,
    mode: nextMode,
  };
};

const toInt = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

export const PatternConditionEditor = ({
  condition,
  index,
  cardOptions,
  onChange,
  onRemove,
}: PatternConditionEditorProps) => {
  return (
    <div className="min-w-0 space-y-2 rounded-md border border-latte-surface1/80 bg-latte-base/65 p-2.5">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] items-center gap-2">
        <Select
          ariaLabel={`条件${index + 1}の種類`}
          triggerClassName="h-9"
          value={condition.mode}
          options={allModeOptions}
          onChange={(next) =>
            onChange(
              switchConditionMode(condition, next as PatternCondition["mode"]),
            )
          }
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="条件削除"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-latte-red" />
        </Button>
      </div>

      {!isCountCondition(condition) ? (
        <div className="grid min-w-0 gap-2 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
          <label className="space-y-1.5 text-xs text-latte-subtext0">
            必要枚数
            <Input
              className="h-9"
              type="number"
              min={1}
              max={60}
              value={condition.count}
              onChange={(event) =>
                onChange({
                  ...condition,
                  count: Math.max(
                    1,
                    Math.min(60, toInt(event.target.value, condition.count)),
                  ),
                })
              }
            />
          </label>
          <label className="min-w-0 space-y-1.5 text-xs text-latte-subtext0">
            対象カード
            <MultiSelect
              options={cardOptions}
              value={condition.uids}
              onChange={(next) =>
                onChange({
                  ...condition,
                  uids: next,
                })
              }
              placeholder="対象カードを選択"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid min-w-0 gap-2 sm:grid-cols-[8.5rem_8.5rem]">
            <label className="space-y-1.5 text-xs text-latte-subtext0">
              判定
              <Select
                ariaLabel={`条件${index + 1}の判定`}
                triggerClassName="h-9"
                value={condition.operator}
                options={countOperatorOptions}
                onChange={(next) =>
                  onChange({
                    ...condition,
                    operator: next === "eq" ? "eq" : "gte",
                  })
                }
              />
            </label>
            <label className="space-y-1.5 text-xs text-latte-subtext0">
              しきい値
              <Input
                className="h-9"
                type="number"
                min={0}
                max={60}
                value={condition.threshold}
                onChange={(event) =>
                  onChange({
                    ...condition,
                    threshold: Math.max(
                      0,
                      Math.min(
                        60,
                        toInt(event.target.value, condition.threshold),
                      ),
                    ),
                  })
                }
              />
            </label>
            <div className="flex min-w-0 items-end sm:col-span-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full px-2 text-[11px] sm:w-auto sm:px-3 sm:text-xs"
                onClick={() =>
                  onChange({
                    ...condition,
                    rules: [...condition.rules, { mode: "cap1", uids: [] }],
                  })
                }
              >
                集計ルール追加
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            {condition.rules.map((rule, ruleIndex) => (
              <div
                key={`${index}-rule-${ruleIndex}`}
                className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)_2rem] items-center gap-2 rounded-md border border-latte-surface1/70 bg-latte-crust/72 p-2"
              >
                <Select
                  ariaLabel={`条件${index + 1}ルール${ruleIndex + 1}の集計方式`}
                  triggerClassName="h-9"
                  value={rule.mode}
                  options={countRuleModeOptions}
                  onChange={(next) =>
                    onChange({
                      ...condition,
                      rules: condition.rules.map((target, idx) =>
                        idx === ruleIndex
                          ? {
                              ...target,
                              mode: next === "raw" ? "raw" : "cap1",
                            }
                          : target,
                      ),
                    })
                  }
                />

                <MultiSelect
                  options={cardOptions}
                  value={rule.uids}
                  onChange={(next) =>
                    onChange({
                      ...condition,
                      rules: condition.rules.map((target, idx) =>
                        idx === ruleIndex ? { ...target, uids: next } : target,
                      ),
                    })
                  }
                  placeholder="ルール対象を選択"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="ルール削除"
                  onClick={() =>
                    onChange({
                      ...condition,
                      rules:
                        condition.rules.length <= 1
                          ? condition.rules
                          : condition.rules.filter(
                              (_, idx) => idx !== ruleIndex,
                            ),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 text-latte-red" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
