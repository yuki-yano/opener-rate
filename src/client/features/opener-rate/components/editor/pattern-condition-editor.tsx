import { Trash2 } from "lucide-react";

import { Button, Select, type SelectOption } from "../../../../components/ui";
import type {
  BaseMatchCountCondition,
  CountCondition,
  PatternCondition,
  SubPatternTriggerCondition,
} from "../../../../../shared/apiSchemas";
import { MultiSelect, type MultiSelectOption } from "../common/multi-select";
import { editorFieldLabelClassName } from "./editor-ui";
import { NumericInput } from "./numeric-input";

type PatternConditionEditorBaseProps = {
  index: number;
  cardOptions: MultiSelectOption[];
  onRemove: () => void;
};

type PatternConditionEditorPatternProps = PatternConditionEditorBaseProps & {
  scope?: "pattern";
  condition: PatternCondition;
  onChange: (next: PatternCondition) => void;
};

type PatternConditionEditorSubPatternProps = PatternConditionEditorBaseProps & {
  scope: "sub_pattern";
  condition: SubPatternTriggerCondition;
  onChange: (next: SubPatternTriggerCondition) => void;
};

type PatternConditionEditorProps =
  | PatternConditionEditorPatternProps
  | PatternConditionEditorSubPatternProps;

type EditableCondition = PatternCondition | SubPatternTriggerCondition;
type BaseMode = "required" | "required_distinct" | "leave_deck" | "not_drawn";
type CountMode = "draw_total" | "remain_total" | "base_match_total";

const baseModeOptions: Array<{ value: BaseMode; label: string }> = [
  { value: "required", label: "指定カードを引く" },
  { value: "required_distinct", label: "指定カードを別名で引く" },
  { value: "leave_deck", label: "指定カードをデッキに残す" },
  { value: "not_drawn", label: "指定カードを引かない" },
];

const countModeOptions: Array<{ value: CountMode; label: string }> = [
  { value: "draw_total", label: "合計ドロー数" },
  { value: "remain_total", label: "合計残枚数" },
  { value: "base_match_total", label: "パターン成立時に含む枚数" },
];

const countOperatorOptions: SelectOption[] = [
  { value: "gte", label: "以上" },
  { value: "eq", label: "ちょうど" },
];

const countRuleModeOptions: SelectOption[] = [
  { value: "cap1", label: "種類毎に1枚" },
  { value: "raw", label: "実枚数" },
];
const removeIconClassName = "h-4 w-4 text-ui-red";

const isCountCondition = (
  condition: EditableCondition,
): condition is CountCondition | BaseMatchCountCondition =>
  condition.mode === "draw_total" ||
  condition.mode === "remain_total" ||
  condition.mode === "base_match_total";

const createDefaultBaseCondition = (mode: BaseMode): EditableCondition => ({
  mode,
  count: 1,
  uids: [],
});

const createDefaultCountCondition = (mode: CountMode): EditableCondition => ({
  mode,
  operator: "gte",
  threshold: 1,
  rules: [{ mode: "cap1", uids: [] }],
});

