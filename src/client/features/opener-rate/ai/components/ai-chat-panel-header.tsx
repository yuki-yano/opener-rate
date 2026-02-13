import { Button } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import { Settings, Sparkles, X } from "lucide-react";

import {
  aiHeaderIconButtonClassName,
  resolveAiReadinessBadgeClassName,
} from "./ai-chat-panel-style";
import type { UseAiChatControllerResult } from "./use-ai-chat-controller";

export const AiChatPanelHeader = ({
  controller,
}: {
  controller: UseAiChatControllerResult;
}) => {
  return (
    <header className="relative flex items-center justify-between border-b border-ui-border1/90 bg-ui-bg/80 px-4 py-3">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--theme-primary),0.13),transparent_58%)]" />

      <div className="relative flex items-center gap-2">
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ui-primary/25 bg-ui-primary/10 text-ui-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-ui-text">
            AI チャット
          </h2>
          {controller.hasMessages ? (
            <p className="text-[11px] text-ui-text3">
              {controller.displayedMessages.length} 件のメッセージ
            </p>
          ) : null}
        </div>
        <span className="inline-flex items-center rounded-full border border-ui-border2 bg-ui-bg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-ui-text2">
          {controller.aiProvider}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.07em]",
            resolveAiReadinessBadgeClassName(controller.isLoading),
          )}
        >
          {controller.isLoading ? "thinking" : "ready"}
        </span>
      </div>

      <div className="relative flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={aiHeaderIconButtonClassName}
          onClick={controller.openSystemPromptDialog}
          aria-label="システムプロンプトを編集"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={aiHeaderIconButtonClassName}
          onClick={() => controller.setIsChatOpen(false)}
          aria-label="チャットを閉じる"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};
