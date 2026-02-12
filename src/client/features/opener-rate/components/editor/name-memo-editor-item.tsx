import { SquarePen, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button, Input, Textarea } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import {
  editorErrorTextClassName,
  EditorListItem,
  EditorMemoPanel,
} from "./editor-ui";

type NameMemoEditorItemProps = {
  name: string;
  namePlaceholder: string;
  onNameChange: (next: string) => void;
  isMemoExpanded: boolean;
  onToggleMemo: () => void;
  removeAriaLabel: string;
  onRemove: () => void;
  isNameEmpty: boolean;
  nameErrorMessage: string;
  memo: string;
  onMemoChange: (next: string) => void;
  topGridClassName: string;
  nameInputClassName?: string;
  actionsClassName?: string;
  topMiddle?: ReactNode;
  children?: ReactNode;
};

export const NameMemoEditorItem = ({
  name,
  namePlaceholder,
  onNameChange,
  isMemoExpanded,
  onToggleMemo,
  removeAriaLabel,
  onRemove,
  isNameEmpty,
  nameErrorMessage,
  memo,
  onMemoChange,
  topGridClassName,
  nameInputClassName,
  actionsClassName,
  topMiddle,
  children,
}: NameMemoEditorItemProps) => {
  return (
    <EditorListItem>
      <div className={cn("grid gap-2", topGridClassName)}>
        <Input
          className={nameInputClassName}
          value={name}
          placeholder={namePlaceholder}
          onChange={(event) => onNameChange(event.target.value)}
        />
        {topMiddle}
        <div className={cn("flex items-center gap-1", actionsClassName)}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={isMemoExpanded ? "text-ui-primary" : undefined}
            aria-label="メモ表示切り替え"
            onClick={onToggleMemo}
          >
            <SquarePen className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={removeAriaLabel}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4 text-ui-red" />
          </Button>
        </div>
      </div>
      {children}
      {isNameEmpty ? (
        <p className={editorErrorTextClassName}>{nameErrorMessage}</p>
      ) : null}
      {isMemoExpanded ? (
        <EditorMemoPanel>
          <Textarea
            value={memo}
            placeholder="メモ"
            rows={2}
            onChange={(event) => onMemoChange(event.target.value)}
          />
        </EditorMemoPanel>
      ) : null}
    </EditorListItem>
  );
};