const switchConditionMode = (
  current: EditableCondition,
  nextMode: EditableCondition["mode"],
  scope: "pattern" | "sub_pattern",
): EditableCondition => {
  if (nextMode === "base_match_total" && scope !== "sub_pattern") {
    return current;
  }

  if (
    nextMode === "draw_total" ||
    nextMode === "remain_total" ||
    nextMode === "base_match_total"
  ) {
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

export const PatternConditionEditor = ({
  condition,
  index,
  scope = "pattern",
  cardOptions,
  onChange,
  onRemove,
}: PatternConditionEditorProps) => {
  const modeOptions: SelectOption[] =
    scope === "sub_pattern"
      ? [...baseModeOptions, ...countModeOptions]
      : [
          ...baseModeOptions,
          ...countModeOptions.filter(
            (option) => option.value !== "base_match_total",
          ),
        ];

  const emitChange = (next: EditableCondition) => {
    if (scope === "sub_pattern") {
      (onChange as (next: SubPatternTriggerCondition) => void)(
        next as SubPatternTriggerCondition,
      );
      return;
    }

    (onChange as (next: PatternCondition) => void)(next as PatternCondition);
  };

  const conditionTypeField = (
    <label className={`min-w-0 ${editorFieldLabelClassName}`}>
      <span>条件</span>
      <Select
        ariaLabel={`条件${index + 1}の種類`}
        triggerClassName="h-9"
        listClassName="max-h-none overflow-visible"
        value={condition.mode}
        options={modeOptions}
        onChange={(next) =>
          emitChange(
            switchConditionMode(
              condition,
              next as EditableCondition["mode"],
              scope,
            ),
          )
        }
      />
    </label>
  );

  return (
    <div className="min-w-0 space-y-2 rounded-md border border-ui-border1/80 bg-ui-layer1 p-2.5">
      {!isCountCondition(condition) ? (
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_1.75rem] gap-x-1.5 gap-y-2 md:grid-cols-[minmax(0,1fr)_3.5rem_1.75rem]">
          <span className="col-start-1 row-start-1 text-xs text-ui-text3 md:col-start-2 md:row-start-1">
            必要枚数
          </span>
          <div className="col-start-1 row-start-2 min-w-0 md:col-start-2 md:row-start-2">
            <NumericInput
              className="h-9"
              value={condition.count}
              min={1}
              max={60}
              onValueChange={(nextValue) =>
                emitChange({
                  ...condition,
                  count: nextValue,
                })
              }
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="col-start-2 row-start-2 h-7 w-7 self-center justify-self-end md:col-start-3 md:row-start-2"
            aria-label="条件削除"
            onClick={onRemove}
          >
            <Trash2 className={removeIconClassName} />
          </Button>
          <span className="col-start-1 row-start-3 text-xs text-ui-text3 md:col-start-1 md:row-start-1">
            対象カード
          </span>
          <div className="col-start-1 row-start-4 min-w-0 md:col-start-1 md:row-start-2">
            <MultiSelect
              options={cardOptions}
              value={condition.uids}
              triggerClassName="min-h-9"
              onChange={(next) =>
                emitChange({
                  ...condition,
                  uids: next,
                })
              }
              placeholder="対象カードを選択"
            />
          </div>
          <div className="col-start-1 row-start-5 min-w-0 md:col-span-2 md:row-start-3">
            {conditionTypeField}
          </div>
        </div>
      ) : (
        <div className="min-w-0 space-y-2">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] gap-x-2 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2rem]">
            <span className="col-start-1 row-start-1 text-xs text-ui-text3 sm:col-start-1 sm:row-start-1">
              しきい値
            </span>
            <div className="col-start-1 row-start-2 min-w-0 sm:col-start-1 sm:row-start-2">
              <NumericInput
                className="h-9 sm:w-full"
                value={condition.threshold}
                min={0}
                max={60}
                onValueChange={(nextValue) =>
                  emitChange({
                    ...condition,
                    threshold: nextValue,
                  })
                }
              />
            </div>
            <span className="col-start-1 row-start-3 text-xs text-ui-text3 sm:col-start-2 sm:row-start-1">
              判定
            </span>
            <div className="col-start-1 row-start-4 min-w-0 sm:col-start-2 sm:row-start-2">
              <Select
                ariaLabel={`条件${index + 1}の判定`}
                triggerClassName="h-9"
                value={condition.operator}
                options={countOperatorOptions}
                onChange={(next) =>
                  emitChange({
                    ...condition,
                    operator: next === "eq" ? "eq" : "gte",
                  })
                }
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="col-start-2 row-start-4 h-8 w-8 justify-self-end self-center sm:col-start-3 sm:row-start-2"
              aria-label="条件削除"
              onClick={onRemove}
            >
              <Trash2 className={removeIconClassName} />
            </Button>
            <div className="col-start-1 row-start-5 min-w-0 sm:col-span-2 sm:row-start-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full whitespace-nowrap px-2 text-[11px] sm:w-auto sm:px-3 sm:text-xs"
                onClick={() =>
                  emitChange({
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
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] gap-2 rounded-md border border-ui-border1/70 bg-ui-layer2/60 p-2.5"
              >
                <Select
                  ariaLabel={`条件${index + 1}ルール${ruleIndex + 1}の集計方式`}
                  className="col-start-1 row-start-1 min-w-0"
                  triggerClassName="h-9 whitespace-nowrap"
                  value={rule.mode}
                  options={countRuleModeOptions}
                  onChange={(next) =>
                    emitChange({
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

                <div className="col-start-1 row-start-2 min-w-0">
                  <MultiSelect
                    options={cardOptions}
                    value={rule.uids}
                    onChange={(next) =>
                      emitChange({
                        ...condition,
                        rules: condition.rules.map((target, idx) =>
                          idx === ruleIndex
                            ? { ...target, uids: next }
                            : target,
                        ),
                      })
                    }
                    placeholder="ルール対象を選択"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="col-start-2 row-start-1 h-8 w-8 justify-self-end"
                  aria-label="ルール削除"
                  onClick={() =>
                    emitChange({
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
                  <Trash2 className={removeIconClassName} />
                </Button>
              </div>
            ))}
          </div>

          {conditionTypeField}
        </div>
      )}
    </div>
  );
};
