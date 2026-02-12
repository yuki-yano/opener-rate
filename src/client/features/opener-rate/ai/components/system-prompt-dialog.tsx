import { RotateCcw, Save, Sparkles, X } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "../../../../components/ui";

type SystemPromptDialogProps = {
  open: boolean;
  draftPrompt: string;
  onDraftPromptChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onResetToDefault: () => void;
  onSave: () => void;
};

export const SystemPromptDialog = ({
  open,
  draftPrompt,
  onDraftPromptChange,
  onOpenChange,
  onResetToDefault,
  onSave,
}: SystemPromptDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="space-y-4 border-ui-border2 bg-[linear-gradient(165deg,rgba(var(--theme-layer1),0.98),rgba(var(--theme-layer2),0.94))]">
        <DialogHeader className="mb-0 rounded-lg border border-ui-border1/80 bg-ui-bg/75 px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base tracking-[0.03em]">
            <Sparkles className="h-4 w-4 text-ui-primary" />
            <span>システムプロンプト編集</span>
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs leading-relaxed text-ui-text2">
            AIの振る舞いを調整できます。保存後の送信から反映されます。
          </DialogDescription>
        </DialogHeader>

        <Textarea
          className="min-h-64 border-ui-border2 bg-ui-layer1/95 text-sm leading-relaxed"
          value={draftPrompt}
          onChange={(event) => onDraftPromptChange(event.target.value)}
          placeholder="システムプロンプトを入力"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            className="border-ui-yellow/55 bg-ui-yellow/10 text-ui-yellow hover:bg-ui-yellow/20"
            onClick={onResetToDefault}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            デフォルトに戻す
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-ui-border2 bg-ui-layer1 text-ui-text2 hover:bg-ui-layer2/70 hover:text-ui-text"
              onClick={() => onOpenChange(false)}
            >
              <X className="mr-1.5 h-4 w-4" />
              キャンセル
            </Button>
            <Button
              type="button"
              className="border border-ui-primary bg-ui-primary text-white shadow-[0_12px_24px_-16px_rgba(var(--theme-primary),0.95)] hover:bg-ui-primary2"
              onClick={onSave}
            >
              <Save className="mr-1.5 h-4 w-4" />
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
