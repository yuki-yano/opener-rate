import {
  ChevronDown,
  ChevronRight,
  Copy,
  SquarePen,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button, Checkbox, Input } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import {
  editorErrorTextClassName,
  editorNameInputClassName,
} from "./editor-ui";

type ExpandableEditorCardProps = {
  isActive: boolean;
  isExpanded: boolean;
  isMemoExpanded: boolean;
  showMemoButton?: boolean;
  name: string;
  namePlaceholder: string;
  activeContainerClassName: string;
  inactiveContainerClassName: string;
  activeAriaLabel: string;
  memoAriaLabel?: string;
  duplicateAriaLabel: string;
  removeAriaLabel: string;
  nameErrorMessage?: string;
  onActiveChange: (next: boolean) => void;
  onNameChange: (next: string) => void;
  onToggleMemo?: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onToggleCollapsed: () => void;
  expandedBody: ReactNode;
  collapsedBody: ReactNode;
  expandedToggleButtonClassName?: string;
  collapsedToggleButtonClassName?: string;
};

export const ExpandableEditorCard = ({
  isActive,
  isExpanded,
  isMemoExpanded,
  showMemoButton = true,
  name,
  namePlaceholder,
  activeContainerClassName,
  inactiveContainerClassName,
  activeAriaLabel,
  memoAriaLabel,
  duplicateAriaLabel,
  removeAriaLabel,
  nameErrorMessage,
  onActiveChange,
  onNameChange,
  onToggleMemo,
  onDuplicate,
  onRemove,
  onToggleCollapsed,
  expandedBody,
  collapsedBody,
  expandedToggleButtonClassName,
  collapsedToggleButtonClassName,
}: ExpandableEditorCardProps) => {
  return (
    <div
      className={cn(
        "relative min-w-0 space-y-2.5 rounded-md border py-2.5 pl-9 pr-2.5 shadow-[0_1px_0_rgb(var(--theme-bg)/0.45)]",
        isActive ? activeContainerClassName : inactiveContainerClassName,
      )}
    >
      <div className="relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-ui-border1/70 bg-ui-layer1 px-2 py-1.5">
        <Checkbox
          checked={isActive}
          onChange={(event) => onActiveChange(event.target.checked)}
          aria-label={activeAriaLabel}
          className={cn(
            "h-8 w-8 justify-center gap-0 border-transparent bg-ui-layer2/60 px-0 shadow-none",
            isActive ? "text-ui-primary" : "text-ui-red",
          )}
        />

        <Input
          className={cn("h-9", editorNameInputClassName)}
          value={name}
          placeholder={namePlaceholder}
          onChange={(event) => onNameChange(event.target.value)}
        />

        <div className="flex shrink-0 items-center gap-1">
          {showMemoButton ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 border border-transparent",
                isMemoExpanded && "text-ui-primary",
              )}
              aria-label={memoAriaLabel ?? "メモ表示切り替え"}
              onClick={() => {
                if (!isExpanded) {
                  onToggleCollapsed();
                }
                onToggleMemo?.();
              }}
            >
              <SquarePen className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 border border-transparent"
            aria-label={duplicateAriaLabel}
            onClick={onDuplicate}
          >
            <Copy className="h-4 w-4 text-ui-text3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 border border-transparent"
            aria-label={removeAriaLabel}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4 text-ui-red" />
          </Button>
        </div>
      </div>

      {nameErrorMessage ? (
        <p className={editorErrorTextClassName}>{nameErrorMessage}</p>
      ) : null}

      {isExpanded ? (
        <div className="relative">
          {expandedBody}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-[-1.75rem] z-10 w-5 rounded-md border border-ui-border1/80 bg-ui-bg p-0 text-ui-text3 shadow-sm transition-colors duration-150 hover:border-ui-primary/60 hover:text-ui-primary",
              expandedToggleButtonClassName ?? "top-1/2 h-8 -translate-y-1/2",
            )}
            aria-label="折りたたむ"
            onClick={onToggleCollapsed}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative flex flex-wrap items-center gap-2 rounded-md border border-ui-border1/70 bg-ui-layer1/80 px-2.5 py-2 text-xs text-ui-text3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-[-1.75rem] z-10 w-5 rounded-md border border-ui-border1/80 bg-ui-bg p-0 text-ui-text3 shadow-sm transition-colors duration-150 hover:border-ui-primary/60 hover:text-ui-primary",
              collapsedToggleButtonClassName ?? "top-1/2 h-8 -translate-y-1/2",
            )}
            aria-label="展開する"
            onClick={onToggleCollapsed}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {collapsedBody}
        </div>
      )}
    </div>
  );
};
