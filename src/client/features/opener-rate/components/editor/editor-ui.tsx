import type { ReactNode } from "react";

import { cn } from "../../../../lib/cn";

export const editorFieldLabelClassName = "space-y-1.5 text-xs text-ui-text3";
export const editorCompactFieldLabelClassName =
  "space-y-1 text-[11px] text-ui-text3";
export const editorErrorTextClassName = "text-xs text-ui-red";
export const editorEmptyStateClassName =
  "rounded-md border border-dashed border-ui-border1/80 bg-ui-layer2/45 px-3 py-4 text-xs text-ui-text3";
export const editorListItemClassName =
  "space-y-2 rounded-md border border-ui-border1/80 bg-ui-layer1 py-3 pl-9 pr-3";
export const editorMemoPanelClassName = "pt-1";

type EditorEmptyStateProps = {
  children: ReactNode;
  className?: string;
};

export const EditorEmptyState = ({
  children,
  className,
}: EditorEmptyStateProps) => {
  return <p className={cn(editorEmptyStateClassName, className)}>{children}</p>;
};

type EditorListItemProps = {
  children: ReactNode;
  className?: string;
};

export const EditorListItem = ({
  children,
  className,
}: EditorListItemProps) => {
  return (
    <div className={cn(editorListItemClassName, className)}>{children}</div>
  );
};

type EditorMemoPanelProps = {
  children: ReactNode;
  className?: string;
};

export const EditorMemoPanel = ({
  children,
  className,
}: EditorMemoPanelProps) => {
  return (
    <div className={cn(editorMemoPanelClassName, className)}>{children}</div>
  );
};
