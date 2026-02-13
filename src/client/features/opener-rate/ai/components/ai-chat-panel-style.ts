import { uiDangerNoticeClassName } from "../../../../components/ui/notice-style";

type AiFeedbackKind = "error" | "success";

export const aiHeaderIconButtonClassName =
  "h-8 w-8 rounded-full border border-transparent bg-ui-layer1/70 text-ui-text2 hover:border-ui-border1 hover:bg-ui-layer1";

export const aiDangerNoticeClassName = uiDangerNoticeClassName;

export const aiPrimaryActionButtonClassName =
  "border border-ui-primary2/70 bg-ui-primary2 text-white hover:bg-ui-primary";

export const aiChatLauncherButtonClassName =
  "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full border border-ui-primary2/65 bg-ui-primary2 text-white shadow-[0_18px_44px_-20px_rgba(var(--theme-primary2),0.78)] hover:bg-ui-primary";

export const aiScrollToBottomButtonClassName =
  "absolute bottom-4 right-4 z-20 h-10 w-10 rounded-full border border-ui-primary2/60 bg-ui-primary2 text-white shadow-panel hover:bg-ui-primary";

export const aiSystemPromptSaveButtonClassName =
  "border border-ui-primary bg-ui-primary text-white shadow-[0_12px_24px_-16px_rgba(var(--theme-primary),0.95)] hover:bg-ui-primary2";

export const resolveAiReadinessBadgeClassName = (isLoading: boolean) =>
  isLoading
    ? "border-ui-green/30 bg-ui-green/10 text-ui-green"
    : "border-ui-border2 bg-ui-bg text-ui-text2";

export const resolveAiApplyFeedbackClassName = (kind: AiFeedbackKind) =>
  kind === "success"
    ? "border border-ui-primary2/35 bg-ui-primary2/10 text-ui-primary"
    : "border border-ui-red/40 bg-ui-red/12 text-ui-red";

export const resolveAiUiMessageClassName = (kind: AiFeedbackKind) =>
  kind === "success"
    ? "border border-ui-primary2/40 bg-ui-primary2/12 text-ui-primary"
    : "border border-ui-red/40 bg-ui-red/12 text-ui-red";
