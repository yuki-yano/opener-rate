import { Button, Input, Popover, PopoverContent, PopoverTrigger, Select, Textarea } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import {
  AlertCircle,
  ArrowDown,
  Bot,
  Check,
  Copy,
  History,
  Loader2,
  Plus,
  Save,
  SendHorizontal,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import {
  type UseAiChatControllerResult,
  thinkingLevelOptions,
} from "./use-ai-chat-controller";

const ScrollToBottomButton = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;

  return (
    <Button
      type="button"
      size="icon"
      className="absolute bottom-4 right-4 z-20 h-10 w-10 rounded-full border border-ui-lavender/60 bg-ui-lavender text-white shadow-panel hover:bg-ui-blue"
      aria-label="最下部へスクロール"
      onClick={() => {
        void scrollToBottom({ animation: "smooth" });
      }}
    >
      <ArrowDown className="h-4 w-4" />
    </Button>
  );
};

type AiChatPanelProps = {
  controller: UseAiChatControllerResult;
};

export const AiChatPanel = ({ controller }: AiChatPanelProps) => {
  return (
    <section
      className={cn(
        "fixed bottom-3 left-3 right-3 z-40 flex h-[88svh] flex-col overflow-hidden rounded-xl border md:bottom-6 md:left-auto md:right-6 md:h-[82svh] md:w-[44rem]",
        "border-ui-surface1/90 bg-ui-mantle/95 backdrop-blur-sm",
        "shadow-[0_30px_70px_-34px_rgba(var(--theme-shadow),0.72)]",
      )}
    >
      <header className="relative flex items-center justify-between border-b border-ui-surface0/90 bg-ui-base/80 px-4 py-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--theme-blue),0.13),transparent_58%)]" />
        <div className="relative flex items-center gap-2">
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ui-blue/25 bg-ui-blue/10 text-ui-blue">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold tracking-[0.08em] text-ui-text">
              AI チャット
            </h2>
            {controller.hasMessages ? (
              <p className="text-[11px] text-ui-subtext0">
                {controller.displayedMessages.length} 件のメッセージ
              </p>
            ) : null}
          </div>
          <span className="inline-flex items-center rounded-full border border-ui-surface1 bg-ui-base px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-ui-subtext1">
            {controller.aiProvider}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.07em]",
              controller.isLoading
                ? "border-ui-green/30 bg-ui-green/10 text-ui-green"
                : "border-ui-surface1 bg-ui-base text-ui-subtext1",
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
            className="h-8 w-8 rounded-full border border-transparent bg-ui-mantle/70 text-ui-subtext1 hover:border-ui-surface0 hover:bg-ui-mantle"
            onClick={controller.openSystemPromptDialog}
            aria-label="システムプロンプトを編集"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full border border-transparent bg-ui-mantle/70 text-ui-subtext1 hover:border-ui-surface0 hover:bg-ui-mantle"
            onClick={() => controller.setIsChatOpen(false)}
            aria-label="チャットを閉じる"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(var(--theme-base),0.72),rgba(var(--theme-mantle),0.98))]">
        <StickToBottom className="relative h-full" initial="smooth" resize="smooth">
          <StickToBottom.Content
            scrollClassName="overscroll-contain"
            className="space-y-3 px-4 py-4"
          >
            {!controller.hasMessages ? (
              <div className="rounded-lg border border-dashed border-ui-surface1 bg-ui-base/45 px-4 py-3 text-sm text-ui-subtext0">
                <p className="font-medium text-ui-subtext1">
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
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.07em] uppercase",
                        isUser
                          ? "ml-auto border border-ui-surface1 bg-ui-base text-ui-subtext1"
                          : "border border-ui-surface1 bg-ui-base text-ui-subtext1",
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
                        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                        isUser
                          ? "border border-ui-surface1 bg-ui-crust text-ui-text shadow-sm"
                          : "border border-ui-surface1 bg-ui-mantle text-ui-text shadow-sm",
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
                <div className="inline-flex items-center gap-2 rounded-xl border border-ui-surface1 bg-ui-mantle px-3 py-2 text-xs text-ui-subtext1 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-ui-blue" />
                  <span>{controller.loadingLabel}</span>
                </div>
              </div>
            ) : null}

            {controller.parsedError != null ? (
              <div className="rounded-md border border-ui-red/40 bg-ui-red/12 px-3 py-2 text-xs text-ui-red">
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

      <div className="space-y-3 border-t border-ui-surface0/90 bg-ui-base/65 px-4 py-3">
        {controller.savedHistoryKey != null ? (
          <div className="flex items-center justify-between rounded-md border border-ui-surface0/90 bg-ui-mantle/80 px-2.5 py-1.5 text-xs text-ui-subtext1">
            <div className="inline-flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-ui-blue" />
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
              controller.uiMessage.kind === "success"
                ? "border border-ui-lavender/40 bg-ui-lavender/12 text-ui-blue"
                : "border border-ui-red/40 bg-ui-red/12 text-ui-red",
            )}
          >
            {controller.uiMessage.text}
          </div>
        ) : null}

        <div className="grid grid-cols-[8.75rem_auto] items-end gap-2 sm:grid-cols-[10rem_auto] sm:gap-3">
          <div className="w-[8.75rem] rounded-lg border border-ui-surface0/90 bg-ui-mantle/75 px-3 py-2 sm:w-[10rem]">
            <div className="min-w-0 space-y-1 text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-ui-subtext0">
                Thinking Level
              </p>
              <Select
                ariaLabel="Thinking Level"
                className="w-full min-w-0"
                value={controller.thinkingLevel}
                options={thinkingLevelOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                disabled={controller.isLoading}
                triggerClassName="h-9 w-full min-w-0 bg-ui-mantle text-xs"
                onChange={(next) =>
                  controller.setThinkingLevel(next as typeof controller.thinkingLevel)
                }
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-end gap-2">
            <div className="flex min-h-8 justify-end">
              {controller.applyFeedback != null &&
              controller.lastAssistantJson != null ? (
                <div
                  className={cn(
                    "inline-flex max-w-[9.5rem] items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs",
                    controller.applyFeedback.kind === "success"
                      ? "border border-ui-lavender/35 bg-ui-lavender/10 text-ui-blue"
                      : "border border-ui-red/40 bg-ui-red/12 text-ui-red",
                  )}
                >
                  {controller.applyFeedback.kind === "success" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  <span className="truncate">{controller.applyFeedback.text}</span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {controller.canApplyLastAssistantJson ? (
                <Button
                  type="button"
                  size="sm"
                  className="border border-ui-lavender/70 bg-ui-lavender text-white hover:bg-ui-blue"
                  onClick={() => {
                    void controller.applyLastAssistantJson();
                  }}
                >
                  データを適用
                </Button>
              ) : null}

              {controller.isLoading ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-ui-red/40 bg-ui-red/8 text-ui-red hover:bg-ui-red/14"
                  onClick={controller.stopGeneration}
                >
                  停止
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <form className="flex items-center gap-2" onSubmit={controller.submitMessage}>
          <Popover
            open={controller.historyPopoverOpen}
            onOpenChange={controller.setHistoryPopoverOpen}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-10 w-10 shrink-0 rounded-full border-ui-blue/35 bg-ui-blue/10 text-ui-blue hover:bg-ui-blue/18"
                aria-label="履歴メニューを開く"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="w-80 space-y-3 border-ui-surface1/90 bg-[linear-gradient(165deg,rgba(var(--theme-mantle),0.97),rgba(var(--theme-base),0.96))] p-3"
            >
              <div className="space-y-1">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ui-text">
                  <History className="h-3.5 w-3.5 text-ui-blue" />
                  履歴管理
                </p>
                <p className="text-[11px] text-ui-subtext0">
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

              <div className="space-y-2 rounded-md border border-ui-surface0 bg-ui-base/70 p-2">
                <label
                  htmlFor="history-restore-id"
                  className="text-[11px] font-medium text-ui-subtext1"
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
                  className="w-full border border-ui-lavender/70 bg-ui-lavender text-white hover:bg-ui-blue"
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

          <Textarea
            className="min-h-10 max-h-36 flex-1 resize-y rounded-lg border-ui-surface1 bg-ui-mantle/95 shadow-none"
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
            type="submit"
            size="sm"
            className="h-10 shrink-0 rounded-lg border border-ui-lavender/70 bg-ui-lavender px-4 text-white hover:bg-ui-blue"
            disabled={!controller.canSendMessage}
          >
            {controller.isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                送信中...
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
    </section>
  );
};
