import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { ThemeToggle } from "../../../components/theme-toggle";
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
    <div className="relative min-h-[100svh] bg-latte-base text-latte-text md:min-h-screen">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="absolute left-[-8rem] top-[-6rem] h-64 w-64 rounded-full bg-latte-lavender/10 blur-2xl md:blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-10rem] h-80 w-80 rounded-full bg-latte-blue/10 blur-2xl md:blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-latte-surface1/80 bg-latte-mantle/92 md:backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0">
                <p className="text-xs tracking-widest text-latte-subtext0">
                  OPENER RATE
                </p>
                <h1 className="truncate text-lg font-semibold text-latte-text">
                  初動率シミュレーター
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-10 pt-6">
          <section className="order-1 space-y-5">
            <div className="w-full">
              <ShortUrlCard className="w-full lg:max-w-[30rem]" />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)_minmax(0,1fr)]">
              <DeckEditor />
              <OverallRateCard />
              <LabelRateTable />
            </div>
          </section>

          <section className="order-2 space-y-5">
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
