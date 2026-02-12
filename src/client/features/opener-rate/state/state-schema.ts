import { z, type ZodType } from "zod";

import {
  cardSchema,
  disruptionCategorySchema,
  disruptionCardSchema,
  labelSchema,
  opponentDisruptionCardSchema,
  patternSchema,
  subPatternSchema,
  vsSimulationInputSchema,
} from "../../../../shared/apiSchemas";
import type {
  Card,
  DisruptionCategory,
  DisruptionCard,
  Label,
  OpponentDisruptionCard,
  Pattern,
  SubPattern,
  VsSimulationInput,
} from "../../../../shared/apiSchemas";

export const defaultVsState: VsSimulationInput = {
  enabled: false,
  opponentDeckSize: 40,
  opponentHandSize: 5,
  opponentDisruptions: [],
};

export const draftCardSchema: ZodType<Card> = cardSchema.extend({
  name: z.string(),
});
export const draftPatternSchema: ZodType<Pattern> = patternSchema.extend({
  name: z.string(),
});
export const draftSubPatternSchema: ZodType<SubPattern> =
  subPatternSchema.extend({
    name: z.string(),
  });
export const draftLabelSchema: ZodType<Label> = labelSchema.extend({
  name: z.string(),
});
export const draftDisruptionCategorySchema: ZodType<DisruptionCategory> =
  disruptionCategorySchema.extend({
    name: z.string(),
  });
export const draftDisruptionCardSchema: ZodType<DisruptionCard> =
  disruptionCardSchema.extend({
    name: z.string(),
  });
export const draftOpponentDisruptionSchema: ZodType<OpponentDisruptionCard> =
  opponentDisruptionCardSchema.extend({
    name: z.string(),
  });
export const draftVsSchema: ZodType<VsSimulationInput> =
  vsSimulationInputSchema.extend({
    opponentDisruptions: z.array(draftOpponentDisruptionSchema),
  });

export const cardsSchema = z.array(draftCardSchema);
export const patternsSchema = z.array(draftPatternSchema);
export const labelsSchema = z.array(draftLabelSchema);
export const disruptionCategoriesSchema = z.array(
  draftDisruptionCategorySchema,
);
export const disruptionCardsSchema = z.array(draftDisruptionCardSchema);
export const subPatternsSchema = z.array(draftSubPatternSchema);
