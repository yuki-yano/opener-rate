import { MessageSquare } from "lucide-react";

import { Button } from "../../../../components/ui";
import { AiChatPanel } from "./ai-chat-panel";
import { aiChatLauncherButtonClassName } from "./ai-chat-panel-style";
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
          className={aiChatLauncherButtonClassName}
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
