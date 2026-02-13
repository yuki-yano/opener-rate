import { Button } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import { AlertCircle, ArrowDown, Bot, Loader2, UserRound } from "lucide-react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import {
  aiDangerNoticeClassName,
  aiScrollToBottomButtonClassName,
} from "./ai-chat-panel-style";
import type { UseAiChatControllerResult } from "./use-ai-chat-controller";

const messageRoleBadgeClassName =
  "inline-flex items-center gap-1.5 rounded-full border border-ui-border2 bg-ui-bg px-2.5 py-1 text-[10px] font-semibold tracking-[0.07em] uppercase text-ui-text2";

const messageBubbleBaseClassName =
  "rounded-2xl border border-ui-border2 px-3.5 py-2.5 text-sm leading-relaxed text-ui-text shadow-sm whitespace-pre-wrap";

const messageListLoadingClassName =
  "inline-flex items-center gap-2 rounded-xl border border-ui-border2 bg-ui-layer1 px-3 py-2 text-xs text-ui-text2 shadow-sm";

const ScrollToBottomButton = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <Button
      type="button"
      size="icon"
      className={aiScrollToBottomButtonClassName}
      aria-label="最下部へスクロール"
      onClick={() => {
        void scrollToBottom({ animation: "smooth" });
      }}
    >
      <ArrowDown className="h-4 w-4" />
    </Button>
  );
};

export const AiChatMessageList = ({
  controller,
}: {
  controller: UseAiChatControllerResult;
}) => {
  return (
    <div className="relative flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(var(--theme-bg),0.72),rgba(var(--theme-layer1),0.98))]">
      <StickToBottom
        className="relative h-full"
        initial="smooth"
        resize="smooth"
      >
        <StickToBottom.Content
          scrollClassName="overscroll-contain"
          className="space-y-3 px-4 py-4"
        >
          {!controller.hasMessages ? (
            <div className="rounded-lg border border-dashed border-ui-border2 bg-ui-bg/45 px-4 py-3 text-sm text-ui-text3">
              <p className="font-medium text-ui-text2">
                メッセージを送信すると応答が表示されます。
              </p>
              <p className="mt-1 text-xs">
                プロンプト入力後、`送信` で会話を開始できます。
              </p>
            </div>
          ) : null}

          {controller.displayedMessages.map((message, index) => {
            const isUser = message.role === "user";
            const key = `${message.role}-${index}`;

            return (
              <div
                key={key}
                className={cn("flex", isUser ? "justify-end" : "justify-start")}
              >
                <div className="max-w-[92%] space-y-1.5">
                  <div
                    className={cn(
                      messageRoleBadgeClassName,
                      isUser && "ml-auto",
                    )}
                  >
                    {isUser ? (
                      <UserRound className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3" />
                    )}
                    {isUser ? "You" : "Assistant"}
                  </div>
                  <div
                    className={cn(
                      messageBubbleBaseClassName,
                      isUser ? "bg-ui-layer2" : "bg-ui-layer1",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })}

          {controller.isLoading ? (
            <div className="flex justify-start">
              <div className={messageListLoadingClassName}>
                <Loader2 className="h-4 w-4 animate-spin text-ui-primary" />
                <span>{controller.loadingLabel}</span>
              </div>
            </div>
          ) : null}

          {controller.parsedError != null ? (
            <div className={aiDangerNoticeClassName}>
              <p className="inline-flex items-start gap-1.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{controller.parsedError}</span>
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void controller.retry();
                  }}
                >
                  再試行
                </Button>
              </div>
            </div>
          ) : null}
        </StickToBottom.Content>

        <ScrollToBottomButton />
      </StickToBottom>
    </div>
  );
};
