import { useEffect } from "react";
import { useSetAtom } from "jotai";

import {
  markSavedSnapshotAtom,
  runCalculateAtom,
  seedSharedUrlAsGeneratedAtom,
} from "../state";
import { installWindowStateBridge } from "../state/window-state-bridge";
import { CardListEditor } from "./editor/card-list-editor";
import { DeckEditor } from "./editor/deck-editor";
import { DisruptionCardEditor } from "./editor/disruption-card-editor";
import { LabelEditor } from "./editor/label-editor";
import { PatternEditor } from "./editor/pattern-editor";
import { SubPatternEditor } from "./editor/sub-pattern-editor";
import { VsSimulationEditor } from "./editor/vs-simulation-editor";
import { AppHeader } from "./layout/app-header";
import { AppShell } from "./layout/app-shell";
import { LabelRateTable } from "./result/label-rate-table";
import { OverallRateCard } from "./result/overall-rate-card";
import { ShortUrlCard } from "./result/short-url-card";

const urlStateKeys = [
  "deck",
  "cards",
  "pattern",
  "subPattern",
  "label",
  "disruptionCategory",
  "disruptionCard",
  "pot",
  "vs",
] as const;
const autoCalculatedUrls = new Set<string>();

const hasUrlState = () => {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (hash.trim().length === 0) return false;

  const params = new URLSearchParams(hash);
  return urlStateKeys.some((key) => {
    const value = params.get(key);
    return value != null && value.length > 0;
  });
};

export const OpenerRateScreen = () => {
  const markSavedSnapshot = useSetAtom(markSavedSnapshotAtom);
  const runCalculate = useSetAtom(runCalculateAtom);
  const seedSharedUrlAsGenerated = useSetAtom(seedSharedUrlAsGeneratedAtom);

  useEffect(() => {
    markSavedSnapshot();
  }, [markSavedSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasUrlState()) return;

    const currentUrl = window.location.href;
    seedSharedUrlAsGenerated(currentUrl);
    if (autoCalculatedUrls.has(currentUrl)) return;
    autoCalculatedUrls.add(currentUrl);
    void runCalculate();
  }, [runCalculate, seedSharedUrlAsGenerated]);

  useEffect(() => {
    return installWindowStateBridge();
  }, []);

  return (
    <AppShell
      header={<AppHeader />}
      leftColumn={
        <>
          <CardListEditor />
          <LabelEditor />
          <PatternEditor />
          <DisruptionCardEditor />
          <SubPatternEditor />
          <VsSimulationEditor />
        </>
      }
      rightColumn={
        <>
          <div className="w-full">
            <ShortUrlCard className="w-full lg:max-w-[30rem]" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)_minmax(0,1fr)]">
            <DeckEditor />
            <OverallRateCard />
            <LabelRateTable />
          </div>
        </>
      }
    />
  );
};
