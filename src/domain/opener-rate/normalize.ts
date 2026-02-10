import type { CalculateInput } from "../../shared/apiSchemas";
import {
  DESIRES_UID,
  PROSPERITY_UID,
  UNKNOWN_UID,
  type NormalizedDeck,
} from "./types";

type NormalizeResult =
  | { ok: true; value: NormalizedDeck }
  | {
      ok: false;
      error: {
        deckSize: number;
        totalCards: number;
        excess: number;
      };
    };

export const normalizeCalculateInput = (
  input: CalculateInput,
): NormalizeResult => {
  const deckCountByUid = new Map<string, number>();

  for (const card of input.cards) {
    if (card.count <= 0) continue;
    const current = deckCountByUid.get(card.uid) ?? 0;
    deckCountByUid.set(card.uid, current + card.count);
  }

  if (input.pot.prosperity.count > 0) {
    deckCountByUid.set(PROSPERITY_UID, input.pot.prosperity.count);
  }
  if (input.pot.desiresOrExtravagance.count > 0) {
    deckCountByUid.set(DESIRES_UID, input.pot.desiresOrExtravagance.count);
  }

  let explicitCount = 0;
  for (const count of deckCountByUid.values()) {
    explicitCount += count;
  }

  if (explicitCount > input.deck.cardCount) {
    return {
      ok: false,
      error: {
        deckSize: input.deck.cardCount,
        totalCards: explicitCount,
        excess: explicitCount - input.deck.cardCount,
      },
    };
  }

  const unknownCount = input.deck.cardCount - explicitCount;
  if (unknownCount > 0) {
    deckCountByUid.set(UNKNOWN_UID, unknownCount);
  }

  const indexToUid = Array.from(deckCountByUid.keys());
  const uidToIndex = new Map<string, number>();
  indexToUid.forEach((uid, index) => {
    uidToIndex.set(uid, index);
  });

  const deckCounts = indexToUid.map((uid) => deckCountByUid.get(uid) ?? 0);
  const prosperityIndex = uidToIndex.get(PROSPERITY_UID) ?? null;
  const desiresIndex = uidToIndex.get(DESIRES_UID) ?? null;

  return {
    ok: true,
    value: {
      deck: input.deck,
      cards: input.cards,
      labels: input.labels,
      patterns: input.patterns,
      subPatterns: input.subPatterns,
      pot: input.pot,
      uidToIndex,
      indexToUid,
      deckCounts,
      prosperityIndex,
      desiresIndex,
    },
  };
};
