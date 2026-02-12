import type { ReactNode } from "react";

import { SortableList } from "../common/sortable-list";
import { SectionCard } from "../layout/section-card";

type SortableEditorSectionProps<T extends { uid: string }> = {
  title: string;
  description?: string;
  actions?: ReactNode;
  floatingActions?: ReactNode;
  floatingActionsClassName?: string;
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (item: T) => ReactNode;
  layout?: "list" | "grid";
  handleClassName?: string;
  beforeList?: ReactNode;
  emptyState?: ReactNode;
  className?: string;
};

export const SortableEditorSection = <T extends { uid: string }>({
  title,
  description,
  actions,
  floatingActions,
  floatingActionsClassName,
  items,
  onReorder,
  renderItem,
  layout = "list",
  handleClassName,
  beforeList,
  emptyState,
  className,
}: SortableEditorSectionProps<T>) => {
  return (
    <SectionCard
      title={title}
      description={description}
      actions={actions}
      floatingActions={floatingActions}
      floatingActionsClassName={floatingActionsClassName}
      className={className}
    >
      {beforeList}
      {items.length === 0 ? emptyState : null}
      <SortableList
        layout={layout}
        items={items}
        onReorder={onReorder}
        handleClassName={handleClassName}
        renderItem={renderItem}
      />
    </SectionCard>
  );
};
