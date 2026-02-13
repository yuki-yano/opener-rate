import { cn } from "../../../../lib/cn";

import { AiChatMessageList } from "./ai-chat-message-list";
import { AiChatPanelFooter } from "./ai-chat-panel-footer";
import { AiChatPanelHeader } from "./ai-chat-panel-header";
import type { UseAiChatControllerResult } from "./use-ai-chat-controller";

const panelRootClassName = cn(
  "fixed bottom-3 left-3 right-3 z-40 flex h-[88svh] flex-col overflow-hidden rounded-xl border md:bottom-6 md:left-auto md:right-6 md:h-[82svh] md:w-[44rem]",
  "border-ui-border2/90 bg-ui-layer1/95 backdrop-blur-sm",
  "shadow-[0_30px_70px_-34px_rgba(var(--theme-shadow),0.72)]",
);

type AiChatPanelProps = {
  controller: UseAiChatControllerResult;
};

export const AiChatPanel = ({ controller }: AiChatPanelProps) => {
  return (
    <section className={panelRootClassName}>
      <AiChatPanelHeader controller={controller} />
      <AiChatMessageList controller={controller} />
      <AiChatPanelFooter controller={controller} />
    </section>
  );
};
