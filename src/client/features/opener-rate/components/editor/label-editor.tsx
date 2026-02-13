import { Plus } from "lucide-react";
import { useAtom } from "jotai";
import { useState } from "react";

import { Button } from "../../../../components/ui";
import { labelsAtom } from "../../state";
import { createLocalId } from "./create-local-id";
import { EditorEmptyState, editorNameInputClassName } from "./editor-ui";
import { NameMemoEditorItem } from "./name-memo-editor-item";
import { SortableEditorSection } from "./sortable-editor-section";

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
    <SortableEditorSection
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
      items={labels}
      onReorder={(next) => setLabels(next)}
      layout="grid"
      handleClassName="top-[0.875rem]"
      emptyState={
        <EditorEmptyState>
          ラベルがありません。「ラベル追加」から作成してください。
        </EditorEmptyState>
      }
      renderItem={(label) => {
        const isNameEmpty = label.name.trim().length === 0;
        const isMemoExpanded = expandedMemoUids.includes(label.uid);

        return (
          <NameMemoEditorItem
            name={label.name}
            namePlaceholder="ラベル名（必須）"
            onNameChange={(nextName) =>
              setLabels((current) =>
                current.map((target) =>
                  target.uid === label.uid
                    ? { ...target, name: nextName }
                    : target,
                ),
              )
            }
            isMemoExpanded={isMemoExpanded}
            onToggleMemo={() => toggleMemo(label.uid)}
            removeAriaLabel="ラベル削除"
            onRemove={() => {
              setExpandedMemoUids((current) =>
                current.filter((target) => target !== label.uid),
              );
              setLabels((current) =>
                current.filter((target) => target.uid !== label.uid),
              );
            }}
            isNameEmpty={isNameEmpty}
            nameErrorMessage="ラベル名は必須です。空欄のままでは計算できません。"
            memo={label.memo}
            onMemoChange={(nextMemo) =>
              setLabels((current) =>
                current.map((target) =>
                  target.uid === label.uid
                    ? { ...target, memo: nextMemo }
                    : target,
                ),
              )
            }
            topGridClassName="grid-cols-[minmax(0,1fr)_auto]"
            nameInputClassName={editorNameInputClassName}
            actionsClassName="justify-end"
          />
        );
      }}
    />
  );
};
