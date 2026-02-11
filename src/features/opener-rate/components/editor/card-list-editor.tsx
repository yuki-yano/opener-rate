import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { useAtom } from "jotai";
import { useState } from "react";

import { Button, Input, Textarea } from "../../../../components/ui";
import { cardsAtom } from "../../state";
import { SortableList } from "../common/sortable-list";
import { SectionCard } from "../layout/section-card";
import { createLocalId } from "./create-local-id";

const toInt = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

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
    <SectionCard
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
    >
      {cards.length === 0 ? (
        <p className="rounded-md border border-dashed border-latte-surface0/80 bg-latte-crust/45 px-3 py-4 text-xs text-latte-subtext0">
          カードがありません。「カード追加」から作成してください。
        </p>
      ) : null}

      <SortableList
        layout="grid"
        items={cards}
        onReorder={(next) => setCards(next)}
        handleClassName="top-[0.875rem]"
        renderItem={(card) => {
          const isNameEmpty = card.name.trim().length === 0;
          const isMemoExpanded = expandedMemoUids.includes(card.uid);

          return (
            <div className="space-y-2 rounded-md border border-latte-surface0/80 bg-latte-mantle py-3 pl-9 pr-3">
              <div className="grid grid-cols-[minmax(0,1fr)_5.25rem_auto] gap-2">
                <Input
                  className="border-latte-surface0/80 bg-latte-mantle text-latte-text placeholder:text-latte-overlay1"
                  value={card.name}
                  placeholder="カード名（必須）"
                  onChange={(event) =>
                    setCards((current) =>
                      current.map((target) =>
                        target.uid === card.uid
                          ? { ...target, name: event.target.value }
                          : target,
                      ),
                    )
                  }
                />
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={card.count}
                  onChange={(event) =>
                    setCards((current) =>
                      current.map((target) =>
                        target.uid === card.uid
                          ? {
                              ...target,
                              count: Math.max(
                                0,
                                Math.min(
                                  60,
                                  toInt(event.target.value, target.count),
                                ),
                              ),
                            }
                          : target,
                      ),
                    )
                  }
                />
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={isMemoExpanded ? "text-latte-blue" : undefined}
                    aria-label="メモ表示切り替え"
                    onClick={() => toggleMemo(card.uid)}
                  >
                    <NotebookPen className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="カード削除"
                    onClick={() => {
                      setExpandedMemoUids((current) =>
                        current.filter((target) => target !== card.uid),
                      );
                      setCards((current) =>
                        current.filter((target) => target.uid !== card.uid),
                      );
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-latte-red" />
                  </Button>
                </div>
              </div>
              {isNameEmpty ? (
                <p className="text-xs text-latte-red">
                  カード名は必須です。空欄のままでは計算できません。
                </p>
              ) : null}
              {isMemoExpanded ? (
                <div className="rounded-md border border-latte-surface0/70 bg-latte-crust/60 p-2.5">
                  <Textarea
                    value={card.memo}
                    placeholder="メモ"
                    rows={2}
                    onChange={(event) =>
                      setCards((current) =>
                        current.map((target) =>
                          target.uid === card.uid
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
  );
};
