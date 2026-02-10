import { atom } from "jotai";

import {
  calculateInputSchema,
  type CalculateInput,
} from "../../../../shared/apiSchemas";
import {
  cardsAtom,
  deckAtom,
  labelsAtom,
  modeAtom,
  patternsAtom,
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

export const calculateInputAtom = atom<CalculateInput>((get) => ({
  deck: get(deckAtom),
  cards: get(cardsAtom),
  patterns: get(patternsAtom),
  subPatterns: get(subPatternsAtom),
  labels: get(labelsAtom),
  pot: get(potAtom),
  settings: {
    mode: get(modeAtom),
    simulationTrials: get(simulationTrialsAtom),
  },
}));

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
