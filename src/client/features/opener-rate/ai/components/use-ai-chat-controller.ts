import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import type {
  ChatMessage,
  ThinkingLevel,
} from "../../../../../shared/apiSchemas";
import {
  saveChatHistory,
  restoreChatHistory,
} from "../api/chat-history-client";
import { CHAT_STATE_MARKER, DEFAULT_SYSTEM_PROMPT } from "../const";
import { parseChatErrorMessage } from "../lib/chat-error-utils";
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

type FeedbackMessage = null | {
  kind: "error" | "success";
  text: string;
};

export const thinkingLevelOptions = [
  { value: "minimal", label: "minimal" },
  { value: "low", label: "low" },
  { value: "medium", label: "medium" },
  { value: "high", label: "high" },
] as const satisfies ReadonlyArray<{ value: ThinkingLevel; label: string }>;

export type UseAiChatControllerResult = {
  aiProvider: string;
  applyFeedback: FeedbackMessage;
  applyLastAssistantJson: () => Promise<void>;
  canApplyLastAssistantJson: boolean;
  canRestoreHistory: boolean;
  canSaveHistory: boolean;
  canSendMessage: boolean;
  copySavedHistoryKey: () => Promise<void>;
  draftSystemPrompt: string;
  displayedMessages: ChatMessage[];
  hasMessages: boolean;
  historyIdToRestore: string;
  historyPopoverOpen: boolean;
  input: string;
  isChatOpen: boolean;
  isHistoryIdValid: boolean;
  isLoading: boolean;
  isRestoringHistory: boolean;
  isSavingHistory: boolean;
  lastAssistantJson: null | string;
  loadingLabel: string;
  openSystemPromptDialog: () => void;
  parsedError: null | string;
  restoreHistory: () => Promise<void>;
  retry: () => Promise<void>;
  resetSystemPromptToDefault: () => void;
  saveHistory: () => Promise<void>;
  saveSystemPrompt: () => void;
  savedHistoryKey: null | string;
  setDraftSystemPrompt: (value: string) => void;
  setHistoryIdToRestore: (value: string) => void;
  setHistoryPopoverOpen: (open: boolean) => void;
  setInput: (value: string) => void;
  setIsChatOpen: (open: boolean) => void;
  setSystemPromptDialogOpen: (open: boolean) => void;
  setThinkingLevel: (next: ThinkingLevel) => void;
  stopGeneration: () => void;
  submitMessage: (event: FormEvent<HTMLFormElement>) => void;
  systemPromptDialogOpen: boolean;
  thinkingLevel: ThinkingLevel;
  uiMessage: FeedbackMessage;
};

export const useAiChatController = (): UseAiChatControllerResult => {
  const [isChatOpen, setIsChatOpen] = useAtom(isChatOpenAtom);
  const [aiProvider] = useAtom(aiProviderAtom);
  const [thinkingLevel, setThinkingLevelAtom] = useAtom(thinkingLevelAtom);
  const [systemPromptDialogOpen, setSystemPromptDialogOpen] = useState(false);
  const [historyPopoverOpen, setHistoryPopoverOpen] = useState(false);
  const [input, setInput] = useState("");
  const [savedHistoryKey, setSavedHistoryKey] = useState<null | string>(null);
  const [historyIdToRestore, setHistoryIdToRestore] = useState("");
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [isRestoringHistory, setIsRestoringHistory] = useState(false);
  const [uiMessage, setUiMessage] = useState<FeedbackMessage>(null);
  const [applyFeedback, setApplyFeedback] = useState<FeedbackMessage>(null);
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

  const setThinkingLevel = (next: ThinkingLevel) => {
    setThinkingLevelAtom(next);
    setSavedHistoryKey(null);
  };

  const openSystemPromptDialog = () => {
    setDraftSystemPrompt(systemPrompt);
    setSystemPromptDialogOpen(true);
  };

  const saveSystemPrompt = () => {
    setSystemPrompt(draftSystemPrompt);
    setSystemPromptDialogOpen(false);
    setSavedHistoryKey(null);
  };

  const resetSystemPromptToDefault = () => {
    setDraftSystemPrompt(DEFAULT_SYSTEM_PROMPT);
  };

  const copySavedHistoryKey = async () => {
    if (savedHistoryKey == null) return;
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
  };

  const applyLastAssistantJson = async () => {
    if (lastAssistantJson == null) return;
    if (window.importState == null) {
      setApplyFeedback({
        kind: "error",
        text: "importState が利用できません",
      });
      return;
    }

    const applied = await window.importState(lastAssistantJson);
    if (applied) {
      setSavedHistoryKey(null);
      setApplyFeedback({
        kind: "success",
        text: "データを適用しました",
      });
      return;
    }

    setApplyFeedback({
      kind: "error",
      text: "データの適用に失敗しました",
    });
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
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
  };

  const saveHistory = async () => {
    if (isSavingHistory || nonSystemMessages.length === 0) return;
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
  };

  const restoreHistory = async () => {
    if (!isHistoryIdValid || isRestoringHistory) return;
    setIsRestoringHistory(true);
    try {
      const restored = await restoreChatHistory(historyIdToRestore.trim());
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
  };

  const retry = async () => {
    await regenerate();
  };

  return {
    aiProvider,
    applyFeedback,
    applyLastAssistantJson,
    canApplyLastAssistantJson: lastAssistantJson != null && !isLoading,
    canRestoreHistory: isHistoryIdValid && !isRestoringHistory,
    canSaveHistory: !isSavingHistory && nonSystemMessages.length > 0,
    canSendMessage: input.trim().length > 0 && !isLoading,
    copySavedHistoryKey,
    displayedMessages,
    draftSystemPrompt,
    hasMessages,
    historyIdToRestore,
    historyPopoverOpen,
    input,
    isChatOpen,
    isHistoryIdValid,
    isLoading,
    isRestoringHistory,
    isSavingHistory,
    lastAssistantJson,
    loadingLabel,
    openSystemPromptDialog,
    parsedError,
    resetSystemPromptToDefault,
    restoreHistory,
    retry,
    saveHistory,
    savedHistoryKey,
    saveSystemPrompt,
    setDraftSystemPrompt,
    setHistoryIdToRestore,
    setHistoryPopoverOpen,
    setInput,
    setIsChatOpen,
    setSystemPromptDialogOpen,
    setThinkingLevel,
    stopGeneration: stop,
    submitMessage,
    systemPromptDialogOpen,
    thinkingLevel,
    uiMessage,
  };
};
