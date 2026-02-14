import type {
  CalculateOutput,
  OpponentDisruptionCard,
} from "../../../shared/apiSchemas";
import {
  DESIRES_UID,
  PROSPERITY_UID,
  UNKNOWN_UID,
  type CompiledPattern,
  type CompiledSubPattern,
  type NormalizedDeck,
} from "./types";
import {
  evaluateMatchedOutcome,
  evaluateTrialOutcome,
  toRateStringFromNumber,
} from "./calculation-shared";
import { evaluatePatterns } from "./evaluate-pattern";

type RandomSource = () => number;
type PotResolutionScratch = {
  scoreStampByCardIndex: number[];
  scoreValueByCardIndex: number[];
  generation: number;
};
type PenetrableHandCounter = {
  handLabel: string;
  successCount: number;
};
type PenetrationCombinationCounter = {
  combinationLabel: string;
  requiredPenetrationByDisruptionKey: Record<string, number>;
  penetrableHandCountByKey: Map<string, PenetrableHandCounter>;
  occurrenceCount: number;
  successCount: number;
};

const scoreEvaluation = (params: {
  evaluation: ReturnType<typeof evaluatePatterns>;
  compiledPatternByUid: Map<string, CompiledPattern>;
  compiledSubPatterns: CompiledSubPattern[];
  handCounts: number[];
  deckCounts: number[];
}) => {
  const {
    evaluation,
    compiledPatternByUid,
    compiledSubPatterns,
    handCounts,
    deckCounts,
  } = params;
  const matchedOutcome = evaluateMatchedOutcome({
    evaluation,
    compiledPatternByUid,
    compiledSubPatterns,
    handCounts,
    deckCounts,
  });
  const countableMatchedLabelCount =
    matchedOutcome.countableMatchedLabelUids.size;

  return (
    (matchedOutcome.baseSuccess ? 1_000_000 : 0) +
    matchedOutcome.countablePatternEffects.countableMatchedPatternUids.length *
      1000 +
    countableMatchedLabelCount
  );
};

const createDeckOrder = (deckCounts: number[]) => {
  const deckOrder: number[] = [];
  for (let cardIndex = 0; cardIndex < deckCounts.length; cardIndex += 1) {
    const count = deckCounts[cardIndex] ?? 0;
    for (let i = 0; i < count; i += 1) {
      deckOrder.push(cardIndex);
    }
  }
  return deckOrder;
};

const randomOffset = (size: number, rng: RandomSource) => {
  const next = rng();
  const clamped = Math.min(0.999999999999, Math.max(0, next));
  return Math.floor(clamped * size);
};

const shuffle = (array: number[], rng: RandomSource) => {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = randomOffset(index + 1, rng);
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
};

