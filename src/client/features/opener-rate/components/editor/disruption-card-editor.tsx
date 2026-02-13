import { Plus } from "lucide-react";
import { useAtom } from "jotai";
import { useMemo, useState } from "react";

import { Button, Checkbox, Select } from "../../../../components/ui";
import { disruptionCategoriesAtom, disruptionCardsAtom } from "../../state";
import { createLocalId } from "./create-local-id";
import { EditorEmptyState } from "./editor-ui";
import { NameMemoEditorItem } from "./name-memo-editor-item";
import { SortableEditorSection } from "./sortable-editor-section";

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
      <SortableEditorSection
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
        items={disruptionCategories}
        onReorder={(next) => setDisruptionCategories(next)}
        layout="grid"
        handleClassName="top-[0.875rem]"
        emptyState={
          <EditorEmptyState>
            妨害カテゴリがありません。「妨害カテゴリ追加」から作成してください。
          </EditorEmptyState>
        }
        renderItem={(category) => {
          const isNameEmpty = category.name.trim().length === 0;
          const isMemoExpanded = expandedCategoryMemoUids.includes(
            category.uid,
          );

          return (
            <NameMemoEditorItem
              name={category.name}
              namePlaceholder="妨害カテゴリ名（必須）"
              onNameChange={(nextName) =>
                setDisruptionCategories((current) =>
                  current.map((target) =>
                    target.uid === category.uid
                      ? { ...target, name: nextName }
                      : target,
                  ),
                )
              }
              isMemoExpanded={isMemoExpanded}
              onToggleMemo={() =>
                setExpandedCategoryMemoUids((current) =>
                  current.includes(category.uid)
                    ? current.filter((target) => target !== category.uid)
                    : [...current, category.uid],
                )
              }
              removeAriaLabel="妨害カテゴリ削除"
              onRemove={() => {
                setExpandedCategoryMemoUids((current) =>
                  current.filter((target) => target !== category.uid),
                );
                setDisruptionCategories((current) =>
                  current.filter((target) => target.uid !== category.uid),
                );
                setDisruptionCards((current) =>
                  current.map((target) =>
                    target.disruptionCategoryUid === category.uid
                      ? { ...target, disruptionCategoryUid: undefined }
                      : target,
                  ),
                );
              }}
              isNameEmpty={isNameEmpty}
              nameErrorMessage="妨害カテゴリ名は必須です。"
              memo={category.memo}
              onMemoChange={(nextMemo) =>
                setDisruptionCategories((current) =>
                  current.map((target) =>
                    target.uid === category.uid
                      ? { ...target, memo: nextMemo }
                      : target,
                  ),
                )
              }
              topGridClassName="grid-cols-[minmax(0,1fr)_auto]"
            />
          );
        }}
      />

      <SortableEditorSection
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
        items={disruptionCards}
        onReorder={(next) => setDisruptionCards(next)}
        layout="grid"
        handleClassName="top-[0.875rem]"
        emptyState={
          <EditorEmptyState>
            妨害カードがありません。「妨害カード追加」から作成してください。
          </EditorEmptyState>
        }
        renderItem={(disruptionCard) => {
          const isNameEmpty = disruptionCard.name.trim().length === 0;
          const isMemoExpanded = expandedCardMemoUids.includes(
            disruptionCard.uid,
          );

          return (
            <NameMemoEditorItem
              name={disruptionCard.name}
              namePlaceholder="妨害カード名（必須）"
              onNameChange={(nextName) =>
                setDisruptionCards((current) =>
                  current.map((target) =>
                    target.uid === disruptionCard.uid
                      ? { ...target, name: nextName }
                      : target,
                  ),
                )
              }
              isMemoExpanded={isMemoExpanded}
              onToggleMemo={() =>
                setExpandedCardMemoUids((current) =>
                  current.includes(disruptionCard.uid)
                    ? current.filter((target) => target !== disruptionCard.uid)
                    : [...current, disruptionCard.uid],
                )
              }
              removeAriaLabel="妨害カード削除"
              onRemove={() => {
                setExpandedCardMemoUids((current) =>
                  current.filter((target) => target !== disruptionCard.uid),
                );
                setDisruptionCards((current) =>
                  current.filter((target) => target.uid !== disruptionCard.uid),
                );
              }}
              isNameEmpty={isNameEmpty}
              nameErrorMessage="妨害カード名は必須です。"
              memo={disruptionCard.memo}
              onMemoChange={(nextMemo) =>
                setDisruptionCards((current) =>
                  current.map((target) =>
                    target.uid === disruptionCard.uid
                      ? { ...target, memo: nextMemo }
                      : target,
                  ),
                )
              }
              topGridClassName="grid-cols-[minmax(0,1fr)_4.25rem] sm:grid-cols-[minmax(0,1fr)_auto]"
              actionsClassName="w-[4.25rem] justify-end sm:w-auto sm:justify-start"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_4.25rem] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label className="space-y-1 text-[11px] text-ui-text3">
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
                  label="ターン1"
                  className="h-10 w-full justify-center border-transparent bg-transparent px-0 shadow-none hover:border-transparent sm:w-auto"
                />
              </div>
            </NameMemoEditorItem>
          );
        }}
      />
    </>
  );
};
