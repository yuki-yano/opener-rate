import {
  ChevronDown,
  ChevronRight,
  Copy,
  NotebookPen,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button, Checkbox, Input } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import { editorErrorTextClassName } from "./editor-ui";

type ExpandableEditorCardProps = {
  isActive: boolean;
  isExpanded: boolean;
  isMemoExpanded: boolean;
  name: string;
  namePlaceholder: string;
  activeContainerClassName: string;
  inactiveContainerClassName: string;
  activeAriaLabel: string;
  memoAriaLabel: string;
  duplicateAriaLabel: string;
  removeAriaLabel: string;
  nameErrorMessage?: string;
  onActiveChange: (next: boolean) => void;
  onNameChange: (next: string) => void;
  onToggleMemo: () => void;
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
        "relative min-w-0 space-y-2.5 rounded-md border py-2.5 pl-9 pr-2.5 shadow-[0_1px_0_rgb(var(--theme-base)/0.45)]",
        isActive ? activeContainerClassName : inactiveContainerClassName,
      )}
    >
      <div className="relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-ui-surface0/70 bg-ui-mantle px-2 py-1.5">
        <Checkbox
          checked={isActive}
          onChange={(event) => onActiveChange(event.target.checked)}
          aria-label={activeAriaLabel}
          className={cn(
            "h-8 w-8 justify-center gap-0 border-transparent bg-ui-crust/60 px-0 shadow-none",
            isActive ? "text-ui-blue" : "text-ui-red",
          )}
        />

        <Input
          className="h-9 border-ui-surface0/80 bg-ui-mantle text-ui-text placeholder:text-ui-overlay1"
          value={name}
          placeholder={namePlaceholder}
          onChange={(event) => onNameChange(event.target.value)}
        />

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 border border-transparent",
              isMemoExpanded && "text-ui-blue",
            )}
            aria-label={memoAriaLabel}
            onClick={() => {
              if (!isExpanded) {
                onToggleCollapsed();
              }
              onToggleMemo();
            }}
          >
            <NotebookPen className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 border border-transparent"
            aria-label={duplicateAriaLabel}
            onClick={onDuplicate}
          >
            <Copy className="h-4 w-4 text-ui-subtext0" />
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
              "absolute left-[-1.75rem] z-10 w-5 rounded-md border border-ui-surface0/80 bg-ui-base p-0 text-ui-subtext0 shadow-sm transition-colors duration-150 hover:border-ui-blue/60 hover:text-ui-blue",
              expandedToggleButtonClassName ?? "top-1/2 h-8 -translate-y-1/2",
            )}
            aria-label="折りたたむ"
            onClick={onToggleCollapsed}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative flex flex-wrap items-center gap-2 rounded-md border border-ui-surface0/70 bg-ui-mantle/80 px-2.5 py-2 text-xs text-ui-subtext0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-[-1.75rem] z-10 w-5 rounded-md border border-ui-surface0/80 bg-ui-base p-0 text-ui-subtext0 shadow-sm transition-colors duration-150 hover:border-ui-blue/60 hover:text-ui-blue",
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