const partialShuffleTop = (
  array: number[],
  drawCount: number,
  rng: RandomSource,
) => {
  const limit = Math.min(drawCount, array.length);
  for (let index = 0; index < limit; index += 1) {
    const randomIndex = index + randomOffset(array.length - index, rng);
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
};

const copyNumberArray = (source: number[], target: number[]) => {
  target.length = source.length;
  for (let index = 0; index < source.length; index += 1) {
    target[index] = source[index] ?? 0;
  }
};

const createOpponentDeckOrder = (params: {
  opponentDeckSize: number;
  opponentDisruptions: OpponentDisruptionCard[];
}) => {
  const { opponentDeckSize, opponentDisruptions } = params;
  const deckOrder: number[] = [];
  let remainingSlots = Math.max(0, opponentDeckSize);

  for (
    let disruptionIndex = 0;
    disruptionIndex < opponentDisruptions.length && remainingSlots > 0;
    disruptionIndex += 1
  ) {
    const disruption = opponentDisruptions[disruptionIndex];
    const count = Math.min(disruption.count, remainingSlots);
    for (let i = 0; i < count; i += 1) {
      deckOrder.push(disruptionIndex);
    }
    remainingSlots -= count;
  }

  for (let i = 0; i < remainingSlots; i += 1) {
    deckOrder.push(-1);
  }

  return deckOrder;
};

const resolveDisruptionKey = (disruption: OpponentDisruptionCard) => {
  if (disruption.disruptionCategoryUid != null) {
    return disruption.disruptionCategoryUid;
  }
  if (disruption.disruptionCardUid != null) {
    return disruption.disruptionCardUid;
  }
  const nameKey = disruption.name.trim();
  if (nameKey.length > 0) {
    return nameKey;
  }
  return disruption.uid;
};

const resolveCombinationDisruptionKey = (
  disruption: OpponentDisruptionCard,
) => {
  if (disruption.disruptionCardUid != null) {
    return disruption.disruptionCardUid;
  }
  return resolveDisruptionKey(disruption);
};

const resolveDisruptionDisplayName = (disruption: OpponentDisruptionCard) => {
  const name = disruption.name.trim();
  if (name.length > 0) {
    return name;
  }
  return disruption.uid;
};

const createDisruptionLabelsByKey = (params: {
  opponentDisruptions: OpponentDisruptionCard[];
  opponentDisruptionKeys: string[];
}) => {
  const { opponentDisruptions, opponentDisruptionKeys } = params;
  const nameSetByKey = new Map<string, Set<string>>();

  for (
    let disruptionIndex = 0;
    disruptionIndex < opponentDisruptions.length;
    disruptionIndex += 1
  ) {
    const disruption = opponentDisruptions[disruptionIndex];
    const key = opponentDisruptionKeys[disruptionIndex] ?? disruption.uid;
    const displayName = resolveDisruptionDisplayName(disruption);
    const nameSet = nameSetByKey.get(key);
    if (nameSet == null) {
      nameSetByKey.set(key, new Set([displayName]));
      continue;
    }
    nameSet.add(displayName);
  }

  const labelByKey = new Map<string, string>();
  for (const [key, nameSet] of nameSetByKey) {
    const names = Array.from(nameSet);
    labelByKey.set(key, names.join(" / "));
  }
  return labelByKey;
};

const specialCardLabelByUid = new Map<string, string>([
  [PROSPERITY_UID, "金満で謙虚な壺"],
  [DESIRES_UID, "強欲で貪欲な壺/強欲で金満な壺"],
  [UNKNOWN_UID, "その他カード"],
]);

const createCardLabelByUid = (normalized: NormalizedDeck) => {
  const cardLabelByUid = new Map<string, string>(
    normalized.cards.map((card) => {
      const name = card.name.trim();
      return [card.uid, name.length > 0 ? name : card.uid];
    }),
  );
  for (const [uid, label] of specialCardLabelByUid) {
    cardLabelByUid.set(uid, label);
  }
  return cardLabelByUid;
};

const resolveHandCombination = (params: {
  handCounts: number[];
  indexToUid: string[];
  cardLabelByUid: Map<string, string>;
  relatedCardIndices?: Set<number>;
}) => {
  const { handCounts, indexToUid, cardLabelByUid, relatedCardIndices } = params;
  const entries: Array<{ uid: string; count: number }> = [];

  for (let cardIndex = 0; cardIndex < handCounts.length; cardIndex += 1) {
    if (relatedCardIndices != null && !relatedCardIndices.has(cardIndex)) {
      continue;
    }
    const count = handCounts[cardIndex] ?? 0;
    if (count <= 0) continue;
    const uid = indexToUid[cardIndex];
    if (uid == null) continue;
    entries.push({ uid, count });
  }

  if (entries.length === 0) return null;
  entries.sort((left, right) => left.uid.localeCompare(right.uid));

  const keyParts: string[] = [];
  const labelParts: string[] = [];
  for (const entry of entries) {
    keyParts.push(`${entry.uid}:${entry.count}`);
    const cardLabel = cardLabelByUid.get(entry.uid) ?? entry.uid;
    labelParts.push(
      entry.count > 1 ? `${cardLabel}x${entry.count}` : cardLabel,
    );
  }

  return {
    handKey: keyParts.join("|"),
    handLabel: labelParts.join(" + "),
  };
};

const collectConditionRelatedCardIndices = (
  pattern: CompiledPattern,
  target: Set<number>,
) => {
  for (const condition of pattern.conditions) {
    if ("indices" in condition) {
      for (const index of condition.indices) {
        target.add(index);
      }
      continue;
    }
    for (const rule of condition.rules) {
      for (const index of rule.indices) {
        target.add(index);
      }
    }
  }
};

const collectPenetrationRelatedCardIndices = (params: {
  evaluation: ReturnType<typeof evaluatePatterns>;
  countableMatchedPatternUids: string[];
  compiledPatternByUid: Map<string, CompiledPattern>;
  subPatternRelatedCardIndices: number[];
}) => {
  const {
    evaluation,
    countableMatchedPatternUids,
    compiledPatternByUid,
    subPatternRelatedCardIndices,
  } = params;
  const relatedCardIndices = new Set<number>();

  for (const patternUid of countableMatchedPatternUids) {
    const matchedCardCounts =
      evaluation.matchedCardCountsByPatternUid[patternUid];
    if (matchedCardCounts != null) {
      for (const [indexText, count] of Object.entries(matchedCardCounts)) {
        if (count <= 0) continue;
        const index = Number(indexText);
        if (!Number.isNaN(index)) {
          relatedCardIndices.add(index);
        }
      }
    }
    const pattern = compiledPatternByUid.get(patternUid);
    if (pattern != null) {
      collectConditionRelatedCardIndices(pattern, relatedCardIndices);
    }
  }
  for (const index of subPatternRelatedCardIndices) {
    relatedCardIndices.add(index);
  }

  return relatedCardIndices;
};

const resolvePenetrationCombination = (params: {
  disruptionStrengthByDisruptionKey: Record<string, number>;
  disruptionLabelByKey: Map<string, string>;
}) => {
  const { disruptionStrengthByDisruptionKey, disruptionLabelByKey } = params;
  const entries = Object.entries(disruptionStrengthByDisruptionKey)
    .filter(([, strength]) => strength > 0)
    .sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) return null;

  const keyParts: string[] = [];
  const labelParts: string[] = [];
  for (const [key, strength] of entries) {
    keyParts.push(`${key}:${strength}`);
    const baseLabel = disruptionLabelByKey.get(key) ?? key;
    labelParts.push(strength > 1 ? `${baseLabel}x${strength}` : baseLabel);
  }

  return {
    combinationKey: keyParts.join("|"),
    combinationLabel: labelParts.join(" + "),
  };
};

