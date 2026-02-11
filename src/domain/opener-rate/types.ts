import type {
  BaseCondition,
  Card,
  CountCondition,
  CountOperator,
  CountRuleMode,
  DeckState,
  Label,
  Pattern,
  SubPattern,
  PotState,
  SubPatternEffect,
  VsSimulationInput,
} from "../../shared/apiSchemas";

export const DESIRES_UID = "desires_card";
export const PROSPERITY_UID = "prosperity_card";
export const UNKNOWN_UID = "unknown_card";

export type NormalizedDeck = {
  deck: DeckState;
  cards: Card[];
  labels: Label[];
  patterns: Pattern[];
  subPatterns: SubPattern[];
  pot: PotState;
  vs?: VsSimulationInput;
  uidToIndex: Map<string, number>;
  indexToUid: string[];
  deckCounts: number[];
  prosperityIndex: number | null;
  desiresIndex: number | null;
};

export type CompiledBaseCondition = BaseCondition & {
  indices: number[];
};

export type CompiledCountRule = {
  indices: number[];
  mode: CountRuleMode;
};

export type CompiledCountCondition = Omit<CountCondition, "rules"> & {
  rules: CompiledCountRule[];
};

export type CompiledPatternCondition =
  | CompiledBaseCondition
  | CompiledCountCondition;

export type CompiledPattern = Omit<Pattern, "conditions"> & {
  conditions: CompiledPatternCondition[];
};

export type CompiledSubPattern = Omit<
  SubPattern,
  "triggerConditions" | "triggerSourceUids"
> & {
  triggerConditions: CompiledPatternCondition[];
  triggerSourceIndices: number[];
};

export type EvaluationContext = {
  handCounts: number[];
  deckCounts: number[];
};

export type EvaluationResult = {
  isSuccess: boolean;
  matchedPatternUids: string[];
  matchedLabelUids: string[];
  penetrationByDisruptionKey: Record<string, number>;
};

export type ThresholdCheck = {
  operator: CountOperator;
  threshold: number;
  total: number;
};

export type SubPatternEvaluationResult = {
  addedLabelUids: string[];
  penetrationByDisruptionKey: Record<string, number>;
};

export type CompiledSubPatternEffect = SubPatternEffect;
