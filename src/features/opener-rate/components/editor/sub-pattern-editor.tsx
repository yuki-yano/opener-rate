import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  NotebookPen,
  Plus,
  Trash2,
} from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";

import {
  Button,
  Checkbox,
  Input,
  Select,
  Textarea,
} from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import type {
  SubPattern,
  SubPatternEffect,
} from "../../../../shared/apiSchemas";
import type { MultiSelectOption } from "../common/multi-select";
import { MultiSelect } from "../common/multi-select";
import { SortableList } from "../common/sortable-list";
import { SectionCard } from "../layout/section-card";
import {
  cardsAtom,
  disruptionCardsAtom,
  labelsAtom,
  patternsAtom,
  subPatternsAtom,
} from "../../state";
import { createLocalId } from "./create-local-id";
import { PatternConditionEditor } from "./pattern-condition-editor";

const createDefaultCondition = () => ({
  mode: "required" as const,
  count: 1,
  uids: [],
});

const createDefaultSubPatternName = (index: number) =>
  `サブパターン${index + 1}`;

const applyLimitOptions = [
  { value: "once_per_trial", label: "試行ごとに1回" },
  { value: "once_per_distinct_uid", label: "引いた種類ごとに1回" },
] as const;

const effectTypeOptions = [
  {
    value: "add_label",
    label: "ラベル付与",
  },
  {
    value: "add_penetration",
    label: "貫通値加算",
  },
];

const toInt = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const createDefaultEffect = (): SubPatternEffect => {
  return {
    type: "add_label",
    labelUids: [],
  };
};

const createDefaultPenetrationEffect = (): SubPatternEffect => {
  return {
    type: "add_penetration",
    disruptionCardUids: [],
    amount: 1,
  };
};

const switchEffectType = (
  current: SubPatternEffect,
  nextType: SubPatternEffect["type"],
): SubPatternEffect => {
  if (nextType === "add_label") {
    if (current.type === "add_label") {
      return current;
    }
    return {
      type: "add_label",
      labelUids: [],
    };
  }

  if (current.type === "add_penetration") {
    return current;
  }
  return createDefaultPenetrationEffect();
};