const resolveOpponentDisruptionStrength = (params: {
  opponentDeckOrderTemplate: number[];
  opponentDeckOrder: number[];
  opponentHandSize: number;
  opponentDisruptions: OpponentDisruptionCard[];
  penetrationDisruptionKeys: string[];
  combinationDisruptionKeys: string[];
  drawnCountByIndex: number[];
  rng: RandomSource;
  optimizeShuffle: boolean;
}) => {
  const {
    opponentDeckOrderTemplate,
    opponentDeckOrder,
    opponentHandSize,
    opponentDisruptions,
    penetrationDisruptionKeys,
    combinationDisruptionKeys,
    drawnCountByIndex,
    rng,
    optimizeShuffle,
  } = params;
  copyNumberArray(opponentDeckOrderTemplate, opponentDeckOrder);
  const drawCount = Math.min(opponentHandSize, opponentDeckOrder.length);
  if (optimizeShuffle) {
    partialShuffleTop(opponentDeckOrder, drawCount, rng);
  } else {
    shuffle(opponentDeckOrder, rng);
  }
  drawnCountByIndex.fill(0);
  for (let i = 0; i < drawCount; i += 1) {
    const disruptionIndex = opponentDeckOrder[i];
    if (disruptionIndex < 0) continue;
    const current = drawnCountByIndex[disruptionIndex] ?? 0;
    drawnCountByIndex[disruptionIndex] = current + 1;
  }

  let hasDisruption = false;
  const penetrationStrengthByDisruptionKey: Record<string, number> = {};
  const combinationStrengthByDisruptionKey: Record<string, number> = {};

  for (
    let disruptionIndex = 0;
    disruptionIndex < opponentDisruptions.length;
    disruptionIndex += 1
  ) {
    const disruption = opponentDisruptions[disruptionIndex];
    const drawnCount = drawnCountByIndex[disruptionIndex] ?? 0;
    if (drawnCount <= 0) continue;

    const effectiveCount = disruption.oncePerName
      ? Math.min(drawnCount, 1)
      : drawnCount;
    if (effectiveCount <= 0) continue;

    hasDisruption = true;
    const penetrationKey =
      penetrationDisruptionKeys[disruptionIndex] ?? disruption.uid;
    const currentPenetrationStrength =
      penetrationStrengthByDisruptionKey[penetrationKey] ?? 0;
    penetrationStrengthByDisruptionKey[penetrationKey] =
      currentPenetrationStrength + effectiveCount;

    const combinationKey =
      combinationDisruptionKeys[disruptionIndex] ?? penetrationKey;
    const currentCombinationStrength =
      combinationStrengthByDisruptionKey[combinationKey] ?? 0;
    combinationStrengthByDisruptionKey[combinationKey] =
      currentCombinationStrength + effectiveCount;
  }

  return {
    hasDisruption,
    penetrationStrengthByDisruptionKey,
    combinationStrengthByDisruptionKey,
  };
};

