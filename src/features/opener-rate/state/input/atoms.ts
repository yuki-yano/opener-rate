import { atom } from "jotai";
import { atomWithHash, atomWithLocation } from "jotai-location";
import lzstring from "lz-string";
import { z, type ZodType } from "zod";

import {
  cardSchema,
  deckStateSchema,
  labelSchema,
  patternSchema,
  potStateSchema,
} from "../../../../shared/apiSchemas";
import type {
  CalculationMode,
  Card,
  DeckState,
  Label,
  Pattern,
  PotState,
} from "../../../../shared/apiSchemas";

const defaultDeckState: DeckState = {
  cardCount: 40,
  firstHand: 5,
};

const defaultPotState: PotState = {
  desiresOrExtravagance: {
    count: 0,
  },
  prosperity: {
    count: 0,
    cost: 6,
  },
};

export const defaultSimulationTrials = 10000;

const cardsSchema = z.array(cardSchema);
const patternsSchema = z.array(patternSchema);
const labelsSchema = z.array(labelSchema);

const decodeNestedURIComponent = (value: string) => {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
};

const createHashSerializeOptions = <T>(
  defaultValue: T,
  schema: ZodType<T>,
) => ({
  delay: 0,
  deserialize: (value: string): T => {
    try {
      const decompressed = lzstring.decompressFromBase64(value);
      const raw = decompressed == null || decompressed.trim().length === 0
        ? value
        : decompressed;
      const parsed = schema.safeParse(JSON.parse(raw));
      if (!parsed.success) return defaultValue;
      return parsed.data;
    } catch {
      return defaultValue;
    }
  },
  serialize: (value: T) => lzstring.compressToBase64(JSON.stringify(value)),
});

export const deckAtom = atomWithHash<DeckState>(
  "deck",
  defaultDeckState,
  createHashSerializeOptions(defaultDeckState, deckStateSchema),
);
export const cardsAtom = atomWithHash<Card[]>(
  "cards",
  [],
  createHashSerializeOptions([], cardsSchema),
);
export const patternsAtom = atomWithHash<Pattern[]>(
  "pattern",
  [],
  createHashSerializeOptions([], patternsSchema),
);
export const labelsAtom = atomWithHash<Label[]>(
  "label",
  [],
  createHashSerializeOptions([], labelsSchema),
);
export const potAtom = atomWithHash<PotState>(
  "pot",
  defaultPotState,
  createHashSerializeOptions(defaultPotState, potStateSchema),
);

const locationAtom = atomWithLocation({ replace: true });
export const deckNameAtom = atom(
  (get) => {
    const raw = get(locationAtom).searchParams?.get("deckName");
    if (raw == null || raw.length === 0) return "";
    return decodeNestedURIComponent(raw);
  },
  (get, set, nextDeckName: string) => {
    const current = get(locationAtom);
    const currentSearchParams = current.searchParams;
    const nextSearchParams = new URLSearchParams(
      currentSearchParams?.toString() ?? "",
    );

    if (nextDeckName.trim().length === 0) {
      nextSearchParams.delete("deckName");
    } else {
      nextSearchParams.set("deckName", encodeURIComponent(nextDeckName));
    }

    if (nextSearchParams.toString() === (currentSearchParams?.toString() ?? "")) {
      return;
    }

    set(
      locationAtom,
      {
        ...current,
        searchParams: nextSearchParams,
      },
      { replace: true },
    );
  },
);

export const modeAtom = atom<CalculationMode>("exact");
export const simulationTrialsAtom = atom<number>(defaultSimulationTrials);

export const resetInputAtom = atom(null, (_get, set) => {
  set(deckAtom, defaultDeckState);
  set(cardsAtom, []);
  set(patternsAtom, []);
  set(labelsAtom, []);
  set(potAtom, defaultPotState);
  set(deckNameAtom, "");
  set(modeAtom, "exact");
  set(simulationTrialsAtom, defaultSimulationTrials);
});
