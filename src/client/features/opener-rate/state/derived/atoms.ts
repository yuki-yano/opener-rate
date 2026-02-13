import { atom } from "jotai";

import {
  calculateInputSchema,
  type CalculateInput,
} from "../../../../../shared/apiSchemas";
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
  subPatternsAtom,
  simulationTrialsAtom,
  vsAtom,
} from "../input/atoms";
import {
  shortUrlLockedSourceHrefAtom,
  shortUrlLockedUntilChangeAtom,
} from "../ui/atoms";
import { normalizeShareSourceUrl } from "../short-url-utils";

const getCurrentHref = () => {
  if (typeof window === "undefined") return null;
  return window.location.href;
};

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
  const disruptionCards = get(disruptionCardsAtom);
  const disruptionCardByUid = new Map(
    disruptionCards.map((card) => [card.uid, card] as const),
  );
  const vs = get(vsAtom);
  const opponentDisruptionByCardUid = new Map(
    vs.opponentDisruptions
      .filter((entry) => {
        const disruptionCardUid = entry.disruptionCardUid;
        return (
          disruptionCardUid != null &&
          disruptionCardByUid.has(disruptionCardUid)
        );
      })
      .map((entry) => [entry.disruptionCardUid as string, entry] as const),
  );
  const syncedVs = {
    ...vs,
    opponentDisruptions: disruptionCards.map((source) => {
      const existing = opponentDisruptionByCardUid.get(source.uid);
      return {
        uid: existing?.uid ?? `vs_${source.uid}`,
        disruptionCardUid: source.uid,
        name: source.name,
        count: existing?.count ?? 0,
        oncePerName: source.oncePerName,
        disruptionCategoryUid: source.disruptionCategoryUid,
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

export const isShortUrlGenerationLockedAtom = atom((get) => {
  if (!get(shortUrlLockedUntilChangeAtom)) return false;

  // URLに反映されるatomを依存として読むことで、URL変更時に判定を再計算する
  get(deckAtom);
  get(deckNameAtom);
  get(cardsAtom);
  get(patternsAtom);
  get(subPatternsAtom);
  get(labelsAtom);
  get(disruptionCategoriesAtom);
  get(disruptionCardsAtom);
  get(potAtom);
  get(vsAtom);

  const lockedSourceHref = get(shortUrlLockedSourceHrefAtom);
  if (lockedSourceHref == null) return true;

  const currentHref = getCurrentHref();
  if (currentHref == null) return true;
  return normalizeShareSourceUrl(currentHref) === lockedSourceHref;
});