const canPenetrateAllDisruptions = (params: {
  patternPenetrationByDisruptionKey: Record<string, number>;
  subPatternPenetrationByDisruptionKey: Record<string, number>;
  disruptionStrengthByDisruptionKey: Record<string, number>;
}) => {
  const {
    patternPenetrationByDisruptionKey,
    subPatternPenetrationByDisruptionKey,
    disruptionStrengthByDisruptionKey,
  } = params;
  for (const [disruptionKey, required] of Object.entries(
    disruptionStrengthByDisruptionKey,
  )) {
    if (required <= 0) continue;
    const penetration =
      (patternPenetrationByDisruptionKey[disruptionKey] ?? 0) +
      (subPatternPenetrationByDisruptionKey[disruptionKey] ?? 0);
    if (penetration < required) {
      return false;
    }
  }
  return true;
};

const resolveSubPatternMaxApplyCountUpperBound = (
  subPattern: CompiledSubPattern,
) => {
  if (subPattern.applyLimit === "once_per_trial") {
    return 1;
  }
  if (subPattern.triggerSourceIndices.length > 0) {
    return subPattern.triggerSourceIndices.length;
  }
  if (subPattern.hasTriggerSourceUids === true) {
    return 0;
  }
  return 1;
};

const resolveMaxPenetrationByDisruptionKey = (params: {
  compiledPatterns: CompiledPattern[];
  compiledSubPatterns: CompiledSubPattern[];
}) => {
  const { compiledPatterns, compiledSubPatterns } = params;
  const maxPenetrationByDisruptionKey: Record<string, number> = {};

  for (const pattern of compiledPatterns) {
    if (!pattern.active) continue;
    for (const effect of pattern.effects ?? []) {
      if (effect.type !== "add_penetration") continue;
      for (const disruptionCategoryUid of effect.disruptionCategoryUids) {
        const current =
          maxPenetrationByDisruptionKey[disruptionCategoryUid] ?? 0;
        maxPenetrationByDisruptionKey[disruptionCategoryUid] =
          current + effect.amount;
      }
    }
  }

  for (const subPattern of compiledSubPatterns) {
    if (!subPattern.active) continue;
    const maxApplyCount = resolveSubPatternMaxApplyCountUpperBound(subPattern);
    if (maxApplyCount <= 0) continue;
    for (const effect of subPattern.effects) {
      if (effect.type !== "add_penetration") continue;
      for (const disruptionCategoryUid of effect.disruptionCategoryUids) {
        const current =
          maxPenetrationByDisruptionKey[disruptionCategoryUid] ?? 0;
        maxPenetrationByDisruptionKey[disruptionCategoryUid] =
          current + effect.amount * maxApplyCount;
      }
    }
  }

  return maxPenetrationByDisruptionKey;
};

