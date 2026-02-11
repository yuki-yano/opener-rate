import type { ReactNode } from "react";

import { Card } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";

type SectionCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const SectionCard = ({
  title,
  description,
  actions,
  children,
  className,
}: SectionCardProps) => {
  return (
    <Card
      className={cn(
        "overflow-hidden border-latte-surface0 bg-latte-mantle/95 p-0 shadow-[0_16px_40px_rgb(var(--ctp-shadow)/0.15)] md:backdrop-blur",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-latte-surface0/80 bg-latte-surface0/45 px-4 py-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold tracking-wide text-latte-text">
            {title}
          </h2>
          {description ? (
            <p className="text-xs text-latte-subtext0">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </header>
      <div className="space-y-4 px-4 py-4">{children}</div>
    </Card>
  );
};
