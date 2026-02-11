import { NotebookPen, Plus, Trash2 } from "lucide-react";
import { useAtom } from "jotai";
import { useState } from "react";

import { Button, Input, Textarea } from "../../../../components/ui";
import { labelsAtom } from "../../state";
import { SortableList } from "../common/sortable-list";
import { SectionCard } from "../layout/section-card";
import { createLocalId } from "./create-local-id";

const createDefaultLabelName = (index: number) => `ラベル${index + 1}`;

export const LabelEditor = () => {
  const [labels, setLabels] = useAtom(labelsAtom);
  const [expandedMemoUids, setExpandedMemoUids] = useState<string[]>([]);

  const handleAdd = () => {
    setLabels((current) => [
      ...current,
      {
        uid: createLocalId("label"),
        name: createDefaultLabelName(current.length),
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
      title="ラベル一覧"
      description="パターン分類のためのラベルを管理します。"
      floatingActions={
        <Button
          size="icon"
          variant="outline"
          onClick={handleAdd}
          aria-label="ラベル追加"
          title="ラベル追加"
        >
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      {labels.length === 0 ? (
        <p className="rounded-md border border-dashed border-latte-surface1 px-3 py-4 text-xs text-latte-subtext0">
          ラベルがありません。「ラベル追加」から作成してください。
        </p>
      ) : null}

      <SortableList
        layout="grid"
        items={labels}
        onReorder={(next) => setLabels(next)}
        handleClassName="top-[0.875rem]"
        renderItem={(label) => {
          const isNameEmpty = label.name.trim().length === 0;
          const isMemoExpanded = expandedMemoUids.includes(label.uid);

          return (
            <div className="space-y-2 rounded-md border border-latte-surface1/80 bg-latte-crust/70 py-3 pl-9 pr-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  className="border-latte-surface2/70 bg-latte-surface0/55 text-latte-text placeholder:text-latte-overlay1"
                  value={label.name}
                  placeholder="ラベル名（必須）"
                  onChange={(event) =>
                    setLabels((current) =>
                      current.map((target) =>
                        target.uid === label.uid
                          ? { ...target, name: event.target.value }
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
                    onClick={() => toggleMemo(label.uid)}
                  >
                    <NotebookPen className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="ラベル削除"
                    onClick={() => {
                      setExpandedMemoUids((current) =>
                        current.filter((target) => target !== label.uid),
                      );
                      setLabels((current) =>
                        current.filter((target) => target.uid !== label.uid),
                      );
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-latte-red" />
                  </Button>
                </div>
              </div>
              {isNameEmpty ? (
                <p className="text-xs text-latte-red">
                  ラベル名は必須です。空欄のままでは計算できません。
                </p>
              ) : null}
              {isMemoExpanded ? (
                <div className="rounded-md border border-latte-surface1/70 bg-latte-mantle/55 p-2">
                  <Textarea
                    value={label.memo}
                    placeholder="メモ"
                    rows={2}
                    onChange={(event) =>
                      setLabels((current) =>
                        current.map((target) =>
                          target.uid === label.uid
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