const isPenetrationImpossibleByUpperBound = (params: {
  requiredPenetrationByDisruptionKey: Record<string, number>;
  maxPenetrationByDisruptionKey: Record<string, number>;
}) => {
  const { requiredPenetrationByDisruptionKey, maxPenetrationByDisruptionKey } =
    params;
  for (const [disruptionKey, required] of Object.entries(
    requiredPenetrationByDisruptionKey,
  )) {
    if (required <= 0) continue;
    const maxPenetration = maxPenetrationByDisruptionKey[disruptionKey] ?? 0;
    if (required > maxPenetration) {
      return true;
    }
  }
  return false;
};

const runPotResolution = (
  normalized: NormalizedDeck,
  compiledPatterns: CompiledPattern[],
  compiledPatternByUid: Map<string, CompiledPattern>,
  compiledSubPatterns: CompiledSubPattern[],
  handCounts: number[],
  deckCounts: number[],
  deckOrder: number[],
  remainingStartIndex: number,
  scratch: PotResolutionScratch,
) => {
  const prosperityIndex = normalized.prosperityIndex;
  const desiresIndex = normalized.desiresIndex;
  const remainingDeckCount = deckOrder.length - remainingStartIndex;

  if (
    prosperityIndex != null &&
    (handCounts[prosperityIndex] ?? 0) > 0 &&
    normalized.pot.prosperity.count > 0
  ) {
    const cost = normalized.pot.prosperity.cost;
    if (remainingDeckCount >= cost) {
      handCounts[prosperityIndex] -= 1;
      let bestRevealPosition = 0;
      let bestScore = -1;
      let currentGeneration = scratch.generation + 1;
      if (currentGeneration > Number.MAX_SAFE_INTEGER - 1) {
        scratch.scoreStampByCardIndex.fill(0);
        currentGeneration = 1;
      }
      scratch.generation = currentGeneration;

      for (let revealPosition = 0; revealPosition < cost; revealPosition += 1) {
        const selectedIndex =
          deckOrder[remainingStartIndex + revealPosition] ?? -1;
        if (selectedIndex < 0) continue;
        const cachedScore =
          scratch.scoreStampByCardIndex[selectedIndex] === currentGeneration
            ? scratch.scoreValueByCardIndex[selectedIndex]
            : undefined;
        const score =
          cachedScore ??
          (() => {
            handCounts[selectedIndex] += 1;
            deckCounts[selectedIndex] -= 1;

            const evaluation = evaluatePatterns(compiledPatterns, {
              handCounts,
              deckCounts,
            });
            const nextScore = scoreEvaluation({
              evaluation,
              compiledPatternByUid,
              compiledSubPatterns,
              handCounts,
              deckCounts,
            });
            handCounts[selectedIndex] -= 1;
            deckCounts[selectedIndex] += 1;
            scratch.scoreStampByCardIndex[selectedIndex] = currentGeneration;
            scratch.scoreValueByCardIndex[selectedIndex] = nextScore;
            return nextScore;
          })();
        if (score > bestScore) {
          bestScore = score;
          bestRevealPosition = revealPosition;
        }
      }

      const selected =
        deckOrder[remainingStartIndex + bestRevealPosition] ?? -1;
      if (selected >= 0) {
        handCounts[selected] += 1;
        deckCounts[selected] -= 1;
      }
      return;
    }
  }

  if (
    desiresIndex != null &&
    (handCounts[desiresIndex] ?? 0) > 0 &&
    normalized.pot.desiresOrExtravagance.count > 0
  ) {
    const drawCount = Math.min(2, remainingDeckCount);
    for (let i = 0; i < drawCount; i += 1) {
      const drawn = deckOrder[remainingStartIndex + i] ?? -1;
      if (drawn < 0) continue;
      handCounts[drawn] += 1;
      deckCounts[drawn] -= 1;
    }
  }
};

