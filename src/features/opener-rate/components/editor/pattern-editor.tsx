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

import { Button, Checkbox, Input, Textarea } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import type { MultiSelectOption } from "../common/multi-select";
import { MultiSelect } from "../common/multi-select";
import { cardsAtom, labelsAtom, patternsAtom } from "../../state";
import { SortableList } from "../common/sortable-list";
import { SectionCard } from "../layout/section-card";
import { createLocalId } from "./create-local-id";
import { PatternConditionEditor } from "./pattern-condition-editor";

const createDefaultCondition = () => ({
  mode: "required" as const,
  count: 1,
  uids: [],
});

const createDefaultPatternName = (index: number) => `パターン${index + 1}`;

export const PatternEditor = () => {
  const [patterns, setPatterns] = useAtom(patternsAtom);
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

  const handleAddPattern = () => {
    const uid = createLocalId("pattern");
    setPatterns((current) => [
      ...current,
      {
        uid,
        name: createDefaultPatternName(current.length),
        active: true,
        conditions: [createDefaultCondition()],
        labels: [],
        memo: "",
      },
    ]);
    setCollapsedPatternUids((current) =>
      current.filter((target) => target !== uid),
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
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddPattern}
            aria-label="パターン追加"
            title="パターン追加"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </>
      }
    >
      {patterns.length === 0 ? (
        <p className="rounded-md border border-dashed border-latte-surface1 px-3 py-4 text-xs text-latte-subtext0">
          パターンがありません。「パターン追加」から作成してください。
        </p>
      ) : null}

      <SortableList
        items={patterns}
        onReorder={(next) => setPatterns(next)}
        handleClassName="top-[1.625rem]"
        renderItem={(pattern) => {
          const isNameEmpty = pattern.name.trim().length === 0;
          const isMemoExpanded = expandedMemoUids.includes(pattern.uid);
          const isPatternExpanded = !collapsedPatternUids.includes(pattern.uid);
          const summaryLabels = pattern.labels
            .map((label) =>
              labelOptions.find((entry) => entry.value === label.uid),
            )
            .filter((label): label is MultiSelectOption => label != null);

          return (
            <div
              className={cn(
                "relative min-w-0 space-y-2.5 rounded-lg border py-2.5 pl-9 pr-2.5 shadow-[0_1px_0_rgb(var(--ctp-base)/0.45)]",
                pattern.active
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
                  isPatternExpanded
                    ? "top-1/2 -translate-y-1/2"
                    : "top-[4.8125rem]",
                )}
                aria-label={isPatternExpanded ? "折りたたむ" : "展開する"}
                onClick={() => toggleCollapsed(pattern.uid)}
              >
                {isPatternExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>

              <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-latte-surface1/65 bg-latte-base/72 px-1.5 py-1">
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
                    "h-8 w-8 justify-center gap-0 border-transparent bg-latte-mantle/70 px-0 shadow-none",
                    pattern.active
                      ? "text-latte-blue"
                      : "text-latte-red",
                  )}
                />

                <Input
                  className="h-9 border-latte-surface2/70 bg-latte-surface0/55 text-latte-text placeholder:text-latte-overlay1"
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
                      isMemoExpanded && "text-latte-blue",
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
                    <Trash2 className="h-4 w-4 text-latte-red" />
                  </Button>
                </div>
              </div>

              {isNameEmpty ? (
                <p className="text-xs text-latte-red">
                  パターン名は必須です。空欄のままでは計算できません。
                </p>
              ) : null}

              {isPatternExpanded ? (
                <>
                  <div className="grid min-w-0 gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <label className="min-w-0 space-y-1.5 text-xs text-latte-subtext0">
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
                      <p className="text-xs text-latte-overlay1">
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
                  {isMemoExpanded ? (
                    <div className="rounded-md border border-latte-surface1/75 bg-latte-base/60 p-2">
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
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-latte-surface1/70 bg-latte-base/58 px-2.5 py-2 text-xs text-latte-subtext0">
                  <span>条件: {pattern.conditions.length}</span>
                  <span>ラベル: {summaryLabels.length}</span>
                </div>
              )}
            </div>
          );
        }}
      />
    </SectionCard>
  );
};
