import type { CalculateInput } from "../../../shared/apiSchemas";
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

const hasPoolId = (poolId: string | undefined) =>
  poolId != null && poolId.trim().length > 0;

const complementLegacyPenetrationPoolIds = (params: {
  effects: CalculateInput["patterns"][number]["effects"];
  fallbackPoolId: string;
}) => {
  const { effects, fallbackPoolId } = params;
  if (effects == null || effects.length === 0) {
    return { effects, changed: false };
  }

  let penetrationEffectCount = 0;
  let missingPoolIdCount = 0;
  for (const effect of effects) {
    if (effect.type !== "add_penetration") continue;
    penetrationEffectCount += 1;
    if (!hasPoolId(effect.poolId)) {
      missingPoolIdCount += 1;
    }
  }

  // Backward compatibility:
  // legacy data (poolId 未対応) では、同一パターン内の複数 add_penetration を
  // 1つの共有プールとして解釈したいケースがあるため自動補完する。
  if (
    penetrationEffectCount < 2 ||
    missingPoolIdCount !== penetrationEffectCount
  ) {
    return { effects, changed: false };
  }

  return {
    changed: true,
    effects: effects.map((effect) =>
      effect.type === "add_penetration"
        ? { ...effect, poolId: fallbackPoolId }
        : effect,
    ),
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

  const patterns = input.patterns.map((pattern, index) => {
    const complemented = complementLegacyPenetrationPoolIds({
      effects: pattern.effects,
      fallbackPoolId: `__legacy_pool__:pattern:${index}`,
    });
    if (!complemented.changed) return pattern;
    return {
      ...pattern,
      effects: complemented.effects,
    };
  });

  const subPatterns = input.subPatterns.map((subPattern, index) => {
    const complemented = complementLegacyPenetrationPoolIds({
      effects: subPattern.effects,
      fallbackPoolId: `__legacy_pool__:sub_pattern:${index}`,
    });
    if (!complemented.changed) return subPattern;
    return {
      ...subPattern,
      effects: complemented.effects ?? [],
    };
  });

  return {
    ok: true,
    value: {
      deck: input.deck,
      cards: input.cards,
      labels: input.labels,
      patterns,
      subPatterns,
      pot: input.pot,
      vs: input.vs,
      uidToIndex,
      indexToUid,
      deckCounts,
      prosperityIndex,
      desiresIndex,
    },
  };
};
