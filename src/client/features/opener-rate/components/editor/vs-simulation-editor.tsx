import { Plus, Trash2 } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { useMemo } from "react";

import { Button, Checkbox, Select } from "../../../../components/ui";
import {
  disruptionCardsAtom,
  disruptionCategoriesAtom,
  vsAtom,
} from "../../state";
import { createLocalId } from "./create-local-id";
import {
  EditorEmptyState,
  editorErrorTextClassName,
  editorFieldLabelClassName,
  EditorListItem,
} from "./editor-ui";
import { NumericInput } from "./numeric-input";
import { SortableEditorSection } from "./sortable-editor-section";

const createDefaultDisruptionName = (index: number) => `妨害札${index + 1}`;

export const VsSimulationEditor = () => {
  const [vs, setVs] = useAtom(vsAtom);
  const disruptionCards = useAtomValue(disruptionCardsAtom);
  const disruptionCategories = useAtomValue(disruptionCategoriesAtom);
  const isDisruptionCardListEmpty = disruptionCards.length === 0;
  const hasNoOpponentDisruptions = vs.opponentDisruptions.length === 0;
  const disruptionCardByUid = useMemo(
    () => new Map(disruptionCards.map((card) => [card.uid, card] as const)),
    [disruptionCards],
  );
  const disruptionCategoryByUid = useMemo(
    () =>
      new Map(
        disruptionCategories.map(
          (category) => [category.uid, category] as const,
        ),
      ),
    [disruptionCategories],
  );

  const handleAddDisruption = () => {
    const firstCard = disruptionCards[0];
    setVs((current) => ({
      ...current,
      opponentDisruptions: [
        ...current.opponentDisruptions,
        {
          uid: createLocalId("disruption"),
          disruptionCardUid: firstCard?.uid,
          name:
            firstCard?.name ??
            createDefaultDisruptionName(current.opponentDisruptions.length),
          count: 1,
          oncePerName: firstCard?.oncePerName ?? true,
          disruptionCategoryUid: firstCard?.disruptionCategoryUid,
        },
      ],
    }));
  };

  return (
    <SortableEditorSection
      title="対戦シミュレーション"
      description="相手妨害を加味した成功率を計算します。"
      floatingActions={
        <Button
          size="icon"
          variant="outline"
          onClick={handleAddDisruption}
          aria-label="妨害札追加"
          title="妨害札追加"
        >
          <Plus className="h-4 w-4" />
        </Button>
      }
      items={vs.opponentDisruptions}
      onReorder={(next) =>
        setVs((current) => ({
          ...current,
          opponentDisruptions: next,
        }))
      }
      layout="grid"
      handleClassName="top-1/2 -translate-y-1/2"
      beforeList={
        <>
          <div className="rounded-md border border-ui-border1/80 bg-ui-layer1 px-3 py-2.5 text-xs text-ui-text3">
            <p>入力ガイド</p>
            <p className="mt-1">枚数: 相手デッキに入っているその妨害札の枚数</p>
            <p>
              妨害カードは「妨害カード一覧」で登録し、ここでは枚数だけ指定します。
            </p>
          </div>

          <Checkbox
            checked={vs.enabled}
            onChange={(event) =>
              setVs((current) => ({
                ...current,
                enabled: event.target.checked,
              }))
            }
            label="対戦シミュレーションを有効化"
            className="h-10 px-3 text-sm"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={editorFieldLabelClassName}>
              相手デッキ枚数
              <NumericInput
                className="sm:w-full"
                value={vs.opponentDeckSize}
                min={1}
                max={120}
                onValueChange={(nextValue) =>
                  setVs((current) => ({
                    ...current,
                    opponentDeckSize: nextValue,
                  }))
                }
              />
            </label>
            <label className={editorFieldLabelClassName}>
              相手初手枚数
              <NumericInput
                className="sm:w-full"
                value={vs.opponentHandSize}
                min={1}
                max={20}
                onValueChange={(nextValue) =>
                  setVs((current) => ({
                    ...current,
                    opponentHandSize: nextValue,
                  }))
                }
              />
            </label>
          </div>

          {isDisruptionCardListEmpty ? (
            <EditorEmptyState className="py-3">
              妨害カード一覧が空です。先に妨害カードを登録してください。
            </EditorEmptyState>
          ) : null}
        </>
      }
      emptyState={
        hasNoOpponentDisruptions && !isDisruptionCardListEmpty ? (
          <EditorEmptyState>
            妨害札がありません。「妨害札追加」から作成してください。
          </EditorEmptyState>
        ) : null
      }
      renderItem={(disruption) => {
        const linkedCard =
          disruption.disruptionCardUid == null
            ? undefined
            : disruptionCardByUid.get(disruption.disruptionCardUid);
        const resolvedName = linkedCard?.name ?? disruption.name;
        const isNameEmpty = resolvedName.trim().length === 0;

        return (
          <EditorListItem>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] gap-x-2 gap-y-1.5 sm:grid-cols-[3.5rem_minmax(0,1fr)_2rem] sm:gap-y-1 sm:items-end">
              <span className="col-start-1 row-start-1 text-[11px] text-ui-text3 sm:col-start-1 sm:row-start-1">
                枚数
              </span>
              <div className="col-start-1 row-start-2 min-w-0 sm:col-start-1 sm:row-start-2">
                <NumericInput
                  value={disruption.count}
                  min={0}
                  max={60}
                  onValueChange={(nextValue) =>
                    setVs((current) => ({
                      ...current,
                      opponentDisruptions: current.opponentDisruptions.map(
                        (target) =>
                          target.uid === disruption.uid
                            ? {
                                ...target,
                                count: nextValue,
                              }
                            : target,
                      ),
                    }))
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="col-start-2 row-start-2 h-8 w-8 self-center justify-self-end sm:col-start-3 sm:row-start-2"
                aria-label="妨害札削除"
                onClick={() =>
                  setVs((current) => ({
                    ...current,
                    opponentDisruptions: current.opponentDisruptions.filter(
                      (target) => target.uid !== disruption.uid,
                    ),
                  }))
                }
              >
                <Trash2 className="h-4 w-4 text-ui-red" />
              </Button>
              <span className="col-start-1 row-start-3 text-[11px] text-ui-text3 sm:col-start-2 sm:row-start-1">
                妨害カード
              </span>
              <Select
                ariaLabel="妨害カード選択"
                className="col-start-1 row-start-4 min-w-0 sm:col-start-2 sm:row-start-2"
                value={disruption.disruptionCardUid ?? ""}
                options={disruptionCards.map((card) => ({
                  value: card.uid,
                  label: card.name,
                }))}
                onChange={(nextUid) =>
                  setVs((current) => ({
                    ...current,
                    opponentDisruptions: current.opponentDisruptions.map(
                      (target) => {
                        if (target.uid !== disruption.uid) return target;
                        const selected = disruptionCardByUid.get(nextUid);
                        if (selected == null) return target;
                        return {
                          ...target,
                          disruptionCardUid: selected.uid,
                          name: selected.name,
                          oncePerName: selected.oncePerName,
                          disruptionCategoryUid: selected.disruptionCategoryUid,
                        };
                      },
                    ),
                  }))
                }
              />
            </div>

            {isNameEmpty ? (
              <div className={`space-y-1 ${editorErrorTextClassName}`}>
                {isNameEmpty ? <p>妨害札名は必須です。</p> : null}
              </div>
            ) : null}
            {disruption.disruptionCategoryUid != null ? (
              <div className="mt-1 min-w-0">
                <span className="inline-flex min-w-0 max-w-full items-center rounded-full border border-ui-border1/70 bg-ui-layer2/70 px-2.5 py-0.5 text-xs font-medium text-ui-text2">
                  <span className="truncate">
                    {disruptionCategoryByUid.get(
                      disruption.disruptionCategoryUid,
                    )?.name ?? "未設定"}
                  </span>
                </span>
              </div>
            ) : null}
          </EditorListItem>
        );
      }}
    />
  );
};
