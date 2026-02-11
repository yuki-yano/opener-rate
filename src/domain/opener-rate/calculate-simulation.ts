import type {
  CalculateOutput,
  OpponentDisruptionCard,
} from "../../shared/apiSchemas";
import type {
  CompiledPattern,
  CompiledSubPattern,
  NormalizedDeck,
} from "./types";
import { evaluatePatterns } from "./evaluate-pattern";
import { evaluateSubPatterns } from "./evaluate-sub-pattern";

const toRateString = (successCount: number, total: number) => {
  if (total <= 0) return "0.00";
  return ((successCount / total) * 100).toFixed(2);
};

const scoreEvaluation = (evaluation: ReturnType<typeof evaluatePatterns>) =>
  (evaluation.isSuccess ? 1_000_000 : 0) +
  evaluation.matchedPatternUids.length * 1000 +
  evaluation.matchedLabelUids.length;

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

const shuffle = (array: number[]) => {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
};

const createOpponentDeckOrder = (params: {
  opponentDeckSize: number;
  opponentDisruptions: OpponentDisruptionCard[];
}) => {
  const { opponentDeckSize, opponentDisruptions } = params;
  const deckOrder: number[] = [];
  let totalDisruptionCount = 0;

  for (
    let disruptionIndex = 0;
    disruptionIndex < opponentDisruptions.length;
    disruptionIndex += 1
  ) {
    const disruption = opponentDisruptions[disruptionIndex];
    for (let i = 0; i < disruption.count; i += 1) {
      deckOrder.push(disruptionIndex);
      totalDisruptionCount += 1;
    }
  }

  const unknownCount = Math.max(0, opponentDeckSize - totalDisruptionCount);
  for (let i = 0; i < unknownCount; i += 1) {
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

const resolveOpponentDisruptionStrength = (params: {
  opponentDeckOrderTemplate: number[];
  opponentHandSize: number;
  opponentDisruptions: OpponentDisruptionCard[];
}) => {
  const { opponentDeckOrderTemplate, opponentHandSize, opponentDisruptions } =
    params;
  const opponentDeckOrder = opponentDeckOrderTemplate.slice();
  shuffle(opponentDeckOrder);

  const drawCount = Math.min(opponentHandSize, opponentDeckOrder.length);
  const drawnCountByUid = new Map<string, number>();
  for (let i = 0; i < drawCount; i += 1) {
    const disruptionIndex = opponentDeckOrder[i];
    if (disruptionIndex < 0) continue;
    const disruption = opponentDisruptions[disruptionIndex];
    const current = drawnCountByUid.get(disruption.uid) ?? 0;
    drawnCountByUid.set(disruption.uid, current + 1);
  }

  let hasDisruption = false;
  const strengthByDisruptionKey: Record<string, number> = {};

  for (const disruption of opponentDisruptions) {
    const drawnCount = drawnCountByUid.get(disruption.uid) ?? 0;
    if (drawnCount <= 0) continue;

    const effectiveCount = disruption.oncePerName
      ? Math.min(drawnCount, 1)
      : drawnCount;
    if (effectiveCount <= 0) continue;

    hasDisruption = true;
    const key = resolveDisruptionKey(disruption);
    const currentStrength = strengthByDisruptionKey[key] ?? 0;
    strengthByDisruptionKey[key] = currentStrength + effectiveCount;
  }

  return {
    hasDisruption,
    strengthByDisruptionKey,
  };
};

const canPenetrateAllDisruptions = (
  penetrationByDisruptionKey: Record<string, number>,
  disruptionStrengthByDisruptionKey: Record<string, number>,
) =>
  Object.entries(disruptionStrengthByDisruptionKey).every(
    ([disruptionKey, required]) => {
      if (required <= 0) return true;
      const penetration = penetrationByDisruptionKey[disruptionKey] ?? 0;
      return penetration >= required;
    },
  );

const runPotResolution = (
  normalized: NormalizedDeck,
  compiledPatterns: CompiledPattern[],
  handCounts: number[],
  deckCounts: number[],
  remainingDeckOrder: number[],
) => {
  const prosperityIndex = normalized.prosperityIndex;
  const desiresIndex = normalized.desiresIndex;

  if (
    prosperityIndex != null &&
    (handCounts[prosperityIndex] ?? 0) > 0 &&
    normalized.pot.prosperity.count > 0
  ) {
    handCounts[prosperityIndex] -= 1;
    const cost = normalized.pot.prosperity.cost;
    const revealed = remainingDeckOrder.slice(0, cost);
    if (revealed.length >= cost) {
      let bestRevealPosition = 0;
      let bestScore = -1;

      for (
        let revealPosition = 0;
        revealPosition < revealed.length;
        revealPosition += 1
      ) {
        const selectedIndex = revealed[revealPosition];
        const candidateHand = handCounts.slice();
        const candidateDeck = deckCounts.slice();
        candidateHand[selectedIndex] += 1;
        candidateDeck[selectedIndex] -= 1;

        const evaluation = evaluatePatterns(compiledPatterns, {
          handCounts: candidateHand,
          deckCounts: candidateDeck,
        });
        const score = scoreEvaluation(evaluation);
        if (score > bestScore) {
          bestScore = score;
          bestRevealPosition = revealPosition;
        }
      }

      const selected = revealed[bestRevealPosition];
      handCounts[selected] += 1;
      deckCounts[selected] -= 1;

      const remained = remainingDeckOrder.slice(cost);
      const backToBottom = revealed.filter(
        (_, index) => index !== bestRevealPosition,
      );
      remainingDeckOrder.splice(
        0,
        remainingDeckOrder.length,
        ...remained,
        ...backToBottom,
      );
    }
    return;
  }

  if (
    desiresIndex != null &&
    (handCounts[desiresIndex] ?? 0) > 0 &&
    normalized.pot.desiresOrExtravagance.count > 0
  ) {
    const drawCount = Math.min(2, remainingDeckOrder.length);
    for (let i = 0; i < drawCount; i += 1) {
      const drawn = remainingDeckOrder[i];
      handCounts[drawn] += 1;
      deckCounts[drawn] -= 1;
    }
    remainingDeckOrder.splice(0, drawCount);
  }
};

export const calculateBySimulation = (params: {
  normalized: NormalizedDeck;
  compiledPatterns: CompiledPattern[];
  compiledSubPatterns: CompiledSubPattern[];
  trials: number;
  mode?: CalculateOutput["mode"];
}): CalculateOutput => {
  const { normalized, compiledPatterns, compiledSubPatterns, trials } = params;
  const mode = params.mode ?? "simulation";

  const deckOrderTemplate = createDeckOrder(normalized.deckCounts);
  const vs = normalized.vs;
  const vsEnabled = vs?.enabled === true;
  const opponentDeckOrderTemplate = vsEnabled
    ? createOpponentDeckOrder({
        opponentDeckSize: vs.opponentDeckSize,
        opponentDisruptions: vs.opponentDisruptions,
      })
    : [];

  const labelOrder = normalized.labels.map((label) => label.uid);
  const patternOrder = normalized.patterns.map((pattern) => pattern.uid);
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

  for (let trial = 0; trial < trials; trial += 1) {
    const deckOrder = deckOrderTemplate.slice();
    shuffle(deckOrder);

    const handCounts = new Array(normalized.deckCounts.length).fill(0);
    const deckCounts = normalized.deckCounts.slice();

    for (let i = 0; i < normalized.deck.firstHand; i += 1) {
      const drawn = deckOrder[i];
      handCounts[drawn] += 1;
      deckCounts[drawn] -= 1;
    }

    const remainingDeckOrder = deckOrder.slice(normalized.deck.firstHand);
    runPotResolution(
      normalized,
      compiledPatterns,
      handCounts,
      deckCounts,
      remainingDeckOrder,
    );

    const evaluation = evaluatePatterns(compiledPatterns, {
      handCounts,
      deckCounts,
    });
    const subPatternEvaluation = evaluateSubPatterns({
      compiledSubPatterns,
      context: { handCounts, deckCounts },
      matchedPatternUids: evaluation.matchedPatternUids,
    });
    const matchedLabelUids = new Set([
      ...evaluation.matchedLabelUids,
      ...subPatternEvaluation.addedLabelUids,
    ]);

    const baseSuccess =
      evaluation.matchedPatternUids.length > 0 || matchedLabelUids.size > 0;
    let isSuccess = baseSuccess;

    if (vsEnabled) {
      const opponentDisruption = resolveOpponentDisruptionStrength({
        opponentDeckOrderTemplate,
        opponentHandSize: vs.opponentHandSize,
        opponentDisruptions: vs.opponentDisruptions,
      });

      if (!opponentDisruption.hasDisruption) {
        if (baseSuccess) {
          noDisruptionSuccessCount += 1;
        }
      } else {
        const penetrated = canPenetrateAllDisruptions(
          subPatternEvaluation.penetrationByDisruptionKey,
          opponentDisruption.strengthByDisruptionKey,
        );
        if (baseSuccess && penetrated) {
          disruptedButPenetratedCount += 1;
        } else {
          disruptedAndFailedCount += 1;
        }
        isSuccess = baseSuccess && penetrated;
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
    overallProbability: toRateString(overallSuccessCount, trials),
    patternSuccessRates: patternOrder.map((uid, index) => ({
      uid,
      rate: toRateString(patternSuccessCount[index] ?? 0, trials),
    })),
    labelSuccessRates: labelOrder.map((uid, index) => ({
      uid,
      rate: toRateString(labelSuccessCount[index] ?? 0, trials),
    })),
    mode,
    vsBreakdown: vsEnabled
      ? {
          noDisruptionSuccessRate: toRateString(
            noDisruptionSuccessCount,
            trials,
          ),
          disruptedButPenetratedRate: toRateString(
            disruptedButPenetratedCount,
            trials,
          ),
          disruptedAndFailedRate: toRateString(disruptedAndFailedCount, trials),
        }
      : undefined,
  };
};
