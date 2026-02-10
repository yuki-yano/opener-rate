import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { useAtom } from "jotai";
import { useState } from "react";

import { Button, Checkbox, Input, Textarea } from "../../../../components/ui";
import { disruptionCardsAtom } from "../../state";
import { SortableList } from "../common/sortable-list";
import { SectionCard } from "../layout/section-card";
import { createLocalId } from "./create-local-id";

const createDefaultDisruptionName = (index: number) => `妨害カード${index + 1}`;

export const DisruptionCardEditor = () => {
  const [disruptionCards, setDisruptionCards] = useAtom(disruptionCardsAtom);
  const [expandedMemoUids, setExpandedMemoUids] = useState<string[]>([]);

  const handleAdd = () => {
    setDisruptionCards((current) => [
      ...current,
      {
        uid: createLocalId("disruption_card"),
        name: createDefaultDisruptionName(current.length),
        oncePerName: true,
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
      title="妨害カード一覧"
      description="サブパターンと対戦シミュレーションで共有する妨害カードを管理します。"
      actions={
        <Button
          size="icon"
          variant="outline"
          onClick={handleAdd}
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
          const isMemoExpanded = expandedMemoUids.includes(disruptionCard.uid);

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
                    onClick={() => toggleMemo(disruptionCard.uid)}
                  >
                    <NotebookPen className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="妨害カード削除"
                    onClick={() => {
                      setExpandedMemoUids((current) =>
                        current.filter((target) => target !== disruptionCard.uid),
                      );
                      setDisruptionCards((current) =>
                        current.filter((target) => target.uid !== disruptionCard.uid),
                      );
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-latte-red" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[auto] sm:items-end">
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
                <div className="space-y-1 text-xs text-latte-red">
                  {isNameEmpty ? <p>妨害カード名は必須です。</p> : null}
                </div>
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
  );
};
