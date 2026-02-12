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
const redirectSourceShortUrlStorageKey = "openerRate.redirectSourceShortUrl";
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

const consumeRedirectSourceShortUrl = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(redirectSourceShortUrlStorageKey);
    if (raw == null) return null;
    window.sessionStorage.removeItem(redirectSourceShortUrlStorageKey);

    const url = raw.trim();
    return url.length > 0 ? url : null;
  } catch {
    return null;
  }
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
    const redirectSourceShortUrl = consumeRedirectSourceShortUrl();
    if (redirectSourceShortUrl != null) {
      seedSharedUrlAsGenerated(redirectSourceShortUrl);
    }
    if (!hasUrlState()) return;

    const currentUrl = window.location.href;
    if (autoCalculatedUrls.has(currentUrl)) return;
    autoCalculatedUrls.add(currentUrl);
    void runCalculate();
  }, [runCalculate, seedSharedUrlAsGenerated]);

  useEffect(() => {
    return installWindowStateBridge();
  }, []);

  return (
    <div className="relative min-h-[100svh] bg-ui-base text-ui-text md:min-h-screen">
      <div className="relative z-10">
        <header className="border-b border-ui-surface0/90 bg-ui-base">
          <div className="mx-auto w-full max-w-7xl px-4 py-4">
            <h1 className="text-3xl font-bold tracking-tight text-ui-text">
              <a
                href="/"
                className="transition-colors hover:text-ui-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-blue/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ui-base"
              >
                初動率計算機
              </a>
            </h1>
          </div>
        </header>
        <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-10 pt-4">
          <section className="space-y-4">
            <div className="w-full">
              <ShortUrlCard className="w-full lg:max-w-[30rem]" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)_minmax(0,1fr)]">
              <DeckEditor />
              <OverallRateCard />
              <LabelRateTable />
            </div>
          </section>

          <section className="space-y-4">
            <CardListEditor />
            <LabelEditor />
            <PatternEditor />
            <DisruptionCardEditor />
            <SubPatternEditor />
            <VsSimulationEditor />
          </section>
        </main>
      </div>
    </div>
  );
};