export const calculateBySimulation = (params: {
  normalized: NormalizedDeck;
  compiledPatterns: CompiledPattern[];
  compiledSubPatterns: CompiledSubPattern[];
  trials: number;
  mode?: CalculateOutput["mode"];
  rng?: RandomSource;
}): CalculateOutput => {
  const { normalized, compiledPatterns, compiledSubPatterns, trials } = params;
  const mode = params.mode ?? "simulation";
  const rng = params.rng ?? Math.random;
  const useOptimizedShuffle = params.rng == null;

  const deckOrderTemplate = createDeckOrder(normalized.deckCounts);
  const vs = normalized.vs;
  const vsEnabled = vs?.enabled === true;
  const opponentDeckOrderTemplate = vsEnabled
    ? createOpponentDeckOrder({
        opponentDeckSize: vs.opponentDeckSize,
        opponentDisruptions: vs.opponentDisruptions,
      })
    : [];
  const penetrationDisruptionKeys = vsEnabled
    ? vs.opponentDisruptions.map((disruption) =>
        resolveDisruptionKey(disruption),
      )
    : [];
  const combinationDisruptionKeys = vsEnabled
    ? vs.opponentDisruptions.map((disruption) =>
        resolveCombinationDisruptionKey(disruption),
      )
    : [];
  const disruptionLabelByCombinationKey = vsEnabled
    ? createDisruptionLabelsByKey({
        opponentDisruptions: vs.opponentDisruptions,
        opponentDisruptionKeys: combinationDisruptionKeys,
      })
    : new Map<string, string>();
  const cardLabelByUid = createCardLabelByUid(normalized);

  const labelOrder = normalized.labels.map((label) => label.uid);
  const patternOrder = normalized.patterns.map((pattern) => pattern.uid);
  const compiledPatternByUid = new Map(
    compiledPatterns.map((pattern) => [pattern.uid, pattern]),
  );
  const labelIndexByUid = new Map(labelOrder.map((uid, index) => [uid, index]));
  const patternIndexByUid = new Map(
    patternOrder.map((uid, index) => [uid, index]),
  );

  let overallSuccessCount = 0;
  const labelSuccessCount = new Array(labelOrder.length).fill(0);
  const patternSuccessCount = new Array(patternOrder.length).fill(0);
  let noDisruptionSuccessCount = 0;
  let disruptedButPenetratedCount = 0;
  let disruptedAndFailedCount = 0;
  const penetratedCombinationCountByKey = new Map<
    string,
    PenetrationCombinationCounter
  >();
  const hasPotEffects =
    normalized.pot.desiresOrExtravagance.count > 0 ||
    normalized.pot.prosperity.count > 0;
  const maxPenetrationByDisruptionKey = resolveMaxPenetrationByDisruptionKey({
    compiledPatterns,
    compiledSubPatterns,
  });
  const firstHand = normalized.deck.firstHand;
  const deckOrder = new Array<number>(deckOrderTemplate.length);
  const handCounts = new Array(normalized.deckCounts.length).fill(0);
  const deckCounts = normalized.deckCounts.slice();
  const potScratch: PotResolutionScratch = {
    scoreStampByCardIndex: new Array(normalized.deckCounts.length).fill(0),
    scoreValueByCardIndex: new Array(normalized.deckCounts.length).fill(0),
    generation: 0,
  };
  const opponentDeckOrder = new Array<number>(opponentDeckOrderTemplate.length);
  const drawnCountByIndex = new Array(vs?.opponentDisruptions.length ?? 0).fill(
    0,
  );

  for (let trial = 0; trial < trials; trial += 1) {
    copyNumberArray(deckOrderTemplate, deckOrder);
    if (useOptimizedShuffle && !hasPotEffects) {
      partialShuffleTop(deckOrder, firstHand, rng);
    } else {
      shuffle(deckOrder, rng);
    }

    handCounts.fill(0);
    copyNumberArray(normalized.deckCounts, deckCounts);

    for (let i = 0; i < firstHand; i += 1) {
      const drawn = deckOrder[i];
      handCounts[drawn] += 1;
      deckCounts[drawn] -= 1;
    }

    if (hasPotEffects) {
      runPotResolution(
        normalized,
        compiledPatterns,
        compiledPatternByUid,
        compiledSubPatterns,
        handCounts,
        deckCounts,
        deckOrder,
        firstHand,
        potScratch,
      );
    }

    const outcome = evaluateTrialOutcome({
      compiledPatterns,
      compiledPatternByUid,
      compiledSubPatterns,
      handCounts,
      deckCounts,
    });
    const { evaluation } = outcome;
    const {
      baseSuccess,
      countablePatternEffects,
      countableSubPatternEvaluation,
      matchedLabelUids,
    } = outcome;
    let isSuccess = baseSuccess;

    if (vsEnabled) {
      const opponentDisruption = resolveOpponentDisruptionStrength({
        opponentDeckOrderTemplate,
        opponentDeckOrder,
        opponentHandSize: vs.opponentHandSize,
        opponentDisruptions: vs.opponentDisruptions,
        penetrationDisruptionKeys,
        combinationDisruptionKeys,
        drawnCountByIndex,
        rng,
        optimizeShuffle: useOptimizedShuffle,
      });

      if (!opponentDisruption.hasDisruption) {
        if (baseSuccess) {
          noDisruptionSuccessCount += 1;
        }
      } else {
        const penetrated = canPenetrateAllDisruptions({
          patternPenetrationByDisruptionKey:
            countablePatternEffects.penetrationByDisruptionKey,
          subPatternPenetrationByDisruptionKey:
            countableSubPatternEvaluation.penetrationByDisruptionKey,
          disruptionStrengthByDisruptionKey:
            opponentDisruption.penetrationStrengthByDisruptionKey,
        });
        const isPenetratedSuccess = baseSuccess && penetrated;
        if (isPenetratedSuccess) {
          disruptedButPenetratedCount += 1;
        } else {
          disruptedAndFailedCount += 1;
        }
        const combination = resolvePenetrationCombination({
          disruptionStrengthByDisruptionKey:
            opponentDisruption.combinationStrengthByDisruptionKey,
          disruptionLabelByKey: disruptionLabelByCombinationKey,
        });
        if (combination != null) {
          let combinationCounter = penetratedCombinationCountByKey.get(
            combination.combinationKey,
          );
          if (combinationCounter == null) {
            combinationCounter = {
              combinationLabel: combination.combinationLabel,
              requiredPenetrationByDisruptionKey: {
                ...opponentDisruption.penetrationStrengthByDisruptionKey,
              },
              penetrableHandCountByKey: new Map(),
              occurrenceCount: 0,
              successCount: 0,
            };
            penetratedCombinationCountByKey.set(
              combination.combinationKey,
              combinationCounter,
            );
          }
          combinationCounter.occurrenceCount += 1;
          if (isPenetratedSuccess) {
            combinationCounter.successCount += 1;
            const relatedCardIndices = collectPenetrationRelatedCardIndices({
              evaluation,
              countableMatchedPatternUids:
                countablePatternEffects.countableMatchedPatternUids,
              compiledPatternByUid,
              subPatternRelatedCardIndices:
                countableSubPatternEvaluation.relatedCardIndices,
            });
            const handCombination = resolveHandCombination({
              handCounts,
              indexToUid: normalized.indexToUid,
              cardLabelByUid,
              relatedCardIndices,
            });
            if (handCombination != null) {
              const currentHandCounter =
                combinationCounter.penetrableHandCountByKey.get(
                  handCombination.handKey,
                );
              if (currentHandCounter == null) {
                combinationCounter.penetrableHandCountByKey.set(
                  handCombination.handKey,
                  {
                    handLabel: handCombination.handLabel,
                    successCount: 1,
                  },
                );
              } else {
                currentHandCounter.successCount += 1;
              }
            }
          }
        }
        isSuccess = isPenetratedSuccess;
      }
    }

    if (isSuccess) {
      overallSuccessCount += 1;
    }

    for (const patternUid of evaluation.matchedPatternUids) {
      const index = patternIndexByUid.get(patternUid);
      if (index == null) continue;
      patternSuccessCount[index] += 1;
    }
    for (const labelUid of matchedLabelUids) {
      const index = labelIndexByUid.get(labelUid);
      if (index == null) continue;
      labelSuccessCount[index] += 1;
    }
  }

  return {
    overallProbability: toRateStringFromNumber(overallSuccessCount, trials),
    patternSuccessRates: patternOrder.map((uid, index) => ({
      uid,
      rate: toRateStringFromNumber(patternSuccessCount[index] ?? 0, trials),
    })),
    labelSuccessRates: labelOrder.map((uid, index) => ({
      uid,
      rate: toRateStringFromNumber(labelSuccessCount[index] ?? 0, trials),
    })),
    mode,
    vsBreakdown: vsEnabled
      ? {
          noDisruptionSuccessRate: toRateStringFromNumber(
            noDisruptionSuccessCount,
            trials,
          ),
          disruptedButPenetratedRate: toRateStringFromNumber(
            disruptedButPenetratedCount,
            trials,
          ),
          disruptedAndFailedRate: toRateStringFromNumber(
            disruptedAndFailedCount,
            trials,
          ),
        }
      : undefined,
    vsPenetrationCombinations: vsEnabled
      ? Array.from(penetratedCombinationCountByKey.entries())
          .map(([combinationKey, entry]) => {
            const penetrableHandCombinations = Array.from(
              entry.penetrableHandCountByKey.entries(),
            )
              .map(([handKey, handEntry]) => ({
                handKey,
                handLabel: handEntry.handLabel,
                successCount: handEntry.successCount,
                successRateInCombination: toRateStringFromNumber(
                  handEntry.successCount,
                  entry.occurrenceCount,
                ),
              }))
              .sort((left, right) => {
                const countDiff = right.successCount - left.successCount;
                if (countDiff !== 0) return countDiff;
                return left.handLabel.localeCompare(right.handLabel);
              });

            return {
              combinationKey,
              combinationLabel: entry.combinationLabel,
              successCount: entry.successCount,
              occurrenceCount: entry.occurrenceCount,
              occurrenceRate: toRateStringFromNumber(
                entry.occurrenceCount,
                trials,
              ),
              successRate: toRateStringFromNumber(
                entry.successCount,
                entry.occurrenceCount,
              ),
              penetrableHandCombinations:
                penetrableHandCombinations.length > 0
                  ? penetrableHandCombinations
                  : undefined,
              isPenetrationImpossible: isPenetrationImpossibleByUpperBound({
                requiredPenetrationByDisruptionKey:
                  entry.requiredPenetrationByDisruptionKey,
                maxPenetrationByDisruptionKey,
              }),
            };
          })
          .sort((left, right) => {
            const occurrenceDiff = right.occurrenceCount - left.occurrenceCount;
            if (occurrenceDiff !== 0) return occurrenceDiff;
            const successDiff = right.successCount - left.successCount;
            if (successDiff !== 0) return successDiff;
            return left.combinationLabel.localeCompare(right.combinationLabel);
          })
      : undefined,
  };
};
