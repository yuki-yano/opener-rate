import { Plus, Trash2 } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { useMemo } from "react";

import { Button, Checkbox, Input, Select } from "../../../../components/ui";
import {
  disruptionCardsAtom,
  disruptionCategoriesAtom,
  vsAtom,
} from "../../state";
import { SortableList } from "../common/sortable-list";
import { SectionCard } from "../layout/section-card";
import { createLocalId } from "./create-local-id";

const toInt = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const createDefaultDisruptionName = (index: number) => `妨害札${index + 1}`;

export const VsSimulationEditor = () => {
  const [vs, setVs] = useAtom(vsAtom);
  const disruptionCards = useAtomValue(disruptionCardsAtom);
  const disruptionCategories = useAtomValue(disruptionCategoriesAtom);
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
    <SectionCard
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
    >
      <div className="rounded-md border border-ui-surface0/80 bg-ui-mantle px-3 py-2.5 text-xs text-ui-subtext0">
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
        <label className="space-y-1.5 text-xs text-ui-subtext0">
          相手デッキ枚数
          <Input
            type="number"
            min={1}
            max={120}
            value={vs.opponentDeckSize}
            onChange={(event) =>
              setVs((current) => ({
                ...current,
                opponentDeckSize: Math.min(
                  120,
                  Math.max(
                    1,
                    toInt(event.target.value, current.opponentDeckSize),
                  ),
                ),
              }))
            }
          />
        </label>
        <label className="space-y-1.5 text-xs text-ui-subtext0">
          相手初手枚数
          <Input
            type="number"
            min={1}
            max={20}
            value={vs.opponentHandSize}
            onChange={(event) =>
              setVs((current) => ({
                ...current,
                opponentHandSize: Math.min(
                  20,
                  Math.max(
                    1,
                    toInt(event.target.value, current.opponentHandSize),
                  ),
                ),
              }))
            }
          />
        </label>
      </div>

      {vs.opponentDisruptions.length === 0 ? (
        <p className="rounded-md border border-dashed border-ui-surface0/80 bg-ui-crust/45 px-3 py-4 text-xs text-ui-subtext0">
          妨害札がありません。「妨害札追加」から作成してください。
        </p>
      ) : null}
      {disruptionCards.length === 0 ? (
        <p className="rounded-md border border-dashed border-ui-surface0/80 bg-ui-crust/45 px-3 py-3 text-xs text-ui-subtext0">
          妨害カード一覧が空です。先に妨害カードを登録してください。
        </p>
      ) : null}

      <SortableList
        layout="grid"
        items={vs.opponentDisruptions}
        onReorder={(next) =>
          setVs((current) => ({
            ...current,
            opponentDisruptions: next,
          }))
        }
        handleClassName="top-1/2 -translate-y-1/2"
        renderItem={(disruption) => {
          const linkedCard =
            disruption.disruptionCardUid == null
              ? undefined
              : disruptionCardByUid.get(disruption.disruptionCardUid);
          const resolvedName = linkedCard?.name ?? disruption.name;
          const isNameEmpty = resolvedName.trim().length === 0;

          return (
            <div className="space-y-2 rounded-md border border-ui-surface0/80 bg-ui-mantle py-3 pl-9 pr-3">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:items-end">
                <div className="space-y-1 text-[11px] text-ui-subtext0">
                  <p>妨害カード</p>
                  <Select
                    ariaLabel="妨害カード選択"
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
                              disruptionCategoryUid:
                                selected.disruptionCategoryUid,
                            };
                          },
                        ),
                      }))
                    }
                  />
                </div>
                <label className="space-y-1 text-[11px] text-ui-subtext0">
                  枚数
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    value={disruption.count}
                    onChange={(event) =>
                      setVs((current) => ({
                        ...current,
                        opponentDisruptions: current.opponentDisruptions.map(
                          (target) =>
                            target.uid === disruption.uid
                              ? {
                                  ...target,
                                  count: Math.min(
                                    60,
                                    Math.max(
                                      0,
                                      toInt(event.target.value, target.count),
                                    ),
                                  ),
                                }
                              : target,
                        ),
                      }))
                    }
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
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

              {isNameEmpty ? (
                <div className="space-y-1 text-xs text-ui-red">
                  {isNameEmpty ? <p>妨害札名は必須です。</p> : null}
                </div>
              ) : null}
              {disruption.disruptionCategoryUid != null ? (
                <p className="text-[11px] text-ui-subtext0">
                  カテゴリ:{" "}
                  {disruptionCategoryByUid.get(disruption.disruptionCategoryUid)
                    ?.name ?? "未設定"}
                </p>
              ) : null}
            </div>
          );
        }}
      />
    </SectionCard>
  );
};
