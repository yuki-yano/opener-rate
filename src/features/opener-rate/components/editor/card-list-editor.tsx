import { Plus } from "lucide-react";
import { useAtom } from "jotai";
import { useState } from "react";

import { Button, Input } from "../../../../components/ui";
import { cardsAtom } from "../../state";
import { createLocalId } from "./create-local-id";
import { EditorEmptyState } from "./editor-ui";
import { NameMemoEditorItem } from "./name-memo-editor-item";
import { toInt } from "./number-utils";
import { SortableEditorSection } from "./sortable-editor-section";

const createDefaultCardName = (index: number) => `カード${index + 1}`;

export const CardListEditor = () => {
  const [cards, setCards] = useAtom(cardsAtom);
  const [expandedMemoUids, setExpandedMemoUids] = useState<string[]>([]);

  const handleAdd = () => {
    setCards((current) => [
      ...current,
      {
        uid: createLocalId("card"),
        name: createDefaultCardName(current.length),
        count: 1,
        memo: "",
      },
    ]);
  };

  const toggleMemo = (uid: string) => {
    setExpandedMemoUids((current) =>
      current.includes(uid)
        ? current.filter((target) => target !== uid)
        : [...current, uid],
    );
  };

  return (
    <SortableEditorSection
      title="カード一覧"
      description="デッキに含めるカードと枚数を編集します。"
      floatingActions={
        <Button
          size="icon"
          variant="outline"
          onClick={handleAdd}
          aria-label="カード追加"
          title="カード追加"
        >
          <Plus className="h-4 w-4" />
        </Button>
      }
      items={cards}
      onReorder={(next) => setCards(next)}
      layout="grid"
      handleClassName="top-[0.875rem]"
      emptyState={
        <EditorEmptyState>
          カードがありません。「カード追加」から作成してください。
        </EditorEmptyState>
      }
      renderItem={(card) => {
        const isNameEmpty = card.name.trim().length === 0;
        const isMemoExpanded = expandedMemoUids.includes(card.uid);

        return (
          <NameMemoEditorItem
            name={card.name}
            namePlaceholder="カード名（必須）"
            onNameChange={(nextName) =>
              setCards((current) =>
                current.map((target) =>
                  target.uid === card.uid
                    ? { ...target, name: nextName }
                    : target,
                ),
              )
            }
            isMemoExpanded={isMemoExpanded}
            onToggleMemo={() => toggleMemo(card.uid)}
            removeAriaLabel="カード削除"
            onRemove={() => {
              setExpandedMemoUids((current) =>
                current.filter((target) => target !== card.uid),
              );
              setCards((current) =>
                current.filter((target) => target.uid !== card.uid),
              );
            }}
            isNameEmpty={isNameEmpty}
            nameErrorMessage="カード名は必須です。空欄のままでは計算できません。"
            memo={card.memo}
            onMemoChange={(nextMemo) =>
              setCards((current) =>
                current.map((target) =>
                  target.uid === card.uid
                    ? { ...target, memo: nextMemo }
                    : target,
                ),
              )
            }
            topGridClassName="grid-cols-[minmax(0,1fr)_5.25rem_auto]"
            nameInputClassName="border-ui-surface0/80 bg-ui-mantle text-ui-text placeholder:text-ui-overlay1"
            actionsClassName="justify-end"
            topMiddle={
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={card.count}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  if (!/^\d*$/.test(nextValue)) {
                    return;
                  }
                  setCards((current) =>
                    current.map((target) =>
                      target.uid === card.uid
                        ? {
                            ...target,
                            count: Math.max(
                              0,
                              Math.min(
                                60,
                                toInt(nextValue, target.count),
                              ),
                            ),
                          }
                        : target,
                    ),
                  )
                }}
              />
            }
          />
        );
      }}
    />
  );
};
