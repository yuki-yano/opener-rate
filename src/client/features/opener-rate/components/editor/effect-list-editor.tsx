import { Trash2 } from "lucide-react";

import { Button, Select } from "../../../../components/ui";
import type { SubPatternEffect } from "../../../../../shared/apiSchemas";
import type { MultiSelectOption } from "../common/multi-select";
import { MultiSelect } from "../common/multi-select";
import { effectTypeOptions } from "./effect-utils";
import { NumericInput } from "./numeric-input";

type EffectListEditorProps = {
  effects: SubPatternEffect[];
  labelOptions: MultiSelectOption[];
  penetrationCategoryOptions: MultiSelectOption[];
  onAdd: () => void;
  onSwitchType: (index: number, nextType: SubPatternEffect["type"]) => void;
  onRemove: (index: number) => void;
  onChangeLabels: (index: number, next: string[]) => void;
  onChangePenetrationCategories: (index: number, next: string[]) => void;
  onChangePenetrationAmount: (index: number, nextAmount: number) => void;
};

export const EffectListEditor = ({
  effects,
  labelOptions,
  penetrationCategoryOptions,
  onAdd,
  onSwitchType,
  onRemove,
  onChangeLabels,
  onChangePenetrationCategories,
  onChangePenetrationAmount,
}: EffectListEditorProps) => {
  return (
    <div className="space-y-2 rounded-md border border-ui-surface0/70 bg-ui-mantle/85 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ui-subtext0">効果</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs"
          onClick={onAdd}
        >
          効果追加
        </Button>
      </div>

      {effects.length === 0 ? (
        <p className="text-xs text-ui-overlay1">
          効果がありません。「効果追加」から作成してください。
        </p>
      ) : (
        <div className="space-y-2">
          {effects.map((effect, effectIndex) => (
            <div
              key={`effect-${effectIndex}`}
              className="grid min-w-0 gap-2 rounded-md border border-ui-surface0/70 bg-ui-crust/55 p-2.5"
            >
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] items-start gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_2rem] sm:items-center">
                <Select
                  ariaLabel={`効果${effectIndex + 1}種類`}
                  triggerClassName="h-9"
                  value={effect.type}
                  options={effectTypeOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  onChange={(next) =>
                    onSwitchType(
                      effectIndex,
                      next === "add_label" ? "add_label" : "add_penetration",
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 justify-self-end sm:col-start-3 sm:justify-self-auto"
                  aria-label="効果削除"
                  onClick={() => onRemove(effectIndex)}
                >
                  <Trash2 className="h-4 w-4 text-ui-red" />
                </Button>
                {effect.type === "add_label" ? (
                  <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                    <MultiSelect
                      options={labelOptions}
                      value={effect.labelUids}
                      placeholder="付与ラベルを選択"
                      emptyText="有効なラベルがありません"
                      onChange={(next) => onChangeLabels(effectIndex, next)}
                    />
                  </div>
                ) : (
                  <div className="col-span-2 row-start-2 grid min-w-0 gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                    <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_8rem]">
                      <MultiSelect
                        options={penetrationCategoryOptions}
                        value={effect.disruptionCategoryUids}
                        placeholder="対象妨害カテゴリを選択"
                        emptyText="有効な妨害カテゴリがありません"
                        onChange={(next) =>
                          onChangePenetrationCategories(effectIndex, next)
                        }
                      />
                      <NumericInput
                        className="h-9"
                        value={effect.amount}
                        min={1}
                        max={20}
                        placeholder="加算量"
                        onValueChange={(nextValue) =>
                          onChangePenetrationAmount(effectIndex, nextValue)
                        }
                      />
                    </div>
                    <p className="text-[11px] text-ui-subtext0">
                      対象妨害カテゴリは複数選択できます。
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
