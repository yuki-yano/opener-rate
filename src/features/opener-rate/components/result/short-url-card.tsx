import { useAtomValue, useSetAtom } from "jotai";
import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Input } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import {
  isShortUrlGenerationLockedAtom,
  runShareCurrentUrlAtom,
  shortUrlErrorAtom,
  shortUrlInputAtom,
  shortUrlLoadingAtom,
} from "../../state";

type ShortUrlCardProps = {
  className?: string;
};

export const ShortUrlCard = ({ className }: ShortUrlCardProps) => {
  const url = useAtomValue(shortUrlInputAtom);
  const shortUrlLoading = useAtomValue(shortUrlLoadingAtom);
  const shortUrlError = useAtomValue(shortUrlErrorAtom);
  const isShortUrlGenerationLocked = useAtomValue(
    isShortUrlGenerationLockedAtom,
  );
  const runShareCurrentUrl = useSetAtom(runShareCurrentUrlAtom);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <section
      className={cn(
        "space-y-3 rounded-md border border-ui-surface0/80 bg-ui-mantle p-4 shadow-panel",
        className,
      )}
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <span className="text-sm font-semibold tracking-[0.08em] text-ui-text">
          共有URL
        </span>
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="relative min-w-0">
            <Input
              className="h-10 pr-9 text-sm"
              value={url}
              readOnly
              placeholder="「共有」を押すとURLを生成します"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md text-ui-subtext0 hover:text-ui-blue"
              aria-label="URLをコピー"
              onClick={async () => {
                const text = url.trim();
                if (text.length === 0) return;
                try {
                  await navigator.clipboard.writeText(text);
                  setCopied(true);
                } catch {
                  // クリップボード権限がない環境では無視
                }
              }}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <Button
            className="h-10 px-3 text-xs"
            size="sm"
            onClick={() => {
              void runShareCurrentUrl();
            }}
            disabled={shortUrlLoading || isShortUrlGenerationLocked}
          >
            {shortUrlLoading
              ? "作成中..."
              : isShortUrlGenerationLocked
                ? "共有済み"
                : "共有"}
          </Button>
        </div>
      </div>

      {shortUrlError ? (
        <p className="rounded-md border border-ui-red/40 bg-ui-red/12 px-3 py-2 text-xs text-ui-red">
          {shortUrlError}
        </p>
      ) : null}
    </section>
  );
};
