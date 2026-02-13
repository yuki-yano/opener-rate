import { Trash2 } from "lucide-react";

import { Button, Select } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import type { SubPatternEffect } from "../../../../../shared/apiSchemas";
import type { MultiSelectOption } from "../common/multi-select";
import { MultiSelect } from "../common/multi-select";
import { editorFieldLabelClassName } from "./editor-ui";
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
    <div className="space-y-2 rounded-md border border-ui-border1/70 bg-ui-layer1/85 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-ui-text3">効果</p>
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
        <p className="text-xs text-ui-tone2">
          効果がありません。「効果追加」から作成してください。
        </p>
      ) : (
        <div className="space-y-2">
          {effects.map((effect, effectIndex) => {
            const isAddLabel = effect.type === "add_label";
            return (
              <div
                key={`effect-${effectIndex}`}
                className={cn(
                  "grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] gap-x-2 gap-y-2 rounded-md border border-ui-border1/70 bg-ui-layer2/55 p-2.5",
                  isAddLabel &&
                    "sm:grid-cols-[10rem_minmax(0,1fr)_2rem] sm:items-end",
                )}
              >
                <span
                  className={cn(
                    "col-start-1 row-start-1 text-xs text-ui-text3",
                    isAddLabel && "sm:hidden",
                  )}
                >
                  効果種別
                </span>
                <Select
                  ariaLabel={`効果${effectIndex + 1}種類`}
                  className={cn(
                    "col-start-1 row-start-2 min-w-0",
                    isAddLabel && "sm:col-start-1 sm:row-start-1",
                  )}
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
                  className={cn(
                    "col-start-2 row-start-2 h-8 w-8 self-center justify-self-end",
                    isAddLabel && "sm:col-start-3 sm:row-start-1",
                  )}
                  aria-label="効果削除"
                  onClick={() => onRemove(effectIndex)}
                >
                  <Trash2 className="h-4 w-4 text-ui-red" />
                </Button>
                {effect.type === "add_label" ? (
                  <label
                    className={cn(
                      `col-start-1 row-start-3 min-w-0 ${editorFieldLabelClassName}`,
                      "sm:col-start-2 sm:row-start-1",
                    )}
                  >
                    <span className="sm:sr-only">付与ラベル</span>
                    <MultiSelect
                      options={labelOptions}
                      value={effect.labelUids}
                      placeholder="付与ラベルを選択"
                      emptyText="有効なラベルがありません"
                      onChange={(next) => onChangeLabels(effectIndex, next)}
                    />
                  </label>
                ) : (
                  <div className="col-start-1 row-start-3 space-y-1.5">
                    <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_8rem]">
                      <label className={`min-w-0 ${editorFieldLabelClassName}`}>
                        <span>対象妨害カテゴリ</span>
                        <MultiSelect
                          options={penetrationCategoryOptions}
                          value={effect.disruptionCategoryUids}
                          placeholder="対象妨害カテゴリを選択"
                          emptyText="有効な妨害カテゴリがありません"
                          onChange={(next) =>
                            onChangePenetrationCategories(effectIndex, next)
                          }
                        />
                      </label>
                      <label className={`min-w-0 ${editorFieldLabelClassName}`}>
                        <span>加算量</span>
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
                      </label>
                    </div>
                    <p className="text-[11px] text-ui-text3">
                      対象妨害カテゴリは複数選択できます。
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
