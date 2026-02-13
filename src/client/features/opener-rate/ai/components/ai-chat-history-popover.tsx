import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import { History, Loader2, Plus, Save } from "lucide-react";

import { aiPrimaryActionButtonClassName } from "./ai-chat-panel-style";
import type { UseAiChatControllerResult } from "./use-ai-chat-controller";

export const AiChatHistoryPopover = ({
  controller,
}: {
  controller: UseAiChatControllerResult;
}) => {
  return (
    <Popover
      open={controller.historyPopoverOpen}
      onOpenChange={controller.setHistoryPopoverOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-10 w-10 shrink-0 rounded-full border-ui-primary/35 bg-ui-primary/10 text-ui-primary hover:bg-ui-primary/18"
          aria-label="履歴メニューを開く"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        className="w-80 space-y-3 border-ui-border2/90 bg-[linear-gradient(165deg,rgba(var(--theme-layer1),0.97),rgba(var(--theme-bg),0.96))] p-3"
      >
        <div className="space-y-1">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ui-text">
            <History className="h-3.5 w-3.5 text-ui-primary" />
            履歴管理
          </p>
          <p className="text-[11px] text-ui-text3">
            現在の会話を保存、または履歴キーから復元できます。
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full justify-start border-ui-green/40 bg-ui-green/10 text-ui-green hover:bg-ui-green/15"
          disabled={!controller.canSaveHistory}
          onClick={() => {
            void controller.saveHistory();
          }}
        >
          {controller.isSavingHistory ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {controller.isSavingHistory ? "保存中..." : "現在の履歴を保存"}
        </Button>

        <div className="space-y-2 rounded-md border border-ui-border1 bg-ui-bg/70 p-2">
          <label
            htmlFor="history-restore-id"
            className="text-[11px] font-medium text-ui-text2"
          >
            履歴IDで復元
          </label>
          <Input
            id="history-restore-id"
            className="h-8 text-xs"
            placeholder="8桁の履歴ID"
            value={controller.historyIdToRestore}
            onChange={(event) => {
              controller.setHistoryIdToRestore(event.target.value);
            }}
          />
          <Button
            type="button"
            className={cn("w-full", aiPrimaryActionButtonClassName)}
            size="sm"
            disabled={!controller.canRestoreHistory}
            onClick={() => {
              void controller.restoreHistory();
            }}
          >
            {controller.isRestoringHistory ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <History className="mr-2 h-4 w-4" />
            )}
            {controller.isRestoringHistory ? "復元中..." : "復元する"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
