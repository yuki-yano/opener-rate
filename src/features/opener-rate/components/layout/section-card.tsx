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
        "relative border-latte-surface0 bg-latte-mantle/95 p-0 shadow-[0_16px_40px_rgb(var(--ctp-shadow)/0.15)] md:backdrop-blur",
        className,
      )}
    >
      {floatingActions ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 z-30">
          <div className="sticky top-3 flex justify-end px-4 pt-3">
            <div
              className={cn(
                "pointer-events-auto w-fit [&>button]:border-latte-surface1 [&>button]:bg-latte-surface0 [&>button]:shadow-sm [&>button]:hover:bg-latte-surface0",
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
          "rounded-t-lg border-b border-latte-surface0/80 bg-latte-surface0/45 px-4 py-3",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold tracking-wide text-latte-text">
              {title}
            </h2>
            {description ? (
              <p className="text-xs text-latte-subtext0">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      </header>
      <div className="space-y-4 rounded-b-lg px-4 py-4">{children}</div>
    </Card>
  );
};
