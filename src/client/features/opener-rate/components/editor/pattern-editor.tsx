import { ChevronsDown, ChevronsUp, Plus } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";

import { Button, Checkbox, Textarea } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
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
import { EditorEmptyState, editorFieldLabelClassName } from "./editor-ui";
import { EffectListEditor } from "./effect-list-editor";
import { ExpandableEditorCard } from "./expandable-editor-card";
import {
  createDefaultEffect,
  pruneUnavailablePenetrationCategories,
  switchEffectType,
} from "./effect-utils";
import { PatternConditionEditor } from "./pattern-condition-editor";

const createDefaultCondition = () => ({
  mode: "required" as const,
  count: 1,
  uids: [],
});

const createDefaultPatternName = (index: number) => `パターン${index + 1}`;

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
        const { effects, changed } = pruneUnavailablePenetrationCategories(
          pattern.effects ?? [],
          availableCategoryUids,
        );
        if (!changed) return pattern;
        hasChanges = true;
        return { ...pattern, effects };
      });
      return hasChanges ? next : current;
    });
  }, [penetrationCategoryOptions, setPatterns]);

  const updatePattern = (
    uid: string,
    updater: (pattern: (typeof patterns)[number]) => (typeof patterns)[number],
  ) => {
    setPatterns((current) =>
      current.map((pattern) =>
        pattern.uid === uid ? updater(pattern) : pattern,
      ),
    );
  };

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
        <EditorEmptyState>
          パターンがありません。「パターン追加」から作成してください。
        </EditorEmptyState>
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
            <ExpandableEditorCard
              isActive={isPatternActive}
              isExpanded={isPatternExpanded}
              isMemoExpanded={isMemoExpanded}
              name={pattern.name}
              namePlaceholder="パターン名（必須）"
              activeContainerClassName={
                isExcludedFromOverall
                  ? "border-ui-yellow/65 bg-ui-crust/82"
                  : "border-ui-blue/65 bg-ui-crust/82"
              }
              inactiveContainerClassName={
                isExcludedFromOverall
                  ? "border-ui-yellow/65 bg-ui-crust/82"
                  : "border-ui-red/65 bg-ui-crust/82"
              }
              activeAriaLabel="パターン有効切り替え"
              memoAriaLabel="メモ表示切り替え"
              duplicateAriaLabel="パターン複製"
              removeAriaLabel="パターン削除"
              nameErrorMessage={
                isNameEmpty
                  ? "パターン名は必須です。空欄のままでは計算できません。"
                  : undefined
              }
              onActiveChange={(next) =>
                updatePattern(pattern.uid, (target) => ({
                  ...target,
                  active: next,
                }))
              }
              onNameChange={(next) =>
                updatePattern(pattern.uid, (target) => ({
                  ...target,
                  name: next,
                }))
              }
              onToggleMemo={() => toggleMemo(pattern.uid)}
              onDuplicate={() => handleDuplicatePattern(pattern.uid)}
              onRemove={() => {
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
              onToggleCollapsed={() => toggleCollapsed(pattern.uid)}
              expandedBody={
                <div className="space-y-2.5 rounded-md border border-ui-surface0/70 bg-ui-crust/60 p-2.5">
                  <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <label className={`min-w-0 ${editorFieldLabelClassName}`}>
                      紐付けラベル
                      <MultiSelect
                        options={labelOptions}
                        value={pattern.labels.map((label) => label.uid)}
                        onChange={(next) =>
                          updatePattern(pattern.uid, (target) => ({
                            ...target,
                            labels: next.map((uid) => ({ uid })),
                          }))
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
                        updatePattern(pattern.uid, (target) => ({
                          ...target,
                          conditions: [
                            ...target.conditions,
                            createDefaultCondition(),
                          ],
                        }))
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
                              updatePattern(pattern.uid, (target) => ({
                                ...target,
                                conditions: target.conditions.map(
                                  (entry, idx) =>
                                    idx === conditionIndex
                                      ? nextCondition
                                      : entry,
                                ),
                              }))
                            }
                            onRemove={() =>
                              updatePattern(pattern.uid, (target) => ({
                                ...target,
                                conditions: target.conditions.filter(
                                  (_, idx) => idx !== conditionIndex,
                                ),
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <EffectListEditor
                    effects={patternEffects}
                    labelOptions={labelOptions}
                    penetrationCategoryOptions={penetrationCategoryOptions}
                    onAdd={() =>
                      updatePattern(pattern.uid, (target) => ({
                        ...target,
                        effects: [
                          ...(target.effects ?? []),
                          createDefaultEffect(),
                        ],
                      }))
                    }
                    onSwitchType={(effectIndex, nextType) =>
                      updatePattern(pattern.uid, (target) => {
                        const currentEffects = target.effects ?? [];
                        return {
                          ...target,
                          effects: currentEffects.map((entry, idx) =>
                            idx === effectIndex
                              ? switchEffectType(entry, nextType)
                              : entry,
                          ),
                        };
                      })
                    }
                    onRemove={(effectIndex) =>
                      updatePattern(pattern.uid, (target) => {
                        const currentEffects = target.effects ?? [];
                        return {
                          ...target,
                          effects: currentEffects.filter(
                            (_, idx) => idx !== effectIndex,
                          ),
                        };
                      })
                    }
                    onChangeLabels={(effectIndex, next) =>
                      updatePattern(pattern.uid, (target) => {
                        const currentEffects = target.effects ?? [];
                        return {
                          ...target,
                          effects: currentEffects.map((entry, idx) =>
                            idx === effectIndex && entry.type === "add_label"
                              ? { ...entry, labelUids: next }
                              : entry,
                          ),
                        };
                      })
                    }
                    onChangePenetrationCategories={(effectIndex, next) =>
                      updatePattern(pattern.uid, (target) => {
                        const currentEffects = target.effects ?? [];
                        return {
                          ...target,
                          effects: currentEffects.map((entry, idx) =>
                            idx === effectIndex &&
                            entry.type === "add_penetration"
                              ? { ...entry, disruptionCategoryUids: next }
                              : entry,
                          ),
                        };
                      })
                    }
                    onChangePenetrationAmount={(effectIndex, nextAmount) =>
                      updatePattern(pattern.uid, (target) => {
                        const currentEffects = target.effects ?? [];
                        return {
                          ...target,
                          effects: currentEffects.map((entry, idx) =>
                            idx === effectIndex &&
                            entry.type === "add_penetration"
                              ? {
                                  ...entry,
                                  amount: nextAmount,
                                }
                              : entry,
                          ),
                        };
                      })
                    }
                  />

                  <Checkbox
                    checked={isExcludedFromOverall}
                    onChange={(event) =>
                      updatePattern(pattern.uid, (target) => ({
                        ...target,
                        excludeFromOverall: event.target.checked,
                      }))
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
                          updatePattern(pattern.uid, (target) => ({
                            ...target,
                            memo: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ) : null}
                </div>
              }
              collapsedBody={
                <>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4",
                      isExcludedFromOverall
                        ? "border-ui-yellow/60 bg-ui-yellow/16 text-ui-subtext1 shadow-[inset_0_0_0_1px_rgb(var(--theme-yellow)/0.22)]"
                        : "border-ui-blue/55 bg-ui-blue/12 text-ui-subtext1 shadow-[inset_0_0_0_1px_rgb(var(--theme-blue)/0.18)]",
                    )}
                  >
                    {isExcludedFromOverall ? "合計: 除外" : "合計: 対象"}
                  </span>
                  <span>条件: {pattern.conditions.length}</span>
                  <span>ラベル: {summaryLabels.length}</span>
                  <span>効果: {patternEffects.length}</span>
                </>
              }
            />
          );
        }}
      />
    </SectionCard>
  );
};
