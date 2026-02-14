import { Button, Select, Textarea } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import {
  AlertCircle,
  Check,
  Copy,
  History,
  SendHorizontal,
  Square,
} from "lucide-react";

import { AiChatHistoryPopover } from "./ai-chat-history-popover";
import {
  aiPrimaryActionButtonClassName,
  resolveAiApplyFeedbackClassName,
  resolveAiUiMessageClassName,
} from "./ai-chat-panel-style";
import {
  type UseAiChatControllerResult,
  thinkingLevelOptions,
} from "./use-ai-chat-controller";

const chatInputClassName =
  "min-h-10 max-h-36 flex-1 resize-y rounded-lg border-ui-border2 bg-ui-layer1/95 shadow-none";

export const AiChatPanelFooter = ({
  controller,
}: {
  controller: UseAiChatControllerResult;
}) => {
  const shouldRenderActionRow =
    controller.canApplyLastAssistantJson ||
    (controller.applyFeedback != null && controller.lastAssistantJson != null);

  return (
    <div className="space-y-3 border-t border-ui-border1/90 bg-ui-bg/65 px-4 py-3">
      {controller.savedHistoryKey != null ? (
        <div className="flex items-center justify-between rounded-md border border-ui-border1/90 bg-ui-layer1/80 px-2.5 py-1.5 text-xs text-ui-text2">
          <div className="inline-flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-ui-primary" />
            <span>履歴キー: {controller.savedHistoryKey}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2"
            onClick={() => {
              void controller.copySavedHistoryKey();
            }}
          >
            <Copy className="mr-1 h-3 w-3" />
            コピー
          </Button>
        </div>
      ) : null}

      {controller.uiMessage != null ? (
        <div
          className={cn(
            "rounded-md px-3 py-2 text-xs",
            resolveAiUiMessageClassName(controller.uiMessage.kind),
          )}
        >
          {controller.uiMessage.text}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <Select
          ariaLabel="Thinking Level"
          className="w-[7.75rem] min-w-0 shrink-0"
          value={controller.thinkingLevel}
          options={thinkingLevelOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          disabled={controller.isLoading}
          triggerClassName="h-8 w-full min-w-0 bg-ui-layer1/80 text-xs"
          onChange={(next) =>
            controller.setThinkingLevel(next as typeof controller.thinkingLevel)
          }
        />

        {shouldRenderActionRow ? (
          <div className="flex min-w-0 flex-col items-end gap-2">
            {controller.applyFeedback != null &&
            controller.lastAssistantJson != null ? (
              <div
                className={cn(
                  "inline-flex max-w-[9.5rem] items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs",
                  resolveAiApplyFeedbackClassName(controller.applyFeedback.kind),
                )}
              >
                {controller.applyFeedback.kind === "success" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                <span className="truncate">
                  {controller.applyFeedback.text}
                </span>
              </div>
            ) : null}

            {controller.canApplyLastAssistantJson ? (
              <Button
                type="button"
                size="sm"
                className={aiPrimaryActionButtonClassName}
                onClick={() => {
                  void controller.applyLastAssistantJson();
                }}
              >
                データを適用
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={controller.submitMessage}
      >
        <AiChatHistoryPopover controller={controller} />

        <Textarea
          className={chatInputClassName}
          placeholder="メッセージを入力（Ctrl/Cmd + Enter で送信）"
          value={controller.input}
          disabled={controller.isLoading}
          onChange={(event) => controller.setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button
          type={controller.isLoading ? "button" : "submit"}
          variant={controller.isLoading ? "outline" : "default"}
          size="sm"
          className={cn(
            "h-10 shrink-0 rounded-lg px-4",
            controller.isLoading
              ? "border-ui-red/40 bg-ui-red/8 text-ui-red hover:bg-ui-red/14"
              : aiPrimaryActionButtonClassName,
          )}
          disabled={controller.isLoading ? false : !controller.canSendMessage}
          onClick={controller.isLoading ? controller.stopGeneration : undefined}
        >
          {controller.isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Square className="h-4 w-4" />
              停止
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <SendHorizontal className="h-4 w-4" />
              送信
            </span>
          )}
        </Button>
      </form>
    </div>
  );
};
