import { compilePatternConditions, toIndices } from "./compile-conditions";
import type { CompiledSubPattern, NormalizedDeck } from "./types";

const toUniqueIndices = (indices: number[]) => Array.from(new Set(indices));

export const compileSubPatterns = (
  normalized: NormalizedDeck,
): CompiledSubPattern[] =>
  normalized.subPatterns.map((subPattern) => ({
    ...subPattern,
    triggerConditions: compilePatternConditions(
      normalized.uidToIndex,
      subPattern.triggerConditions,
    ),
    triggerSourceIndices: toUniqueIndices(
      toIndices(normalized.uidToIndex, subPattern.triggerSourceUids),
    ),
  }));
