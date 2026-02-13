import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AiChatPanelFooter } from "./ai-chat-panel-footer";
import type { UseAiChatControllerResult } from "./use-ai-chat-controller";

const createController = (
  overrides: Partial<UseAiChatControllerResult> = {},
): UseAiChatControllerResult =>
  ({
    applyFeedback: null,
    applyLastAssistantJson: async () => {},
    canApplyLastAssistantJson: false,
    canRestoreHistory: false,
    canSaveHistory: false,
    canSendMessage: true,
    copySavedHistoryKey: async () => {},
    historyIdToRestore: "",
    historyPopoverOpen: false,
    input: "",
    isLoading: false,
    isRestoringHistory: false,
    isSavingHistory: false,
    lastAssistantJson: null,
    resetChat: () => {},
    restoreHistory: async () => {},
    saveHistory: async () => {},
    savedHistoryKey: null,
    setHistoryIdToRestore: () => {},
    setHistoryPopoverOpen: () => {},
    setInput: () => {},
    setThinkingLevel: () => {},
    stopGeneration: () => {},
    submitMessage: () => {},
    thinkingLevel: "medium",
    uiMessage: null,
    ...overrides,
  }) as unknown as UseAiChatControllerResult;

describe("AiChatPanelFooter", () => {
  it("idle時は送信ボタンをsubmitとして表示する", () => {
    const html = renderToStaticMarkup(
      <AiChatPanelFooter
        controller={createController({
          isLoading: false,
          canSendMessage: true,
        })}
      />,
    );

    expect(html).toMatch(
      /<button[^>]*h-10 shrink-0 rounded-lg px-4[^>]*type="submit"[^>]*>/,
    );
    expect(html).toContain(">送信<");
  });

  it("送信中は送信ボタンが停止ボタンへ切り替わる", () => {
    const html = renderToStaticMarkup(
      <AiChatPanelFooter
        controller={createController({
          isLoading: true,
          canSendMessage: false,
        })}
      />,
    );

    expect(html).toMatch(
      /<button[^>]*h-10 shrink-0 rounded-lg px-4[^>]*type="button"[^>]*>/,
    );
    expect(html).toContain(">停止<");
    expect(html).not.toContain("送信中...");
  });
});
