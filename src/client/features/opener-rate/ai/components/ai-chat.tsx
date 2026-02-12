import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAtom } from "jotai";
import {
  AlertCircle,
  ArrowDown,
  Bot,
  Check,
  Copy,
  History,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  SendHorizontal,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import type { ThinkingLevel } from "../../../../../shared/apiSchemas";
import {
  Badge,
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  Textarea,
} from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import {
  saveChatHistory,
  restoreChatHistory,
} from "../api/chat-history-client";
import { CHAT_STATE_MARKER, DEFAULT_SYSTEM_PROMPT } from "../const";
import {
  extractJsonBlock,
  extractLastAssistantText,
  stripStateBlockFromUserContent,
  toChatMessages,
  toUIMessages,
} from "../lib/message-utils";
import {
  aiProviderAtom,
  isChatOpenAtom,
  systemPromptAtom,
  thinkingLevelAtom,
} from "../state/atoms";
import { SystemPromptDialog } from "./system-prompt-dialog";

const thinkingLevelOptions = [
  { value: "minimal", label: "minimal" },
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
] as const satisfies ReadonlyArray<{ value: ThinkingLevel; label: string }>;

const parseChatErrorMessage = (error: Error | undefined) => {
  if (error == null) return null;
  const trimmed = error.message.trim();
  if (trimmed.length === 0) return "チャットエラーが発生しました";
  try {
    const parsed = JSON.parse(trimmed);
    if (
      typeof parsed === "object" &&
      parsed != null &&
      "error" in parsed &&
      typeof parsed.error === "string" &&
      parsed.error.trim().length > 0
    ) {
      return parsed.error;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
};

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

type AiChatProps = {
  enabled: boolean;
};

export const AiChat = ({ enabled }: AiChatProps) => {
  const [isChatOpen, setIsChatOpen] = useAtom(isChatOpenAtom);
  const [aiProvider] = useAtom(aiProviderAtom);
  const [thinkingLevel, setThinkingLevel] = useAtom(thinkingLevelAtom);
  const [systemPromptDialogOpen, setSystemPromptDialogOpen] = useState(false);
  const [historyPopoverOpen, setHistoryPopoverOpen] = useState(false);
  const [input, setInput] = useState("");
  const [savedHistoryKey, setSavedHistoryKey] = useState<null | string>(null);
  const [historyIdToRestore, setHistoryIdToRestore] = useState("");
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [isRestoringHistory, setIsRestoringHistory] = useState(false);
  const [uiMessage, setUiMessage] = useState<null | {
    kind: "error" | "success";
    text: string;
  }>(null);
  const [applyFeedback, setApplyFeedback] = useState<null | {
    kind: "error" | "success";
    text: string;
  }>(null);
  const [systemPrompt, setSystemPrompt] = useAtom(systemPromptAtom);
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(systemPrompt);

  const systemPromptRef = useRef(systemPrompt);
  const thinkingLevelRef = useRef<ThinkingLevel>(thinkingLevel);
  const lastSentStateRef = useRef<string | null>(null);

  useEffect(() => {
    systemPromptRef.current = systemPrompt;
  }, [systemPrompt]);

  useEffect(() => {
    thinkingLevelRef.current = thinkingLevel;
  }, [thinkingLevel]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          systemPrompt: systemPromptRef.current,
          thinkingLevel: thinkingLevelRef.current,
        }),
        prepareSendMessagesRequest: ({ body, ...request }) => ({
          body: {
            ...(body ?? {}),
            id: request.id,
            messageId: request.messageId,
            trigger: request.trigger,
            messages: toChatMessages(request.messages),
          },
        }),
      }),
    [],
  );

  const {
    messages,
    setMessages,
    sendMessage,
    regenerate,
    status,
    stop,
    error,
  } = useChat({
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const loadingLabel =
    status === "submitted"
      ? "送信しています..."
      : "AIが回答を生成しています...";
  const parsedError = parseChatErrorMessage(error);

  const nonSystemMessages = useMemo(() => {
    return toChatMessages(messages).filter(
      (message) => message.role === "user" || message.role === "assistant",
    );
  }, [messages]);

  const displayedMessages = useMemo(() => {
    return nonSystemMessages.map((message) => {
      if (message.role !== "user") return message;
      return {
        ...message,
        content: stripStateBlockFromUserContent(message.content),
      };
    });
  }, [nonSystemMessages]);
  const hasMessages = displayedMessages.length > 0;

  const lastAssistantJson = useMemo(() => {
    const lastAssistantText = extractLastAssistantText(messages);
    if (lastAssistantText == null) return null;
    return extractJsonBlock(lastAssistantText);
  }, [messages]);

  const isHistoryIdValid = /^[0-9a-z]{8}$/.test(historyIdToRestore.trim());

  useEffect(() => {
    if (uiMessage == null) return;
    const timer = window.setTimeout(() => setUiMessage(null), 3600);
    return () => window.clearTimeout(timer);
  }, [uiMessage]);

  useEffect(() => {
    if (applyFeedback == null) return;
    const timer = window.setTimeout(() => setApplyFeedback(null), 3600);
    return () => window.clearTimeout(timer);
  }, [applyFeedback]);

  if (!enabled) return null;

  return (
    <>
      {!isChatOpen ? (
        <Button
          type="button"
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full border border-ui-lavender/65",
            "bg-ui-lavender text-white",
            "shadow-[0_18px_44px_-20px_rgba(var(--theme-lavender),0.78)]",
            "hover:bg-ui-blue",
          )}
          onClick={() => setIsChatOpen(true)}
          aria-label="チャットを開く"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : null}

      {isChatOpen ? (
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
                {hasMessages ? (
                  <p className="text-[11px] text-ui-subtext0">
                    {displayedMessages.length} 件のメッセージ
                  </p>
                ) : null}
              </div>
              <Badge variant="muted" className="uppercase">
                {aiProvider}
              </Badge>
              <Badge
                variant={isLoading ? "success" : "muted"}
                className="uppercase"
              >
                {isLoading ? "thinking" : "ready"}
              </Badge>
            </div>
            <div className="relative flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border border-transparent bg-ui-mantle/70 text-ui-subtext1 hover:border-ui-surface0 hover:bg-ui-mantle"
                onClick={() => {
                  setDraftSystemPrompt(systemPrompt);
                  setSystemPromptDialogOpen(true);
                }}
                aria-label="システムプロンプトを編集"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full border border-transparent bg-ui-mantle/70 text-ui-subtext1 hover:border-ui-surface0 hover:bg-ui-mantle"
                onClick={() => setIsChatOpen(false)}
                aria-label="チャットを閉じる"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="relative flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(var(--theme-base),0.72),rgba(var(--theme-mantle),0.98))]">
            <StickToBottom
              className="relative h-full"
              initial="smooth"
              resize="smooth"
            >
              <StickToBottom.Content
                scrollClassName="overscroll-contain"
                className="space-y-3 px-4 py-4"
              >
                {!hasMessages ? (
                  <div className="rounded-lg border border-dashed border-ui-surface1 bg-ui-base/45 px-4 py-3 text-sm text-ui-subtext0">
                    <p className="font-medium text-ui-subtext1">
                      メッセージを送信すると応答が表示されます。
                    </p>
                    <p className="mt-1 text-xs">
                      プロンプト入力後、`送信` で会話を開始できます。
                    </p>
                  </div>
                ) : null}

                {displayedMessages.map((message, index) => {
                  const isUser = message.role === "user";
                  const key = `${message.role}-${index}`;
                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex",
                        isUser ? "justify-end" : "justify-start",
                      )}
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

                {isLoading ? (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-ui-surface1 bg-ui-mantle px-3 py-2 text-xs text-ui-subtext1 shadow-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-ui-blue" />
                      <span>{loadingLabel}</span>
                    </div>
                  </div>
                ) : null}

                {parsedError != null ? (
                  <div className="rounded-md border border-ui-red/40 bg-ui-red/12 px-3 py-2 text-xs text-ui-red">
                    <p className="inline-flex items-start gap-1.5">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{parsedError}</span>
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void regenerate();
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
            {savedHistoryKey != null ? (
              <div className="flex items-center justify-between rounded-md border border-ui-surface0/90 bg-ui-mantle/80 px-2.5 py-1.5 text-xs text-ui-subtext1">
                <div className="inline-flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-ui-blue" />
                  <span>履歴キー: {savedHistoryKey}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(savedHistoryKey);
                      setUiMessage({
                        kind: "success",
                        text: "履歴キーをコピーしました",
                      });
                    } catch {
                      setUiMessage({
                        kind: "error",
                        text: "クリップボードへのコピーに失敗しました",
                      });
                    }
                  }}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  コピー
                </Button>
              </div>
            ) : null}

            {uiMessage != null ? (
              <div
                className={cn(
                  "rounded-md px-3 py-2 text-xs",
                  uiMessage.kind === "success"
                    ? "border border-ui-lavender/40 bg-ui-lavender/12 text-ui-blue"
                    : "border border-ui-red/40 bg-ui-red/12 text-ui-red",
                )}
              >
                {uiMessage.text}
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
                    value={thinkingLevel}
                    options={thinkingLevelOptions.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    disabled={isLoading}
                    triggerClassName="h-9 w-full min-w-0 bg-ui-mantle text-xs"
                    onChange={(next) => {
                      setThinkingLevel(next as ThinkingLevel);
                      setSavedHistoryKey(null);
                    }}
                  />
                </div>
              </div>

              <div className="flex min-w-0 flex-col items-end gap-2">
                <div className="flex min-h-8 justify-end">
                  {applyFeedback != null && lastAssistantJson != null ? (
                    <div
                      className={cn(
                        "inline-flex max-w-[9.5rem] items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs",
                        applyFeedback.kind === "success"
                          ? "border border-ui-lavender/35 bg-ui-lavender/10 text-ui-blue"
                          : "border border-ui-red/40 bg-ui-red/12 text-ui-red",
                      )}
                    >
                      {applyFeedback.kind === "success" ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                      <span className="truncate">{applyFeedback.text}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {lastAssistantJson != null && !isLoading ? (
                    <Button
                      type="button"
                      size="sm"
                      className="border border-ui-lavender/70 bg-ui-lavender text-white hover:bg-ui-blue"
                      onClick={async () => {
                        if (window.importState == null) {
                          setApplyFeedback({
                            kind: "error",
                            text: "importState が利用できません",
                          });
                          return;
                        }
                        const applied =
                          await window.importState(lastAssistantJson);
                        if (applied) {
                          setSavedHistoryKey(null);
                          setApplyFeedback({
                            kind: "success",
                            text: "データを適用しました",
                          });
                        } else {
                          setApplyFeedback({
                            kind: "error",
                            text: "データの適用に失敗しました",
                          });
                        }
                      }}
                    >
                      データを適用
                    </Button>
                  ) : null}

                  {isLoading ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-ui-red/40 bg-ui-red/8 text-ui-red hover:bg-ui-red/14"
                      onClick={() => stop()}
                    >
                      停止
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const trimmedInput = input.trim();
                if (trimmedInput.length === 0 || isLoading) return;

                let contentToSend = trimmedInput;
                const currentState = window.exportState?.();
                if (
                  typeof currentState === "string" &&
                  currentState.trim().length > 0 &&
                  currentState !== lastSentStateRef.current
                ) {
                  contentToSend = `${trimmedInput}${CHAT_STATE_MARKER}\n\`\`\`json\n${currentState}\n\`\`\``;
                  lastSentStateRef.current = currentState;
                }

                setSavedHistoryKey(null);
                setInput("");
                void sendMessage({
                  text: contentToSend,
                });
              }}
            >
              <Popover
                open={historyPopoverOpen}
                onOpenChange={setHistoryPopoverOpen}
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
                    disabled={isSavingHistory || nonSystemMessages.length === 0}
                    onClick={async () => {
                      if (isSavingHistory || nonSystemMessages.length === 0)
                        return;
                      setIsSavingHistory(true);
                      setSavedHistoryKey(null);
                      try {
                        const key = await saveChatHistory(nonSystemMessages);
                        setSavedHistoryKey(key);
                        setUiMessage({
                          kind: "success",
                          text: `履歴を保存しました: ${key}`,
                        });
                        setHistoryPopoverOpen(false);
                      } catch (historyError) {
                        const message =
                          historyError instanceof Error
                            ? historyError.message
                            : "履歴の保存に失敗しました";
                        setUiMessage({ kind: "error", text: message });
                      } finally {
                        setIsSavingHistory(false);
                      }
                    }}
                  >
                    {isSavingHistory ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSavingHistory ? "保存中..." : "現在の履歴を保存"}
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
                      value={historyIdToRestore}
                      onChange={(event) => {
                        setHistoryIdToRestore(event.target.value);
                      }}
                    />
                    <Button
                      type="button"
                      className="w-full border border-ui-lavender/70 bg-ui-lavender text-white hover:bg-ui-blue"
                      size="sm"
                      disabled={!isHistoryIdValid || isRestoringHistory}
                      onClick={async () => {
                        if (!isHistoryIdValid || isRestoringHistory) return;
                        setIsRestoringHistory(true);
                        try {
                          const restored = await restoreChatHistory(
                            historyIdToRestore.trim(),
                          );
                          setMessages(toUIMessages(restored));
                          setHistoryIdToRestore("");
                          setSavedHistoryKey(null);
                          setUiMessage({
                            kind: "success",
                            text: "履歴を復元しました",
                          });
                          setHistoryPopoverOpen(false);
                        } catch (historyError) {
                          const message =
                            historyError instanceof Error
                              ? historyError.message
                              : "履歴の復元に失敗しました";
                          setUiMessage({
                            kind: "error",
                            text: message,
                          });
                        } finally {
                          setIsRestoringHistory(false);
                        }
                      }}
                    >
                      {isRestoringHistory ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <History className="mr-2 h-4 w-4" />
                      )}
                      {isRestoringHistory ? "復元中..." : "復元する"}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Textarea
                className="min-h-10 max-h-36 flex-1 resize-y rounded-lg border-ui-surface1 bg-ui-mantle/95 shadow-none"
                placeholder="メッセージを入力（Ctrl/Cmd + Enter で送信）"
                value={input}
                disabled={isLoading}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.metaKey || event.ctrlKey)
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <Button
                type="submit"
                size="sm"
                className="h-10 shrink-0 rounded-lg border border-ui-lavender/70 bg-ui-lavender px-4 text-white hover:bg-ui-blue"
                disabled={input.trim().length === 0 || isLoading}
              >
                {isLoading ? (
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
      ) : null}

      <SystemPromptDialog
        open={systemPromptDialogOpen}
        draftPrompt={draftSystemPrompt}
        onDraftPromptChange={setDraftSystemPrompt}
        onOpenChange={setSystemPromptDialogOpen}
        onResetToDefault={() => setDraftSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
        onSave={() => {
          setSystemPrompt(draftSystemPrompt);
          setSystemPromptDialogOpen(false);
          setSavedHistoryKey(null);
        }}
      />
    </>
  );
};
