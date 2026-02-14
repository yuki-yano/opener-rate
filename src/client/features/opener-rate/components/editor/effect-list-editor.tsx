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
            const isAddPenetration = effect.type === "add_penetration";
            return (
              <div
                key={`effect-${effectIndex}`}
                className={cn(
                  "grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] gap-x-2 gap-y-2 rounded-md border border-ui-border1/70 bg-ui-layer2/55 p-2.5",
                  isAddLabel &&
                    "sm:grid-cols-[10rem_minmax(0,1fr)_2rem] sm:grid-rows-[auto_auto] sm:items-start",
                  isAddPenetration &&
                    "lg:grid-cols-[10rem_minmax(0,1fr)_8rem_2rem] lg:grid-rows-[auto_auto_auto] lg:items-start",
                )}
              >
                <span className="col-start-1 row-start-1 text-xs text-ui-text3">
                  効果種別
                </span>
                <Select
                  ariaLabel={`効果${effectIndex + 1}種類`}
                  className={cn(
                    "col-start-1 row-start-2 min-w-0",
                    isAddLabel && "sm:col-start-1 sm:row-start-2",
                    isAddPenetration && "lg:col-start-1 lg:row-start-2",
                  )}
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
                    isAddLabel &&
                      "sm:col-start-3 sm:row-start-2 sm:mt-0.5 sm:self-start",
                    isAddPenetration &&
                      "lg:col-start-4 lg:row-start-2 lg:mt-0.5 lg:self-start",
                  )}
                  aria-label="効果削除"
                  onClick={() => onRemove(effectIndex)}
                >
                  <Trash2 className="h-4 w-4 text-ui-red" />
                </Button>
                {effect.type === "add_label" ? (
                  <>
                    <span className="col-start-1 row-start-3 text-xs text-ui-text3 sm:col-start-2 sm:row-start-1">
                      付与ラベル
                    </span>
                    <div
                      className={cn(
                        `col-start-1 row-start-4 min-w-0 ${editorFieldLabelClassName}`,
                        "sm:col-start-2 sm:row-start-2",
                      )}
                    >
                      <MultiSelect
                        options={labelOptions}
                        value={effect.labelUids}
                        placeholder="付与ラベルを選択"
                        emptyText="有効なラベルがありません"
                        onChange={(next) => onChangeLabels(effectIndex, next)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <span className="col-start-1 row-start-3 text-xs text-ui-text3 lg:col-start-2 lg:row-start-1">
                      対象妨害カテゴリ
                    </span>
                    <div className="col-start-1 row-start-4 min-w-0 lg:col-start-2 lg:row-start-2">
                      <MultiSelect
                        options={penetrationCategoryOptions}
                        value={effect.disruptionCategoryUids}
                        placeholder="対象妨害カテゴリを選択"
                        emptyText="有効な妨害カテゴリがありません"
                        onChange={(next) =>
                          onChangePenetrationCategories(effectIndex, next)
                        }
                      />
                    </div>
                    <span className="col-start-1 row-start-5 text-xs text-ui-text3 lg:col-start-3 lg:row-start-1">
                      加算量
                    </span>
                    <div className="col-start-1 row-start-6 min-w-0 lg:col-start-3 lg:row-start-2">
                      <NumericInput
                        className="sm:w-full"
                        value={effect.amount}
                        min={1}
                        max={20}
                        placeholder="加算量"
                        onValueChange={(nextValue) =>
                          onChangePenetrationAmount(effectIndex, nextValue)
                        }
                      />
                    </div>
                    <p className="col-start-1 row-start-7 text-[11px] text-ui-text3 lg:col-start-2 lg:row-start-3 lg:col-span-2">
                      対象妨害カテゴリは複数選択できます。
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
