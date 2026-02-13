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
  const duplicatedDisruptionCardUidSet = useMemo(() => {
    const countByUid = new Map<string, number>();
    for (const disruption of vs.opponentDisruptions) {
      const disruptionCardUid = disruption.disruptionCardUid;
      if (disruptionCardUid == null) continue;
      const current = countByUid.get(disruptionCardUid) ?? 0;
      countByUid.set(disruptionCardUid, current + 1);
    }
    return new Set(
      Array.from(countByUid.entries())
        .filter(([, count]) => count > 1)
        .map(([uid]) => uid),
    );
  }, [vs.opponentDisruptions]);

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
      handleClassName="top-[2rem] -translate-y-1/2"
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
        const hasDuplicateCardSelection =
          disruption.disruptionCardUid != null &&
          duplicatedDisruptionCardUidSet.has(disruption.disruptionCardUid);

        return (
          <EditorListItem>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_3.5rem_2rem] items-center gap-2">
              <Select
                ariaLabel="妨害カード選択"
                className="min-w-0"
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
              <NumericInput
                aria-label="枚数"
                className="sm:w-full"
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 self-center justify-self-end"
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
            </div>

            {isNameEmpty || hasDuplicateCardSelection ? (
              <div className={`space-y-1 ${editorErrorTextClassName}`}>
                {isNameEmpty ? <p>妨害札名は必須です。</p> : null}
                {hasDuplicateCardSelection ? (
                  <p>
                    同じ妨害カードを複数行で登録できません。枚数を1行にまとめてください。
                  </p>
                ) : null}
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
