import { getDefaultStore } from "jotai";
import { z } from "zod";

import {
  calculationModeSchema,
  cardSchema,
  deckStateSchema,
  disruptionCategorySchema,
  disruptionCardSchema,
  labelSchema,
  opponentDisruptionCardSchema,
  patternSchema,
  potStateSchema,
  subPatternSchema,
  vsSimulationInputSchema,
} from "../../../shared/apiSchemas";
import type { VsSimulationInput } from "../../../shared/apiSchemas";
import {
  runCalculateAtom,
  markSavedSnapshotAtom,
} from "./effects/atoms";
import {
  cardsAtom,
  deckAtom,
  deckNameAtom,
  disruptionCategoriesAtom,
  disruptionCardsAtom,
  labelsAtom,
  modeAtom,
  patternsAtom,
  potAtom,
  simulationTrialsAtom,
  subPatternsAtom,
  vsAtom,
} from "./input/atoms";

const defaultVsState: VsSimulationInput = {
  enabled: false,
  opponentDeckSize: 40,
  opponentHandSize: 5,
  opponentDisruptions: [],
};

const defaultMode = "exact" as const;
const defaultSimulationTrials = 10000;

const draftCardSchema = cardSchema.extend({
  name: z.string(),
});
const draftPatternSchema = patternSchema.extend({
  name: z.string(),
});
const draftSubPatternSchema = subPatternSchema.extend({
  name: z.string(),
});
const draftLabelSchema = labelSchema.extend({
  name: z.string(),
});
const draftDisruptionCategorySchema = disruptionCategorySchema.extend({
  name: z.string(),
});
const draftDisruptionCardSchema = disruptionCardSchema.extend({
  name: z.string(),
});
const draftOpponentDisruptionSchema = opponentDisruptionCardSchema.extend({
  name: z.string(),
});
const draftVsSchema = vsSimulationInputSchema.extend({
  opponentDisruptions: z.array(draftOpponentDisruptionSchema),
});

const exportedStateSchema = z.object({
  version: z.literal(1).optional(),
  deckName: z.string().optional(),
  deck: deckStateSchema,
  cards: z.array(draftCardSchema),
  patterns: z.array(draftPatternSchema),
  subPatterns: z.array(draftSubPatternSchema),
  labels: z.array(draftLabelSchema),
  disruptionCategories: z.array(draftDisruptionCategorySchema).optional(),
  disruptionCards: z.array(draftDisruptionCardSchema),
  pot: potStateSchema,
  vs: draftVsSchema.optional(),
  mode: calculationModeSchema.optional(),
  simulationTrials: z.number().int().optional(),
});

const legacyExportedStateSchema = z.object({
  version: z.literal(0).optional(),
  deckName: z.string().optional(),
  input: z.object({
    deck: deckStateSchema,
    cards: z.array(draftCardSchema),
    patterns: z.array(draftPatternSchema),
    subPatterns: z.array(draftSubPatternSchema),
    labels: z.array(draftLabelSchema),
    disruptionCategories: z.array(draftDisruptionCategorySchema).optional(),
    pot: potStateSchema,
    vs: draftVsSchema.optional(),
    settings: z.object({
      mode: calculationModeSchema,
      simulationTrials: z.number().int(),
    }),
  }),
});

type ExportedState = z.infer<typeof exportedStateSchema>;

const normalizeImportedState = (raw: unknown): ExportedState | null => {
  const latest = exportedStateSchema.safeParse(raw);
  if (latest.success) {
    return {
      ...latest.data,
      disruptionCategories: latest.data.disruptionCategories ?? [],
      mode: latest.data.mode ?? defaultMode,
      simulationTrials:
        latest.data.simulationTrials ?? defaultSimulationTrials,
      vs: latest.data.vs ?? defaultVsState,
    };
  }

  const legacy = legacyExportedStateSchema.safeParse(raw);
  if (!legacy.success) return null;

  return {
    version: 1,
    deckName: legacy.data.deckName ?? "",
    deck: legacy.data.input.deck,
    cards: legacy.data.input.cards,
    patterns: legacy.data.input.patterns,
    subPatterns: legacy.data.input.subPatterns,
    labels: legacy.data.input.labels,
    disruptionCategories: legacy.data.input.disruptionCategories ?? [],
    disruptionCards: [],
    pot: legacy.data.input.pot,
    vs: legacy.data.input.vs ?? defaultVsState,
    mode: legacy.data.input.settings.mode,
    simulationTrials: legacy.data.input.settings.simulationTrials,
  };
};

const parseImportPayload = (payload: string | unknown): unknown => {
  if (typeof payload !== "string") return payload;
  return JSON.parse(payload);
};

export const installWindowStateBridge = () => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const store = getDefaultStore();

  window.exportState = () => {
    const snapshot: ExportedState = {
      version: 1,
      deckName: store.get(deckNameAtom),
      deck: store.get(deckAtom),
      cards: store.get(cardsAtom),
      patterns: store.get(patternsAtom),
      subPatterns: store.get(subPatternsAtom),
      labels: store.get(labelsAtom),
      disruptionCategories: store.get(disruptionCategoriesAtom),
      disruptionCards: store.get(disruptionCardsAtom),
      pot: store.get(potAtom),
      vs: store.get(vsAtom),
      mode: store.get(modeAtom),
      simulationTrials: store.get(simulationTrialsAtom),
    };

    return JSON.stringify(snapshot, null, 2);
  };

  window.importState = async (payload) => {
    try {
      const parsedPayload = parseImportPayload(payload);
      const normalized = normalizeImportedState(parsedPayload);
      if (normalized == null) {
        console.error("importState: 入力JSONの形式が不正です。");
        return false;
      }

      store.set(deckAtom, normalized.deck);
      store.set(cardsAtom, normalized.cards);
      store.set(patternsAtom, normalized.patterns);
      store.set(subPatternsAtom, normalized.subPatterns);
      store.set(labelsAtom, normalized.labels);
      store.set(disruptionCategoriesAtom, normalized.disruptionCategories ?? []);
      store.set(disruptionCardsAtom, normalized.disruptionCards);
      store.set(potAtom, normalized.pot);
      store.set(vsAtom, normalized.vs ?? defaultVsState);
      store.set(modeAtom, normalized.mode ?? defaultMode);
      store.set(
        simulationTrialsAtom,
        normalized.simulationTrials ?? defaultSimulationTrials,
      );
      store.set(deckNameAtom, normalized.deckName ?? "");

      store.set(markSavedSnapshotAtom);
      await store.set(runCalculateAtom);
      return true;
    } catch (error) {
      console.error("importState: JSON読み込みに失敗しました。", error);
      return false;
    }
  };

  return () => {
    delete window.exportState;
    delete window.importState;
  };
};
