import { describe, expect, it } from "vitest";

import {
  aiDangerNoticeClassName,
  aiPrimaryActionButtonClassName,
  resolveAiApplyFeedbackClassName,
  resolveAiReadinessBadgeClassName,
  resolveAiUiMessageClassName,
} from "./ai-chat-panel-style";

describe("ai-chat-panel-style", () => {
  it("loading中はthinking向けバッジクラスを返す", () => {
    const className = resolveAiReadinessBadgeClassName(true);
    expect(className).toContain("border-ui-green/30");
    expect(className).toContain("bg-ui-green/10");
    expect(className).toContain("text-ui-green");
  });

  it("idle時はready向けバッジクラスを返す", () => {
    const className = resolveAiReadinessBadgeClassName(false);
    expect(className).toContain("border-ui-border2");
    expect(className).toContain("bg-ui-bg");
    expect(className).toContain("text-ui-text2");
  });

  it("適用結果の成功/失敗でクラスを切り替える", () => {
    const successClassName = resolveAiApplyFeedbackClassName("success");
    const errorClassName = resolveAiApplyFeedbackClassName("error");

    expect(successClassName).toContain("border-ui-primary2/35");
    expect(successClassName).toContain("bg-ui-primary2/10");
    expect(successClassName).toContain("text-ui-primary");

    expect(errorClassName).toContain("border-ui-red/40");
    expect(errorClassName).toContain("bg-ui-red/12");
    expect(errorClassName).toContain("text-ui-red");
  });

  it("UI通知の成功/失敗でクラスを切り替える", () => {
    const successClassName = resolveAiUiMessageClassName("success");
    const errorClassName = resolveAiUiMessageClassName("error");

    expect(successClassName).toContain("border-ui-primary2/40");
    expect(successClassName).toContain("bg-ui-primary2/12");
    expect(successClassName).toContain("text-ui-primary");

    expect(errorClassName).toContain("border-ui-red/40");
    expect(errorClassName).toContain("bg-ui-red/12");
    expect(errorClassName).toContain("text-ui-red");
  });

  it("共通アクション/エラー表示クラスを公開する", () => {
    expect(aiPrimaryActionButtonClassName).toContain("border-ui-primary2/70");
    expect(aiPrimaryActionButtonClassName).toContain("hover:bg-ui-primary");

    expect(aiDangerNoticeClassName).toContain("border-ui-red/40");
    expect(aiDangerNoticeClassName).toContain("text-ui-red");
  });
});
