import { ChevronsDown, ChevronsUp, Plus } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";

import { Button, Select, Textarea } from "../../../../components/ui";
import type { SubPattern } from "../../../../../shared/apiSchemas";
import type { MultiSelectOption } from "../common/multi-select";
import { MultiSelect } from "../common/multi-select";
import { SortableList } from "../common/sortable-list";
import { SectionCard } from "../layout/section-card";
import {
  cardsAtom,
  disruptionCategoriesAtom,
  labelsAtom,
  patternsAtom,
  subPatternsAtom,
} from "../../state";
import { createLocalId } from "./create-local-id";
import { createDuplicatedSubPattern } from "./duplicate-pattern";
import {
  createDefaultRequiredCondition,
  removeItemByUid,
  removeUid,
  toNamedOptions,
  toggleUid,
  updateItemByUid,
} from "./editor-collection-utils";
import { EditorEmptyState, editorFieldLabelClassName } from "./editor-ui";
import { EffectListEditor } from "./effect-list-editor";
import { ExpandableEditorCard } from "./expandable-editor-card";
import {
  createDefaultEffect,
  pruneUnavailablePenetrationCategories,
  switchEffectType,
} from "./effect-utils";
import { PatternConditionEditor } from "./pattern-condition-editor";
import { PatternComposeDialogTrigger } from "./pattern-compose-editor";

const createDefaultSubPatternName = (index: number) =>
  `サブパターン${index + 1}`;

const applyLimitOptions = [
  { value: "once_per_trial", label: "試行ごとに1回" },
  { value: "once_per_distinct_uid", label: "引いた種類ごとに1回" },
] as const;

