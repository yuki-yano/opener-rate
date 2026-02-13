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
  simulationTrialOptions,
  simulationTrialsAtom,
  vsAtom,
} from "../../state";
import { SectionCard } from "../layout/section-card";
import { editorFieldLabelClassName } from "./editor-ui";
import { NumericInput } from "./numeric-input";

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
const simulationTrialSelectOptions: SelectOption[] = simulationTrialOptions.map(
  (value) => ({
    value: String(value),
    label: value.toLocaleString("en-US"),
  }),
);

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
      <label className={editorFieldLabelClassName}>
        デッキ名
        <Input
          value={deckName}
          placeholder="デッキ名を入力"
          onChange={(event) => setDeckName(event.target.value)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={editorFieldLabelClassName}>
          デッキ枚数
          <NumericInput
            className="sm:w-full"
            value={deck.cardCount}
            min={1}
            max={120}
            onValueChange={(nextValue) =>
              setDeck((current) => ({
                ...current,
                cardCount: nextValue,
              }))
            }
          />
        </label>
        <label className={editorFieldLabelClassName}>
          初手枚数
          <NumericInput
            className="sm:w-full"
            value={deck.firstHand}
            min={1}
            max={20}
            onValueChange={(nextValue) =>
              setDeck((current) => ({
                ...current,
                firstHand: nextValue,
              }))
            }
          />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-ui-text3">壺設定</p>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <label className={editorFieldLabelClassName}>
            金満で謙虚な壺 枚数
            <NumericInput
              className="sm:w-full"
              value={pot.prosperity.count}
              min={0}
              max={3}
              onValueChange={(nextValue) =>
                setPot((current) => ({
                  ...current,
                  prosperity: {
                    ...current.prosperity,
                    count: nextValue,
                  },
                }))
              }
            />
          </label>

          <label className={editorFieldLabelClassName}>
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

        <label className={editorFieldLabelClassName}>
          強欲で貪欲な壺 / 強欲で金満な壺 枚数
          <NumericInput
            className="sm:w-full"
            value={pot.desiresOrExtravagance.count}
            min={0}
            max={3}
            onValueChange={(nextValue) =>
              setPot((current) => ({
                ...current,
                desiresOrExtravagance: {
                  count: nextValue,
                },
              }))
            }
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={editorFieldLabelClassName}>
          計算モード
          <RadioCardGroup
            name="calculation-mode"
            value={mode}
            className="border-0 bg-transparent p-0"
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
            <p className="text-[11px] text-ui-tone2">
              対戦シミュレーションが有効なため、計算モードをシミュレーションへ自動変更しています。無効化すると厳密計算へ戻ります。
            </p>
          ) : null}
        </label>
        <label className={editorFieldLabelClassName}>
          試行回数
          <Select
            ariaLabel="試行回数"
            disabled={mode !== "simulation"}
            value={String(simulationTrials)}
            options={simulationTrialSelectOptions}
            onChange={(nextValue) => setSimulationTrials(Number(nextValue))}
          />
        </label>
      </div>
    </SectionCard>
  );
};
