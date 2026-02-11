import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";

import {
  Button,
  Checkbox,
  Input,
  Select,
  Textarea,
} from "../../../../components/ui";
import { disruptionCategoriesAtom, disruptionCardsAtom } from "../../state";
import { SortableList } from "../common/sortable-list";
import { SectionCard } from "../layout/section-card";
import { createLocalId } from "./create-local-id";

const createDefaultCategoryName = (index: number) => `妨害カテゴリ${index + 1}`;
const createDefaultDisruptionName = (index: number) => `妨害カード${index + 1}`;

export const DisruptionCardEditor = () => {
  const [disruptionCategories, setDisruptionCategories] = useAtom(
    disruptionCategoriesAtom,
  );
  const [disruptionCards, setDisruptionCards] = useAtom(disruptionCardsAtom);
  const [expandedCategoryMemoUids, setExpandedCategoryMemoUids] = useState<
    string[]
  >([]);
  const [expandedCardMemoUids, setExpandedCardMemoUids] = useState<string[]>(
    [],
  );

  const categoryOptions = useMemo(
    () =>
      disruptionCategories
        .filter((category) => category.name.trim().length > 0)
        .map((category) => ({
          value: category.uid,
          label: category.name,
        })),
    [disruptionCategories],
  );
  const categorySelectOptions = useMemo(
    () => [{ value: "", label: "カテゴリなし" }, ...categoryOptions],
    [categoryOptions],
  );

  const handleAddCategory = () => {
    setDisruptionCategories((current) => [
      ...current,
      {
        uid: createLocalId("disruption_category"),
        name: createDefaultCategoryName(current.length),
        memo: "",
      },
    ]);
  };

  const handleAddDisruptionCard = () => {
    const firstCategory = disruptionCategories[0];
    setDisruptionCards((current) => [
      ...current,
      {
        uid: createLocalId("disruption_card"),
        name: createDefaultDisruptionName(current.length),
        oncePerName: true,
        disruptionCategoryUid: firstCategory?.uid,
        memo: "",
      },
    ]);
  };

  return (
    <>
      <SectionCard
        title="妨害カテゴリ一覧"
        description="貫通判定で使うカテゴリを先に登録します。"
        floatingActions={
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddCategory}
            aria-label="妨害カテゴリ追加"
            title="妨害カテゴリ追加"
          >
            <Plus className="h-4 w-4" />
          </Button>
        }
      >
        {disruptionCategories.length === 0 ? (
          <p className="rounded-md border border-dashed border-latte-surface1 px-3 py-4 text-xs text-latte-subtext0">
            妨害カテゴリがありません。「妨害カテゴリ追加」から作成してください。
          </p>
        ) : null}

        <SortableList
          layout="grid"
          items={disruptionCategories}
          onReorder={(next) => setDisruptionCategories(next)}
          handleClassName="top-[0.875rem]"
          renderItem={(category) => {
            const isNameEmpty = category.name.trim().length === 0;
            const isMemoExpanded = expandedCategoryMemoUids.includes(
              category.uid,
            );

            return (
              <div className="space-y-2 rounded-md border border-latte-surface1/80 bg-latte-crust/70 py-3 pl-9 pr-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <Input
                    value={category.name}
                    placeholder="妨害カテゴリ名（必須）"
                    onChange={(event) =>
                      setDisruptionCategories((current) =>
                        current.map((target) =>
                          target.uid === category.uid
                            ? { ...target, name: event.target.value }
                            : target,
                        ),
                      )
                    }
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={isMemoExpanded ? "text-latte-blue" : undefined}
                      aria-label="メモ表示切り替え"
                      onClick={() =>
                        setExpandedCategoryMemoUids((current) =>
                          current.includes(category.uid)
                            ? current.filter(
                                (target) => target !== category.uid,
                              )
                            : [...current, category.uid],
                        )
                      }
                    >
                      <NotebookPen className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="妨害カテゴリ削除"
                      onClick={() => {
                        setExpandedCategoryMemoUids((current) =>
                          current.filter((target) => target !== category.uid),
                        );
                        setDisruptionCategories((current) =>
                          current.filter(
                            (target) => target.uid !== category.uid,
                          ),
                        );
                        setDisruptionCards((current) =>
                          current.map((target) =>
                            target.disruptionCategoryUid === category.uid
                              ? { ...target, disruptionCategoryUid: undefined }
                              : target,
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
                    妨害カテゴリ名は必須です。
                  </p>
                ) : null}

                {isMemoExpanded ? (
                  <div className="rounded-md border border-latte-surface1/70 bg-latte-mantle/55 p-2">
                    <Textarea
                      value={category.memo}
                      placeholder="メモ"
                      rows={2}
                      onChange={(event) =>
                        setDisruptionCategories((current) =>
                          current.map((target) =>
                            target.uid === category.uid
                              ? { ...target, memo: event.target.value }
                              : target,
                          ),
                        )
                      }
                    />
                  </div>
                ) : null}
              </div>
            );
          }}
        />
      </SectionCard>

      <SectionCard
        title="妨害カード一覧"
        description="サブパターンと対戦シミュレーションで共有する妨害カードを管理します。"
        floatingActions={
          <Button
            size="icon"
            variant="outline"
            onClick={handleAddDisruptionCard}
            aria-label="妨害カード追加"
            title="妨害カード追加"
          >
            <Plus className="h-4 w-4" />
          </Button>
        }
      >
        {disruptionCards.length === 0 ? (
          <p className="rounded-md border border-dashed border-latte-surface1 px-3 py-4 text-xs text-latte-subtext0">
            妨害カードがありません。「妨害カード追加」から作成してください。
          </p>
        ) : null}

        <SortableList
          layout="grid"
          items={disruptionCards}
          onReorder={(next) => setDisruptionCards(next)}
          handleClassName="top-[0.875rem]"
          renderItem={(disruptionCard) => {
            const isNameEmpty = disruptionCard.name.trim().length === 0;
            const isMemoExpanded = expandedCardMemoUids.includes(
              disruptionCard.uid,
            );

            return (
              <div className="space-y-2 rounded-md border border-latte-surface1/80 bg-latte-crust/70 py-3 pl-9 pr-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <Input
                    value={disruptionCard.name}
                    placeholder="妨害カード名（必須）"
                    onChange={(event) =>
                      setDisruptionCards((current) =>
                        current.map((target) =>
                          target.uid === disruptionCard.uid
                            ? { ...target, name: event.target.value }
                            : target,
                        ),
                      )
                    }
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={isMemoExpanded ? "text-latte-blue" : undefined}
                      aria-label="メモ表示切り替え"
                      onClick={() =>
                        setExpandedCardMemoUids((current) =>
                          current.includes(disruptionCard.uid)
                            ? current.filter(
                                (target) => target !== disruptionCard.uid,
                              )
                            : [...current, disruptionCard.uid],
                        )
                      }
                    >
                      <NotebookPen className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="妨害カード削除"
                      onClick={() => {
                        setExpandedCardMemoUids((current) =>
                          current.filter(
                            (target) => target !== disruptionCard.uid,
                          ),
                        );
                        setDisruptionCards((current) =>
                          current.filter(
                            (target) => target.uid !== disruptionCard.uid,
                          ),
                        );
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-latte-red" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <label className="space-y-1 text-[11px] text-latte-subtext0">
                    妨害カテゴリ（任意）
                    <Select
                      ariaLabel="妨害カテゴリ"
                      disabled={categoryOptions.length === 0}
                      value={disruptionCard.disruptionCategoryUid ?? ""}
                      options={categorySelectOptions}
                      onChange={(nextUid) =>
                        setDisruptionCards((current) =>
                          current.map((target) =>
                            target.uid === disruptionCard.uid
                              ? {
                                  ...target,
                                  disruptionCategoryUid:
                                    nextUid.length > 0 ? nextUid : undefined,
                                }
                              : target,
                          ),
                        )
                      }
                    />
                  </label>
                  <Checkbox
                    checked={disruptionCard.oncePerName}
                    onChange={(event) =>
                      setDisruptionCards((current) =>
                        current.map((target) =>
                          target.uid === disruptionCard.uid
                            ? { ...target, oncePerName: event.target.checked }
                            : target,
                        ),
                      )
                    }
                    label="同名1回制限"
                    className="h-10 border-transparent bg-transparent px-0 shadow-none"
                  />
                </div>

                {isNameEmpty ? (
                  <p className="text-xs text-latte-red">
                    妨害カード名は必須です。
                  </p>
                ) : null}

                {isMemoExpanded ? (
                  <div className="rounded-md border border-latte-surface1/70 bg-latte-mantle/55 p-2">
                    <Textarea
                      value={disruptionCard.memo}
                      placeholder="メモ"
                      rows={2}
                      onChange={(event) =>
                        setDisruptionCards((current) =>
                          current.map((target) =>
                            target.uid === disruptionCard.uid
                              ? { ...target, memo: event.target.value }
                              : target,
                          ),
                        )
                      }
                    />
                  </div>
                ) : null}
              </div>
            );
          }}
        />
      </SectionCard>
    </>
  );
};
