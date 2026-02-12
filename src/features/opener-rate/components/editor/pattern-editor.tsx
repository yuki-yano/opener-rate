import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Copy,
  NotebookPen,
  Plus,
  Trash2,
} from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";

import {
  Button,
  Checkbox,
  Input,
  Select,
  Textarea,
} from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import type { SubPatternEffect } from "../../../../shared/apiSchemas";
import type { MultiSelectOption } from "../common/multi-select";
import { MultiSelect } from "../common/multi-select";
import {
  cardsAtom,
  disruptionCategoriesAtom,
  labelsAtom,
  patternsAtom,
} from "../../state";
import { SortableList } from "../common/sortable-list";
import { SectionCard } from "../layout/section-card";
import { createLocalId } from "./create-local-id";
import { createDuplicatedPattern } from "./duplicate-pattern";
import { PatternConditionEditor } from "./pattern-condition-editor";

const createDefaultCondition = () => ({
  mode: "required" as const,
  count: 1,
  uids: [],
});

const createDefaultPatternName = (index: number) => `パターン${index + 1}`;

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
    disruptionCategoryUids: [],
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

export const PatternEditor = () => {
  const [patterns, setPatterns] = useAtom(patternsAtom);
  const disruptionCategories = useAtomValue(disruptionCategoriesAtom);
  const labels = useAtomValue(labelsAtom);
  const cards = useAtomValue(cardsAtom);
  const [expandedMemoUids, setExpandedMemoUids] = useState<string[]>([]);
  const [collapsedPatternUids, setCollapsedPatternUids] = useState<string[]>(
    () => patterns.map((pattern) => pattern.uid),
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

  const cardOptions = useMemo<MultiSelectOption[]>(() => {
    return cards
      .filter((card) => card.name.trim().length > 0)
      .map((card) => ({
        value: card.uid,
        label: card.name,
      }));
  }, [cards]);
  const penetrationCategoryOptions = useMemo<MultiSelectOption[]>(
    () =>
      disruptionCategories
        .filter((category) => category.name.trim().length > 0)
        .map((category) => ({
          value: category.uid,
          label: category.name,
        })),
    [disruptionCategories],
  );
  useEffect(() => {
    const availableCategoryUids = new Set(
      penetrationCategoryOptions.map((option) => option.value),
    );
    setPatterns((current) => {
      let hasChanges = false;
      const next = current.map((pattern) => {
        const currentEffects = pattern.effects ?? [];
        let hasEffectChanges = false;
        const effects = currentEffects.map((effect) => {
          if (effect.type !== "add_penetration") return effect;
          const filtered = effect.disruptionCategoryUids.filter((uid) =>
            availableCategoryUids.has(uid),
          );
          if (filtered.length === effect.disruptionCategoryUids.length) {
            return effect;
          }
          hasEffectChanges = true;
          return { ...effect, disruptionCategoryUids: filtered };
        });
        if (!hasEffectChanges) return pattern;
        hasChanges = true;
        return { ...pattern, effects };
      });
      return hasChanges ? next : current;
    });
  }, [penetrationCategoryOptions, setPatterns]);

  const handleAddPattern = () => {
    const uid = createLocalId("pattern");
    setPatterns((current) => [
      ...current,
      {
        uid,
        name: createDefaultPatternName(current.length),
        active: true,
        excludeFromOverall: false,
        conditions: [createDefaultCondition()],
        labels: [],
        effects: [],
        memo: "",
      },
    ]);
    setCollapsedPatternUids((current) =>
      current.filter((target) => target !== uid),
    );
  };

  const handleDuplicatePattern = (sourceUid: string) => {
    const duplicateUid = createLocalId("pattern");
    setPatterns((current) => {
      const sourceIndex = current.findIndex(
        (pattern) => pattern.uid === sourceUid,
      );
      if (sourceIndex < 0) return current;
      return [
        ...current,
        createDuplicatedPattern({
          source: current[sourceIndex],
          nextUid: duplicateUid,
          fallbackName: createDefaultPatternName(sourceIndex),
        }),
      ];
    });
    setCollapsedPatternUids((current) =>
      current.filter((target) => target !== duplicateUid),
    );
  };

  const toggleMemo = (uid: string) => {
    setExpandedMemoUids((current) =>
      current.includes(uid)
        ? current.filter((target) => target !== uid)
        : [...current, uid],
    );
  };

  const toggleCollapsed = (uid: string) => {
    setCollapsedPatternUids((current) =>
      current.includes(uid)
        ? current.filter((target) => target !== uid)
        : [...current, uid],
    );
  };

  const handleExpandAll = () => {
    setCollapsedPatternUids([]);
  };

  const handleCollapseAll = () => {
    setCollapsedPatternUids(patterns.map((pattern) => pattern.uid));
  };

  return (
    <SectionCard
      title="パターン一覧"
      description="成功条件を定義します。条件種別ごとに詳細ルールを編集できます。"
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
          <span aria-hidden className="h-9 w-9 shrink-0" />
        </>
      }
      floatingActions={
        <Button
          size="icon"
          variant="outline"
          onClick={handleAddPattern}
          aria-label="パターン追加"
          title="パターン追加"
        >
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      {patterns.length === 0 ? (
        <p className="rounded-md border border-dashed border-ui-surface0/80 bg-ui-crust/45 px-3 py-4 text-xs text-ui-subtext0">
          パターンがありません。「パターン追加」から作成してください。
        </p>
      ) : null}

      <SortableList
        items={patterns}
        onReorder={(next) => setPatterns(next)}
        handleClassName="top-[2.1875rem] -translate-y-1/2"
        renderItem={(pattern) => {
          const isNameEmpty = pattern.name.trim().length === 0;
          const isMemoExpanded = expandedMemoUids.includes(pattern.uid);
          const isPatternExpanded = !collapsedPatternUids.includes(pattern.uid);
          const isPatternActive = pattern.active;
          const isExcludedFromOverall = pattern.excludeFromOverall === true;
          const patternEffects = pattern.effects ?? [];
          const summaryLabels = pattern.labels
            .map((label) =>
              labelOptions.find((entry) => entry.value === label.uid),
            )
            .filter((label): label is MultiSelectOption => label != null);

          return (
            <div
              className={cn(
                "relative min-w-0 space-y-2.5 rounded-md border bg-ui-crust/82 py-2.5 pl-9 pr-2.5 shadow-[0_1px_0_rgb(var(--theme-base)/0.45)]",
                isPatternActive ? "border-ui-blue/65" : "border-ui-red/65",
              )}
            >
              <div className="relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-ui-surface0/70 bg-ui-mantle px-2 py-1.5">
                <Checkbox
                  checked={pattern.active}
                  onChange={(event) =>
                    setPatterns((current) =>
                      current.map((target) =>
                        target.uid === pattern.uid
                          ? { ...target, active: event.target.checked }
                          : target,
                      ),
                    )
                  }
                  aria-label="パターン有効切り替え"
                  className={cn(
                    "h-8 w-8 justify-center gap-0 border-transparent bg-ui-crust/60 px-0 shadow-none",
                    isPatternActive ? "text-ui-blue" : "text-ui-red",
                  )}
                />

                <Input
                  className="h-9 border-ui-surface0/80 bg-ui-mantle text-ui-text placeholder:text-ui-overlay1"
                  value={pattern.name}
                  placeholder="パターン名（必須）"
                  onChange={(event) =>
                    setPatterns((current) =>
                      current.map((target) =>
                        target.uid === pattern.uid
                          ? { ...target, name: event.target.value }
                          : target,
                      ),
                    )
                  }
                />

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 border border-transparent",
                      isMemoExpanded && "text-ui-blue",
                    )}
                    aria-label="メモ表示切り替え"
                    onClick={() => {
                      if (!isPatternExpanded) {
                        setCollapsedPatternUids((current) =>
                          current.filter((target) => target !== pattern.uid),
                        );
                      }
                      toggleMemo(pattern.uid);
                    }}
                  >
                    <NotebookPen className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 border border-transparent"
                    aria-label="パターン複製"
                    onClick={() => handleDuplicatePattern(pattern.uid)}
                  >
                    <Copy className="h-4 w-4 text-ui-subtext0" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 border border-transparent"
                    aria-label="パターン削除"
                    onClick={() => {
                      setExpandedMemoUids((current) =>
                        current.filter((target) => target !== pattern.uid),
                      );
                      setCollapsedPatternUids((current) =>
                        current.filter((target) => target !== pattern.uid),
                      );
                      setPatterns((current) =>
                        current.filter((target) => target.uid !== pattern.uid),
                      );
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-ui-red" />
                  </Button>
                </div>
              </div>

              {isNameEmpty ? (
                <p className="text-xs text-ui-red">
                  パターン名は必須です。空欄のままでは計算できません。
                </p>
              ) : null}

              {isPatternExpanded ? (
                <div className="space-y-2.5 rounded-md border border-ui-surface0/70 bg-ui-crust/60 p-2.5">
                  <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <label className="min-w-0 space-y-1.5 text-xs text-ui-subtext0">
                      紐付けラベル
                      <MultiSelect
                        options={labelOptions}
                        value={pattern.labels.map((label) => label.uid)}
                        onChange={(next) =>
                          setPatterns((current) =>
                            current.map((target) =>
                              target.uid === pattern.uid
                                ? {
                                    ...target,
                                    labels: next.map((uid) => ({ uid })),
                                  }
                                : target,
                            ),
                          )
                        }
                        placeholder="ラベルを選択"
                        emptyText="有効なラベルがありません"
                      />
                    </label>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 px-3 text-xs lg:mb-px"
                      onClick={() =>
                        setPatterns((current) =>
                          current.map((target) =>
                            target.uid === pattern.uid
                              ? {
                                  ...target,
                                  conditions: [
                                    ...target.conditions,
                                    createDefaultCondition(),
                                  ],
                                }
                              : target,
                          ),
                        )
                      }
                    >
                      条件追加
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {pattern.conditions.length === 0 ? (
                      <p className="text-xs text-ui-overlay1">
                        条件がありません。「条件追加」から作成してください。
                      </p>
                    ) : null}

                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3">
                      {pattern.conditions.map((condition, conditionIndex) => (
                        <div
                          key={`${pattern.uid}-condition-${conditionIndex}`}
                          className="min-w-0"
                        >
                          <PatternConditionEditor
                            condition={condition}
                            index={conditionIndex}
                            cardOptions={cardOptions}
                            onChange={(nextCondition) =>
                              setPatterns((current) =>
                                current.map((target) =>
                                  target.uid === pattern.uid
                                    ? {
                                        ...target,
                                        conditions: target.conditions.map(
                                          (entry, idx) =>
                                            idx === conditionIndex
                                              ? nextCondition
                                              : entry,
                                        ),
                                      }
                                    : target,
                                ),
                              )
                            }
                            onRemove={() =>
                              setPatterns((current) =>
                                current.map((target) =>
                                  target.uid === pattern.uid
                                    ? {
                                        ...target,
                                        conditions: target.conditions.filter(
                                          (_, idx) => idx !== conditionIndex,
                                        ),
                                      }
                                    : target,
                                ),
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 rounded-md border border-ui-surface0/70 bg-ui-mantle/85 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-ui-subtext0">効果</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        onClick={() =>
                          setPatterns((current) =>
                            current.map((target) =>
                              target.uid === pattern.uid
                                ? {
                                    ...target,
                                    effects: [
                                      ...(target.effects ?? []),
                                      createDefaultEffect(),
                                    ],
                                  }
                                : target,
                            ),
                          )
                        }
                      >
                        効果追加
                      </Button>
                    </div>

                    {patternEffects.length === 0 ? (
                      <p className="text-xs text-ui-overlay1">
                        効果がありません。「効果追加」から作成してください。
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {patternEffects.map((effect, effectIndex) => (
                          <div
                            key={`${pattern.uid}-effect-${effectIndex}`}
                            className="grid min-w-0 gap-2 rounded-md border border-ui-surface0/70 bg-ui-crust/55 p-2.5"
                          >
                            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] items-start gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_2rem] sm:items-center">
                              <Select
                                ariaLabel={`効果${effectIndex + 1}種類`}
                                triggerClassName="h-9"
                                value={effect.type}
                                options={effectTypeOptions}
                                onChange={(next) =>
                                  setPatterns((current) =>
                                    current.map((target) => {
                                      if (target.uid !== pattern.uid)
                                        return target;
                                      const currentEffects =
                                        target.effects ?? [];
                                      return {
                                        ...target,
                                        effects: currentEffects.map(
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
                                      };
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
                                  setPatterns((current) =>
                                    current.map((target) => {
                                      if (target.uid !== pattern.uid)
                                        return target;
                                      const currentEffects =
                                        target.effects ?? [];
                                      return {
                                        ...target,
                                        effects: currentEffects.filter(
                                          (_, idx) => idx !== effectIndex,
                                        ),
                                      };
                                    }),
                                  )
                                }
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
                                    onChange={(next) =>
                                      setPatterns((current) =>
                                        current.map((target) => {
                                          if (target.uid !== pattern.uid)
                                            return target;
                                          const currentEffects =
                                            target.effects ?? [];
                                          return {
                                            ...target,
                                            effects: currentEffects.map(
                                              (entry, idx) =>
                                                idx === effectIndex &&
                                                entry.type === "add_label"
                                                  ? {
                                                      ...entry,
                                                      labelUids: next,
                                                    }
                                                  : entry,
                                            ),
                                          };
                                        }),
                                      )
                                    }
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
                                        setPatterns((current) =>
                                          current.map((target) => {
                                            if (target.uid !== pattern.uid)
                                              return target;
                                            const currentEffects =
                                              target.effects ?? [];
                                            return {
                                              ...target,
                                              effects: currentEffects.map(
                                                (entry, idx) =>
                                                  idx === effectIndex &&
                                                  entry.type ===
                                                    "add_penetration"
                                                    ? {
                                                        ...entry,
                                                        disruptionCategoryUids:
                                                          next,
                                                      }
                                                    : entry,
                                              ),
                                            };
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
                                        setPatterns((current) =>
                                          current.map((target) => {
                                            if (target.uid !== pattern.uid)
                                              return target;
                                            const currentEffects =
                                              target.effects ?? [];
                                            return {
                                              ...target,
                                              effects: currentEffects.map(
                                                (entry, idx) =>
                                                  idx === effectIndex &&
                                                  entry.type ===
                                                    "add_penetration"
                                                    ? {
                                                        ...entry,
                                                        amount: Math.max(
                                                          1,
                                                          Math.min(
                                                            20,
                                                            toInt(
                                                              event.target
                                                                .value,
                                                              entry.amount,
                                                            ),
                                                          ),
                                                        ),
                                                      }
                                                    : entry,
                                              ),
                                            };
                                          }),
                                        )
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
                  <Checkbox
                    checked={isExcludedFromOverall}
                    onChange={(event) =>
                      setPatterns((current) =>
                        current.map((target) =>
                          target.uid === pattern.uid
                            ? {
                                ...target,
                                excludeFromOverall: event.target.checked,
                              }
                            : target,
                        ),
                      )
                    }
                    label="合計初動率に計算しない"
                    className="h-8 border-ui-surface0/70 bg-ui-mantle"
                  />
                  {isMemoExpanded ? (
                    <div className="rounded-md border border-ui-surface0/70 bg-ui-mantle/85 p-2.5">
                      <Textarea
                        value={pattern.memo}
                        placeholder="メモ"
                        rows={2}
                        onChange={(event) =>
                          setPatterns((current) =>
                            current.map((target) =>
                              target.uid === pattern.uid
                                ? { ...target, memo: event.target.value }
                                : target,
                            ),
                          )
                        }
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="relative flex flex-wrap items-center gap-2 rounded-md border border-ui-surface0/70 bg-ui-mantle/80 px-2.5 py-2 text-xs text-ui-subtext0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-[-1.75rem] top-1/2 z-10 h-8 w-5 -translate-y-1/2 rounded-md border border-ui-surface0/80 bg-ui-base p-0 text-ui-subtext0 shadow-sm transition-colors duration-150 hover:border-ui-blue/60 hover:text-ui-blue"
                    aria-label="展開する"
                    onClick={() => toggleCollapsed(pattern.uid)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4",
                      isExcludedFromOverall
                        ? "border-ui-yellow/60 bg-ui-yellow/16 text-ui-subtext1 shadow-[inset_0_0_0_1px_rgb(var(--theme-yellow)/0.22)]"
                        : "border-ui-green/50 bg-ui-green/12 text-ui-subtext1 shadow-[inset_0_0_0_1px_rgb(var(--theme-green)/0.16)]",
                    )}
                  >
                    {isExcludedFromOverall ? "合計: 除外" : "合計: 対象"}
                  </span>
                  <span>条件: {pattern.conditions.length}</span>
                  <span>ラベル: {summaryLabels.length}</span>
                  <span>効果: {patternEffects.length}</span>
                </div>
              )}

              {isPatternExpanded ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 z-10 h-8 w-5 -translate-y-1/2 rounded-md border border-ui-surface0/80 bg-ui-base p-0 text-ui-subtext0 shadow-sm transition-colors duration-150 hover:border-ui-blue/60 hover:text-ui-blue"
                  aria-label="折りたたむ"
                  onClick={() => toggleCollapsed(pattern.uid)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          );
        }}
      />
    </SectionCard>
  );
};
