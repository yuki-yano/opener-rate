import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";

import {
  Input,
  RadioCardGroup,
  Select,
  type RadioCardOption,
  type SelectOption,
} from "../../../../components/ui";
import {
  deckAtom,
  deckNameAtom,
  modeAtom,
  modeAutoSwitchedByVsAtom,
  potAtom,
  simulationTrialsAtom,
  vsAtom,
} from "../../state";
import { SectionCard } from "../layout/section-card";

const toInt = (value: string, fallback: number) => {
  const next = Number.parseInt(value, 10);
  if (Number.isNaN(next)) return fallback;
  return next;
};

const prosperityCostOptions: SelectOption[] = [
  { value: "3", label: "3" },
  { value: "6", label: "6" },
];

const calculationModeOptions: readonly RadioCardOption<
  "exact" | "simulation"
>[] = [
  { value: "exact", label: "厳密計算" },
  { value: "simulation", label: "シミュレーション" },
] as const;

export const DeckEditor = () => {
  const [deck, setDeck] = useAtom(deckAtom);
  const [deckName, setDeckName] = useAtom(deckNameAtom);
  const [pot, setPot] = useAtom(potAtom);
  const [mode, setMode] = useAtom(modeAtom);
  const [simulationTrials, setSimulationTrials] = useAtom(simulationTrialsAtom);
  const [modeAutoSwitchedByVs, setModeAutoSwitchedByVs] = useAtom(
    modeAutoSwitchedByVsAtom,
  );
  const vs = useAtomValue(vsAtom);

  useEffect(() => {
    if (vs.enabled && mode === "exact") {
      setMode("simulation");
      setModeAutoSwitchedByVs(true);
      return;
    }
    if (!vs.enabled && modeAutoSwitchedByVs) {
      setMode("exact");
      setModeAutoSwitchedByVs(false);
    }
  }, [
    mode,
    modeAutoSwitchedByVs,
    setMode,
    setModeAutoSwitchedByVs,
    vs.enabled,
  ]);

  return (
    <SectionCard
      title="デッキ設定"
      description="デッキ枚数、初手枚数、計算モードを設定します。"
    >
      <label className="space-y-1.5 text-xs text-ui-subtext0">
        デッキ名（OGP）
        <Input
          value={deckName}
          placeholder="デッキ名を入力"
          onChange={(event) => setDeckName(event.target.value)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs text-ui-subtext0">
          デッキ枚数
          <Input
            type="number"
            min={1}
            max={120}
            value={deck.cardCount}
            onChange={(event) =>
              setDeck((current) => ({
                ...current,
                cardCount: toInt(event.target.value, current.cardCount),
              }))
            }
          />
        </label>
        <label className="space-y-1.5 text-xs text-ui-subtext0">
          初手枚数
          <Input
            type="number"
            min={1}
            max={20}
            value={deck.firstHand}
            onChange={(event) =>
              setDeck((current) => ({
                ...current,
                firstHand: toInt(event.target.value, current.firstHand),
              }))
            }
          />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-ui-subtext0">壺設定</p>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <label className="space-y-1.5 text-xs text-ui-subtext0">
            金満で謙虚な壺 枚数
            <Input
              type="number"
              min={0}
              max={3}
              value={pot.prosperity.count}
              onChange={(event) =>
                setPot((current) => ({
                  ...current,
                  prosperity: {
                    ...current.prosperity,
                    count: Math.max(
                      0,
                      Math.min(
                        3,
                        toInt(event.target.value, current.prosperity.count),
                      ),
                    ),
                  },
                }))
              }
            />
          </label>

          <label className="space-y-1.5 text-xs text-ui-subtext0">
            除外コスト
            <Select
              ariaLabel="除外コスト"
              value={String(pot.prosperity.cost)}
              options={prosperityCostOptions}
              onChange={(event) =>
                setPot((current) => ({
                  ...current,
                  prosperity: {
                    ...current.prosperity,
                    cost: event === "3" ? 3 : 6,
                  },
                }))
              }
            />
          </label>
        </div>

        <label className="space-y-1.5 text-xs text-ui-subtext0">
          強欲で貪欲な壺 / 強欲で金満な壺 枚数
          <Input
            type="number"
            min={0}
            max={3}
            value={pot.desiresOrExtravagance.count}
            onChange={(event) =>
              setPot((current) => ({
                ...current,
                desiresOrExtravagance: {
                  count: Math.max(
                    0,
                    Math.min(
                      3,
                      toInt(
                        event.target.value,
                        current.desiresOrExtravagance.count,
                      ),
                    ),
                  ),
                },
              }))
            }
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs text-ui-subtext0">
          計算モード
          <RadioCardGroup
            name="calculation-mode"
            value={mode}
            options={calculationModeOptions.map((option) => ({
              ...option,
              disabled: vs.enabled && option.value === "exact",
            }))}
            onChange={(next) => {
              setMode(next);
              if (!vs.enabled) {
                setModeAutoSwitchedByVs(false);
              }
            }}
          />
          {modeAutoSwitchedByVs && vs.enabled ? (
            <p className="text-[11px] text-ui-overlay1">
              対戦シミュレーションが有効なため、計算モードをシミュレーションへ自動変更しています。無効化すると厳密計算へ戻ります。
            </p>
          ) : null}
        </label>
        <label className="space-y-1.5 text-xs text-ui-subtext0">
          試行回数
          <Input
            type="number"
            min={100}
            max={2000000}
            disabled={mode !== "simulation"}
            value={simulationTrials}
            onChange={(event) =>
              setSimulationTrials(
                Math.min(
                  2000000,
                  Math.max(100, toInt(event.target.value, simulationTrials)),
                ),
              )
            }
          />
        </label>
      </div>
    </SectionCard>
  );
};
