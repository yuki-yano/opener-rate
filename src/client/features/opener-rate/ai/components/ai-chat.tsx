import { MessageSquare } from "lucide-react";

import { Button } from "../../../../components/ui";
import { cn } from "../../../../lib/cn";
import { AiChatPanel } from "./ai-chat-panel";
import { SystemPromptDialog } from "./system-prompt-dialog";
import { useAiChatController } from "./use-ai-chat-controller";

type AiChatProps = {
  enabled: boolean;
};

export const AiChat = ({ enabled }: AiChatProps) => {
  const controller = useAiChatController();

  if (!enabled) return null;

  return (
    <>
      {!controller.isChatOpen ? (
        <Button
          type="button"
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full border border-ui-primary2/65",
            "bg-ui-primary2 text-white",
            "shadow-[0_18px_44px_-20px_rgba(var(--theme-primary2),0.78)]",
            "hover:bg-ui-primary",
          )}
          onClick={() => controller.setIsChatOpen(true)}
          aria-label="チャットを開く"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : null}

      {controller.isChatOpen ? <AiChatPanel controller={controller} /> : null}

      <SystemPromptDialog
        open={controller.systemPromptDialogOpen}
        draftPrompt={controller.draftSystemPrompt}
        onDraftPromptChange={controller.setDraftSystemPrompt}
        onOpenChange={controller.setSystemPromptDialogOpen}
        onResetToDefault={controller.resetSystemPromptToDefault}
        onSave={controller.saveSystemPrompt}
      />
    </>
  );
};