export const SubPatternEditor = () => {
  const [subPatterns, setSubPatterns] = useAtom(subPatternsAtom);
  const patterns = useAtomValue(patternsAtom);
  const disruptionCategories = useAtomValue(disruptionCategoriesAtom);
  const labels = useAtomValue(labelsAtom);
  const cards = useAtomValue(cardsAtom);

  const [expandedMemoUids, setExpandedMemoUids] = useState<string[]>([]);
  const [collapsedUids, setCollapsedUids] = useState<string[]>(() =>
    subPatterns.map((subPattern) => subPattern.uid),
  );

  const patternOptions = useMemo<MultiSelectOption[]>(
    () => toNamedOptions(patterns),
    [patterns],
  );

  const labelOptions = useMemo<MultiSelectOption[]>(
    () => toNamedOptions(labels),
    [labels],
  );

  const cardOptions = useMemo<MultiSelectOption[]>(
    () => toNamedOptions(cards),
    [cards],
  );

  const penetrationCategoryOptions = useMemo<MultiSelectOption[]>(
    () => toNamedOptions(disruptionCategories),
    [disruptionCategories],
  );
  useEffect(() => {
    const availableCategoryUids = new Set(
      penetrationCategoryOptions.map((option) => option.value),
    );
    setSubPatterns((current) => {
      let hasChanges = false;
      const next = current.map((subPattern) => {
        const { effects, changed } = pruneUnavailablePenetrationCategories(
          subPattern.effects,
          availableCategoryUids,
        );
        if (!changed) return subPattern;
        hasChanges = true;
        return { ...subPattern, effects };
      });
      return hasChanges ? next : current;
    });
  }, [penetrationCategoryOptions, setSubPatterns]);

  const updateSubPattern = (
    uid: string,
    updater: (subPattern: SubPattern) => SubPattern,
  ) => {
    setSubPatterns((current) => updateItemByUid(current, uid, updater));
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
        triggerConditions: [createDefaultRequiredCondition()],
        triggerSourceUids: [],
        applyLimit: "once_per_trial",
        effects: [createDefaultEffect()],
        memo: "",
      },
    ]);
    setCollapsedUids((current) => removeUid(current, uid));
  };

  const handleDuplicateSubPattern = (sourceUid: string) => {
    const duplicateUid = createLocalId("sub_pattern");
    setSubPatterns((current) => {
      const sourceIndex = current.findIndex(
        (subPattern) => subPattern.uid === sourceUid,
      );
      if (sourceIndex < 0) return current;
      return [
        ...current,
        createDuplicatedSubPattern({
          source: current[sourceIndex],
          nextUid: duplicateUid,
          fallbackName: createDefaultSubPatternName(sourceIndex),
        }),
      ];
    });
    setCollapsedUids((current) => removeUid(current, duplicateUid));
  };

  const toggleMemo = (uid: string) => {
    setExpandedMemoUids((current) => toggleUid(current, uid));
  };

  const toggleCollapsed = (uid: string) => {
    setCollapsedUids((current) => toggleUid(current, uid));
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
          <PatternComposeDialogTrigger />
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
          onClick={handleAddSubPattern}
          aria-label="サブパターン追加"
          title="サブパターン追加"
        >
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      {subPatterns.length === 0 ? (
        <EditorEmptyState>
          サブパターンがありません。「サブパターン追加」から作成してください。
        </EditorEmptyState>
      ) : null}

      <SortableList
        items={subPatterns}
        onReorder={(next) => setSubPatterns(next)}
        handleClassName="top-[2.1875rem] -translate-y-1/2"
        renderItem={(subPattern) => {
          const isNameEmpty = subPattern.name.trim().length === 0;
          const isMemoExpanded = expandedMemoUids.includes(subPattern.uid);
          const isExpanded = !collapsedUids.includes(subPattern.uid);
          return (
            <ExpandableEditorCard
              isActive={subPattern.active}
              isExpanded={isExpanded}
              isMemoExpanded={isMemoExpanded}
              expandedToggleButtonClassName="top-0 bottom-0 h-auto"
              collapsedToggleButtonClassName="top-0 bottom-0 h-auto"
              name={subPattern.name}
              namePlaceholder="サブパターン名（必須）"
              activeContainerClassName="border-ui-primary/65 bg-ui-layer2/82"
              inactiveContainerClassName="border-ui-red/65 bg-ui-layer2/82"
              activeAriaLabel="サブパターン有効切り替え"
              memoAriaLabel="メモ表示切り替え"
              duplicateAriaLabel="サブパターン複製"
              removeAriaLabel="サブパターン削除"
              nameErrorMessage={
                isNameEmpty
                  ? "サブパターン名は必須です。空欄のままでは計算できません。"
                  : undefined
              }
              onActiveChange={(next) =>
                updateSubPattern(subPattern.uid, (target) => ({
                  ...target,
                  active: next,
                }))
              }
              onNameChange={(next) =>
                updateSubPattern(subPattern.uid, (target) => ({
                  ...target,
                  name: next,
                }))
              }
              onToggleMemo={() => toggleMemo(subPattern.uid)}
              onDuplicate={() => handleDuplicateSubPattern(subPattern.uid)}
              onRemove={() => {
                setExpandedMemoUids((current) =>
                  removeUid(current, subPattern.uid),
                );
                setCollapsedUids((current) =>
                  removeUid(current, subPattern.uid),
                );
                setSubPatterns((current) =>
                  removeItemByUid(current, subPattern.uid),
                );
              }}
              onToggleCollapsed={() => toggleCollapsed(subPattern.uid)}
              expandedBody={
                <div className="space-y-2.5 rounded-md border border-ui-border1/70 bg-ui-layer2/60 p-2.5">
                  <div className="grid min-w-0 gap-2 lg:grid-cols-2">
                    <label className={`min-w-0 ${editorFieldLabelClassName}`}>
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

                    <label className={`min-w-0 ${editorFieldLabelClassName}`}>
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
                    <label className={editorFieldLabelClassName}>
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
                            createDefaultRequiredCondition(),
                          ],
                        }))
                      }
                    >
                      条件追加
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {subPattern.triggerConditions.length === 0 ? (
                      <p className="text-xs text-ui-tone2">
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
                              scope="sub_pattern"
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

                  <EffectListEditor
                    effects={subPattern.effects}
                    labelOptions={labelOptions}
                    penetrationCategoryOptions={penetrationCategoryOptions}
                    onAdd={() =>
                      updateSubPattern(subPattern.uid, (target) => ({
                        ...target,
                        effects: [...target.effects, createDefaultEffect()],
                      }))
                    }
                    onSwitchType={(effectIndex, nextType) =>
                      updateSubPattern(subPattern.uid, (target) => ({
                        ...target,
                        effects: target.effects.map((entry, idx) =>
                          idx === effectIndex
                            ? switchEffectType(entry, nextType)
                            : entry,
                        ),
                      }))
                    }
                    onRemove={(effectIndex) =>
                      updateSubPattern(subPattern.uid, (target) => ({
                        ...target,
                        effects: target.effects.filter(
                          (_, idx) => idx !== effectIndex,
                        ),
                      }))
                    }
                    onChangeLabels={(effectIndex, next) =>
                      updateSubPattern(subPattern.uid, (target) => ({
                        ...target,
                        effects: target.effects.map((entry, idx) =>
                          idx === effectIndex && entry.type === "add_label"
                            ? { ...entry, labelUids: next }
                            : entry,
                        ),
                      }))
                    }
                    onChangePenetrationCategories={(effectIndex, next) =>
                      updateSubPattern(subPattern.uid, (target) => ({
                        ...target,
                        effects: target.effects.map((entry, idx) =>
                          idx === effectIndex &&
                          entry.type === "add_penetration"
                            ? { ...entry, disruptionCategoryUids: next }
                            : entry,
                        ),
                      }))
                    }
                    onChangePenetrationAmount={(effectIndex, nextAmount) =>
                      updateSubPattern(subPattern.uid, (target) => ({
                        ...target,
                        effects: target.effects.map((entry, idx) =>
                          idx === effectIndex &&
                          entry.type === "add_penetration"
                            ? { ...entry, amount: nextAmount }
                            : entry,
                        ),
                      }))
                    }
                  />

                  {isMemoExpanded ? (
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
                  ) : null}
                </div>
              }
              collapsedBody={
                <>
                  <span>条件: {subPattern.triggerConditions.length}</span>
                  <span>効果: {subPattern.effects.length}</span>
                </>
              }
            />
          );
        }}
      />
    </SectionCard>
  );
};
