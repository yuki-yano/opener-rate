import type { ReactNode } from "react";

import { Card } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";

type SectionCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  floatingActions?: ReactNode;
  floatingActionsClassName?: string;
  children: ReactNode;
  className?: string;
};

export const SectionCard = ({
  title,
  description,
  actions,
  floatingActions,
  floatingActionsClassName,
  children,
  className,
}: SectionCardProps) => {
  return (
    <Card
      className={cn(
        "relative border-ui-surface0 bg-ui-mantle p-0 shadow-panel",
        className,
      )}
    >
      {floatingActions ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-30">
          <div className="sticky top-3 flex justify-end px-4 pt-3">
            <div
              className={cn(
                "pointer-events-auto w-fit [&>button]:border-ui-surface0 [&>button]:bg-ui-mantle [&>button]:shadow-sm [&>button]:hover:bg-ui-crust",
                floatingActionsClassName,
              )}
            >
              {floatingActions}
            </div>
          </div>
        </div>
      ) : null}
      <header
        className={cn(
          "rounded-t-md border-b border-ui-surface0 bg-ui-crust px-4 py-3",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className={cn("space-y-0.5", floatingActions && "pr-12")}>
            <h2 className="text-sm font-semibold text-ui-text">{title}</h2>
            {description ? (
              <p className="text-xs text-ui-subtext0">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </header>
      <div className="space-y-4 rounded-b-md px-4 py-4">{children}</div>
    </Card>
  );
};
