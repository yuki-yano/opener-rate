import { atom } from "jotai";

import {
  calculateInputSchema,
  type CalculateInput,
} from "../../../../shared/apiSchemas";
import {
  cardsAtom,
  deckAtom,
  disruptionCardsAtom,
  labelsAtom,
  modeAtom,
  patternsAtom,
  vsAtom,
  subPatternsAtom,
  potAtom,
  simulationTrialsAtom,
} from "../input/atoms";
import { savedInputAtom } from "../ui/atoms";

const stableStringify = (value: unknown) => JSON.stringify(value);

export const totalCardCountAtom = atom((get) => {
  const cardTotal = get(cardsAtom).reduce((acc, card) => acc + card.count, 0);
  const pot = get(potAtom);
  const potTotal = pot.desiresOrExtravagance.count + pot.prosperity.count;
  return cardTotal + potTotal;
});

export const deckSizeExceededAtom = atom((get) => {
  const totalCards = get(totalCardCountAtom);
  const deck = get(deckAtom);
  return totalCards > deck.cardCount;
});

export const calculateInputAtom = atom<CalculateInput>((get) => {
  const disruptionCardByUid = new Map(
    get(disruptionCardsAtom).map((card) => [card.uid, card] as const),
  );
  const vs = get(vsAtom);
  const syncedVs = {
    ...vs,
    opponentDisruptions: vs.opponentDisruptions.map((entry) => {
      if (entry.disruptionCardUid == null) return entry;
      const source = disruptionCardByUid.get(entry.disruptionCardUid);
      if (source == null) return entry;
      return {
        ...entry,
        name: source.name,
        oncePerName: source.oncePerName,
      };
    }),
  };

  return {
    deck: get(deckAtom),
    cards: get(cardsAtom),
    patterns: get(patternsAtom),
    subPatterns: get(subPatternsAtom),
    labels: get(labelsAtom),
    pot: get(potAtom),
    vs: syncedVs,
    settings: {
      mode: get(modeAtom),
      simulationTrials: get(simulationTrialsAtom),
    },
  };
});

export const validationResultAtom = atom((get) =>
  calculateInputSchema.safeParse(get(calculateInputAtom)),
);

export const canCalculateAtom = atom((get) => {
  if (get(deckSizeExceededAtom)) return false;
  return get(validationResultAtom).success;
});

export const isDirtyAtom = atom((get) => {
  const current = get(calculateInputAtom);
  const saved = get(savedInputAtom);
  if (saved == null) return false;
  return stableStringify(current) !== stableStringify(saved);
});