export const SubPatternEditor = () => {
  const [subPatterns, setSubPatterns] = useAtom(subPatternsAtom);
  const patterns = useAtomValue(patternsAtom);
  const disruptionCards = useAtomValue(disruptionCardsAtom);
  const labels = useAtomValue(labelsAtom);
  const cards = useAtomValue(cardsAtom);

  const [expandedMemoUids, setExpandedMemoUids] = useState<string[]>([]);
  const [collapsedUids, setCollapsedUids] = useState<string[]>(() =>
    subPatterns.map((subPattern) => subPattern.uid),
  );

  const patternOptions = useMemo<MultiSelectOption[]>(
    () =>
      patterns
        .filter((pattern) => pattern.name.trim().length > 0)
        .map((pattern) => ({
          value: pattern.uid,
          label: pattern.name,
        })),
    [patterns],
  );

  const labelOptions = useMemo<MultiSelectOption[]>(
    () =>
      labels
        .filter((label) => label.name.trim().length > 0)
        .map((label) => ({
          value: label.uid,
          label: label.name,
        })),
    [labels],
  );

  const cardOptions = useMemo<MultiSelectOption[]>(
    () =>
      cards
        .filter((card) => card.name.trim().length > 0)
        .map((card) => ({
          value: card.uid,
          label: card.name,
        })),
    [cards],
  );

  const penetrationDisruptionOptions = useMemo<MultiSelectOption[]>(
    () =>
      disruptionCards
        .filter((card) => card.name.trim().length > 0)
        .map((card) => ({
          value: card.uid,
          label: card.name,
        })),
    [disruptionCards],
  );

  const updateSubPattern = (
    uid: string,
    updater: (subPattern: SubPattern) => SubPattern,
  ) => {
    setSubPatterns((current) =>
      current.map((subPattern) =>
        subPattern.uid === uid ? updater(subPattern) : subPattern,
      ),
    );
  };

  const handleAddSubPattern = () => {
    const uid = createLocalId("sub_pattern");
    setSubPatterns((current) => [
      ...current,
      {
        uid,
        name: createDefaultSubPatternName(current.length),
        active: true,
        basePatternUids: [],
        triggerConditions: [createDefaultCondition()],
        triggerSourceUids: [],
        applyLimit: "once_per_trial",
        effects: [createDefaultEffect()],
        memo: "",
      },
    ]);
    setCollapsedUids((current) => current.filter((target) => target !== uid));
  };

  const toggleMemo = (uid: string) => {
    setExpandedMemoUids((current) =>
      current.includes(uid)
        ? current.filter((target) => target !== uid)
        : [...current, uid],
    );
  };

  const toggleCollapsed = (uid: string) => {
    setCollapsedUids((current) =>
      current.includes(uid)
        ? current.filter((target) => target !== uid)
        : [...current, uid],
    );
  };

  const handleExpandAll = () => {
    setCollapsedUids([]);
  };

  const handleCollapseAll = () => {
    setCollapsedUids(subPatterns.map((subPattern) => subPattern.uid));
  };

  return (
    <SectionCard
      title="サブパターン一覧"
      description="基礎パターン成立後に追加効果を適用します。"
      actions={
        <>
          <Button
            size="icon"
            variant="outline"
            onClick={handleExpandAll}
            aria-label="全て開く"
            title="全て開く"
          >
            <ChevronsDown className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleCollapseAll}
            aria-label="全て閉じる"
            title="全て閉じる"
          >
            <ChevronsUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddSubPattern}
            aria-label="サブパターン追加"
            title="サブパターン追加"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </>
      }
    >
      {subPatterns.length === 0 ? (
        <p className="rounded-md border border-dashed border-latte-surface1 px-3 py-4 text-xs text-latte-subtext0">
          サブパターンがありません。「サブパターン追加」から作成してください。
        </p>
      ) : null}

      <SortableList
        items={subPatterns}
        onReorder={(next) => setSubPatterns(next)}
        handleClassName="top-[1.625rem]"
        renderItem={(subPattern) => {
          const isNameEmpty = subPattern.name.trim().length === 0;
          const isMemoExpanded = expandedMemoUids.includes(subPattern.uid);
          const isExpanded = !collapsedUids.includes(subPattern.uid);
          return (
            <div
              className={cn(
                "relative min-w-0 space-y-2.5 rounded-lg border py-2.5 pl-9 pr-2.5 shadow-[0_1px_0_rgb(var(--ctp-base)/0.45)]",
                subPattern.active
                  ? "border-latte-blue/45 bg-latte-mantle/92"
                  : "border-latte-red/45 bg-latte-mantle/78",
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute left-2 z-10 h-8 w-5 rounded-md border border-latte-surface1 bg-latte-base/90 p-0 text-latte-subtext0 shadow-sm transition-colors duration-150 hover:border-latte-blue/60 hover:text-latte-blue",
                  isExpanded ? "top-1/2 -translate-y-1/2" : "top-[4.8125rem]",
                )}
                aria-label={isExpanded ? "折りたたむ" : "展開する"}
                onClick={() => toggleCollapsed(subPattern.uid)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>

              <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-latte-surface1/65 bg-latte-base/72 px-1.5 py-1">
                <Checkbox
                  checked={subPattern.active}
                  onChange={(event) =>
                    updateSubPattern(subPattern.uid, (target) => ({
                      ...target,
                      active: event.target.checked,
                    }))
                  }
                  aria-label="サブパターン有効切り替え"
                  className={cn(
                    "h-8 w-8 justify-center gap-0 border-transparent bg-latte-mantle/70 px-0 shadow-none",
                    subPattern.active ? "text-latte-blue" : "text-latte-red",
                  )}
                />

                <Input
                  className="h-9 border-latte-surface2/70 bg-latte-surface0/55 text-latte-text placeholder:text-latte-overlay1"
                  value={subPattern.name}
                  placeholder="サブパターン名（必須）"
                  onChange={(event) =>
                    updateSubPattern(subPattern.uid, (target) => ({
                      ...target,
                      name: event.target.value,
                    }))
                  }
                />

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 border border-transparent",
                      isMemoExpanded && "text-latte-blue",
                    )}
                    aria-label="メモ表示切り替え"
                    onClick={() => {
                      if (!isExpanded) {
                        setCollapsedUids((current) =>
                          current.filter((target) => target !== subPattern.uid),
                        );
                      }
                      toggleMemo(subPattern.uid);
                    }}
                  >
                    <NotebookPen className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 border border-transparent"
                    aria-label="サブパターン削除"
                    onClick={() => {
                      setExpandedMemoUids((current) =>
                        current.filter((target) => target !== subPattern.uid),
                      );
                      setCollapsedUids((current) =>
                        current.filter((target) => target !== subPattern.uid),
                      );
                      setSubPatterns((current) =>
                        current.filter(
                          (target) => target.uid !== subPattern.uid,
                        ),
                      );
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-latte-red" />
                  </Button>
                </div>
              </div>

              {isNameEmpty ? (
                <p className="text-xs text-latte-red">
                  サブパターン名は必須です。空欄のままでは計算できません。
                </p>
              ) : null}

              {isExpanded ? (
                <>
                  <div className="grid min-w-0 gap-2 lg:grid-cols-2">
                    <label className="min-w-0 space-y-1.5 text-xs text-latte-subtext0">
                      対象基礎パターン
                      <MultiSelect
                        options={patternOptions}
                        value={subPattern.basePatternUids}
                        onChange={(next) =>
                          updateSubPattern(subPattern.uid, (target) => ({
                            ...target,
                            basePatternUids: next,
                          }))
                        }
                        enableBulkActions
                        selectAllLabel="全選択"
                        clearAllLabel="全解除"
                        placeholder="基礎パターンを選択"
                        emptyText="有効な基礎パターンがありません"
                      />
                    </label>

                    <label className="min-w-0 space-y-1.5 text-xs text-latte-subtext0">
                      発動元カード（種類数判定）
                      <MultiSelect
                        options={cardOptions}
                        value={subPattern.triggerSourceUids}
                        onChange={(next) =>
                          updateSubPattern(subPattern.uid, (target) => ({
                            ...target,
                            triggerSourceUids: next,
                          }))
                        }
                        placeholder="発動元カードを選択"
                        emptyText="有効なカードがありません"
                      />
                    </label>
                  </div>

                  <div className="grid min-w-0 gap-2 lg:grid-cols-[14rem_auto] lg:items-end">
                    <label className="space-y-1.5 text-xs text-latte-subtext0">
                      適用回数
                      <Select
                        ariaLabel="適用回数"
                        triggerClassName="h-9"
                        value={subPattern.applyLimit}
                        options={applyLimitOptions.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        onChange={(next) =>
                          updateSubPattern(subPattern.uid, (target) => ({
                            ...target,
                            applyLimit:
                              next === "once_per_distinct_uid"
                                ? "once_per_distinct_uid"
                                : "once_per_trial",
                          }))
                        }
                      />
                    </label>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 px-3 text-xs lg:mb-px"
                      onClick={() =>
                        updateSubPattern(subPattern.uid, (target) => ({
                          ...target,
                          triggerConditions: [
                            ...target.triggerConditions,
                            createDefaultCondition(),
                          ],
                        }))
                      }
                    >
                      条件追加
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {subPattern.triggerConditions.length === 0 ? (
                      <p className="text-xs text-latte-overlay1">
                        条件がありません。「条件追加」から作成してください。
                      </p>
                    ) : null}

                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3">
                      {subPattern.triggerConditions.map(
                        (condition, conditionIndex) => (
                          <div
                            key={`${subPattern.uid}-trigger-${conditionIndex}`}
                            className="min-w-0"
                          >
                            <PatternConditionEditor
                              condition={condition}
                              index={conditionIndex}
                              cardOptions={cardOptions}
                              onChange={(nextCondition) =>
                                updateSubPattern(subPattern.uid, (target) => ({
                                  ...target,
                                  triggerConditions:
                                    target.triggerConditions.map(
                                      (entry, idx) =>
                                        idx === conditionIndex
                                          ? nextCondition
                                          : entry,
                                    ),
                                }))
                              }
                              onRemove={() =>
                                updateSubPattern(subPattern.uid, (target) => ({
                                  ...target,
                                  triggerConditions:
                                    target.triggerConditions.filter(
                                      (_, idx) => idx !== conditionIndex,
                                    ),
                                }))
                              }
                            />
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border border-latte-surface1/75 bg-latte-base/60 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-latte-subtext0">効果</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        onClick={() =>
                          updateSubPattern(subPattern.uid, (target) => ({
                            ...target,
                            effects: [...target.effects, createDefaultEffect()],
                          }))
                        }
                      >
                        効果追加
                      </Button>
                    </div>

                    {subPattern.effects.length === 0 ? (
                      <p className="text-xs text-latte-overlay1">
                        効果がありません。「効果追加」から作成してください。
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {subPattern.effects.map((effect, effectIndex) => (
                          <div
                            key={`${subPattern.uid}-effect-${effectIndex}`}
                            className="grid min-w-0 gap-2 rounded-md border border-latte-surface1/70 bg-latte-crust/72 p-2"
                          >
                            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] items-start gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_2rem] sm:items-center">
                              <Select
                                ariaLabel={`効果${effectIndex + 1}種類`}
                                triggerClassName="h-9"
                                value={effect.type}
                                options={effectTypeOptions}
                                onChange={(next) =>
                                  updateSubPattern(
                                    subPattern.uid,
                                    (target) => ({
                                      ...target,
                                      effects: target.effects.map(
                                        (entry, idx) =>
                                          idx === effectIndex
                                            ? switchEffectType(
                                                entry,
                                                next === "add_label"
                                                  ? "add_label"
                                                  : "add_penetration",
                                              )
                                            : entry,
                                      ),
                                    }),
                                  )
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 justify-self-end sm:col-start-3 sm:justify-self-auto"
                                aria-label="効果削除"
                                onClick={() =>
                                  updateSubPattern(
                                    subPattern.uid,
                                    (target) => ({
                                      ...target,
                                      effects: target.effects.filter(
                                        (_, idx) => idx !== effectIndex,
                                      ),
                                    }),
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4 text-latte-red" />
                              </Button>
                              {effect.type === "add_label" ? (
                                <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                                  <MultiSelect
                                    options={labelOptions}
                                    value={effect.labelUids}
                                    placeholder="付与ラベルを選択"
                                    emptyText="有効なラベルがありません"
                                    onChange={(next) =>
                                      updateSubPattern(
                                        subPattern.uid,
                                        (target) => ({
                                          ...target,
                                          effects: target.effects.map(
                                            (entry, idx) =>
                                              idx === effectIndex &&
                                              entry.type === "add_label"
                                                ? { ...entry, labelUids: next }
                                                : entry,
                                          ),
                                        }),
                                      )
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="col-span-2 row-start-2 grid min-w-0 gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                                  <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_8rem]">
                                    <MultiSelect
                                      options={penetrationDisruptionOptions}
                                      value={effect.disruptionCardUids}
                                      placeholder="対象妨害カードを選択"
                                      emptyText="有効な妨害カードがありません"
                                      onChange={(next) =>
                                        updateSubPattern(
                                          subPattern.uid,
                                          (target) => ({
                                            ...target,
                                            effects: target.effects.map(
                                              (entry, idx) =>
                                                idx === effectIndex &&
                                                entry.type === "add_penetration"
                                                  ? {
                                                      ...entry,
                                                      disruptionCardUids: next,
                                                    }
                                                  : entry,
                                            ),
                                          }),
                                        )
                                      }
                                    />
                                    <Input
                                      className="h-9"
                                      type="number"
                                      min={1}
                                      max={20}
                                      value={effect.amount}
                                      placeholder="加算量"
                                      onChange={(event) =>
                                        updateSubPattern(
                                          subPattern.uid,
                                          (target) => ({
                                            ...target,
                                            effects: target.effects.map(
                                              (entry, idx) =>
                                                idx === effectIndex &&
                                                entry.type === "add_penetration"
                                                  ? {
                                                      ...entry,
                                                      amount: Math.max(
                                                        1,
                                                        Math.min(
                                                          20,
                                                          toInt(
                                                            event.target.value,
                                                            entry.amount,
                                                          ),
                                                        ),
                                                      ),
                                                    }
                                                  : entry,
                                            ),
                                          }),
                                        )
                                      }
                                    />
                                  </div>
                                  <p className="text-[11px] text-latte-subtext0">
                                    対象妨害カードは複数選択できます。
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isMemoExpanded ? (
                    <div className="rounded-md border border-latte-surface1/75 bg-latte-base/60 p-2">
                      <Textarea
                        value={subPattern.memo}
                        placeholder="メモ"
                        rows={2}
                        onChange={(event) =>
                          updateSubPattern(subPattern.uid, (target) => ({
                            ...target,
                            memo: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-latte-surface1/70 bg-latte-base/58 px-2.5 py-2 text-xs text-latte-subtext0">
                  <span>条件: {subPattern.triggerConditions.length}</span>
                  <span>効果: {subPattern.effects.length}</span>
                </div>
              )}
            </div>
          );
        }}
      />
    </SectionCard>
  );
};
