import { z } from "zod";

export const calculationModeSchema = z.enum(["exact", "simulation"]);

export const countRuleModeSchema = z.enum(["cap1", "raw"]);
export const countOperatorSchema = z.enum(["gte", "eq"]);

export const patternBaseModeSchema = z.enum([
  "required",
  "required_distinct",
  "leave_deck",
  "not_drawn",
]);

export const deckStateSchema = z.object({
  cardCount: z.number().int().min(1).max(120),
  firstHand: z.number().int().min(1).max(20),
});

export const cardSchema = z.object({
  uid: z.string().min(1),
  name: z.string().trim().min(1, "カード名は必須です"),
  count: z.number().int().min(0).max(60),
  memo: z.string(),
});

export const labelSchema = z.object({
  uid: z.string().min(1),
  name: z.string().trim().min(1, "ラベル名は必須です"),
  memo: z.string(),
});

export const countRuleSchema = z.object({
  uids: z.array(z.string().min(1)).min(1),
  mode: countRuleModeSchema,
});

export const baseConditionSchema = z.object({
  mode: patternBaseModeSchema,
  count: z.number().int().min(1).max(60),
  uids: z.array(z.string().min(1)).min(1),
});

export const countConditionSchema = z.object({
  mode: z.enum(["draw_total", "remain_total"]),
  operator: countOperatorSchema,
  threshold: z.number().int().min(0).max(60),
  rules: z.array(countRuleSchema).min(1),
});

export const patternConditionSchema = z.discriminatedUnion("mode", [
  baseConditionSchema,
  countConditionSchema,
]);

export const patternSchema = z.object({
  uid: z.string().min(1),
  name: z.string().trim().min(1, "パターン名は必須です"),
  active: z.boolean(),
  conditions: z.array(patternConditionSchema),
  labels: z.array(z.object({ uid: z.string().min(1) })),
  memo: z.string(),
});

export const potStateSchema = z.object({
  desiresOrExtravagance: z.object({
    count: z.number().int().min(0).max(3),
  }),
  prosperity: z.object({
    count: z.number().int().min(0).max(3),
    cost: z.union([z.literal(3), z.literal(6)]),
  }),
});

export const calculationSettingsSchema = z.object({
  mode: calculationModeSchema,
  simulationTrials: z.number().int().min(100).max(2_000_000),
});

export const calculateInputSchema = z
  .object({
    deck: deckStateSchema,
    cards: z.array(cardSchema),
    patterns: z.array(patternSchema),
    labels: z.array(labelSchema),
    pot: potStateSchema,
    settings: calculationSettingsSchema,
  })
  .superRefine((value, ctx) => {
    if (value.deck.firstHand > value.deck.cardCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deck", "firstHand"],
        message: "firstHand must be less than or equal to cardCount",
      });
    }
  });

export const calculationErrorSchema = z.object({
  type: z.literal("card_count_exceeded"),
  deckSize: z.number().int().min(0),
  totalCards: z.number().int().min(0),
  excess: z.number().int().min(0),
});

export const successRateEntrySchema = z.object({
  uid: z.string().min(1),
  rate: z.string(),
});

export const calculateOutputSchema = z.object({
  overallProbability: z.string(),
  patternSuccessRates: z.array(successRateEntrySchema),
  labelSuccessRates: z.array(successRateEntrySchema),
  mode: calculationModeSchema,
  error: calculationErrorSchema.optional(),
});

export const shortenUrlRequestSchema = z.object({
  url: z.string().url(),
});

export const shortenUrlResponseSchema = z.object({
  shortenUrl: z.string().url(),
});

export type CalculationMode = z.infer<typeof calculationModeSchema>;
export type CountRuleMode = z.infer<typeof countRuleModeSchema>;
export type CountOperator = z.infer<typeof countOperatorSchema>;
export type DeckState = z.infer<typeof deckStateSchema>;
export type Card = z.infer<typeof cardSchema>;
export type Label = z.infer<typeof labelSchema>;
export type CountRule = z.infer<typeof countRuleSchema>;
export type BaseCondition = z.infer<typeof baseConditionSchema>;
export type CountCondition = z.infer<typeof countConditionSchema>;
export type PatternCondition = z.infer<typeof patternConditionSchema>;
export type Pattern = z.infer<typeof patternSchema>;
export type PotState = z.infer<typeof potStateSchema>;
export type CalculationSettings = z.infer<typeof calculationSettingsSchema>;
export type CalculateInput = z.infer<typeof calculateInputSchema>;
export type CalculationError = z.infer<typeof calculationErrorSchema>;
export type SuccessRateEntry = z.infer<typeof successRateEntrySchema>;
export type CalculateOutput = z.infer<typeof calculateOutputSchema>;
export type ShortenUrlRequest = z.infer<typeof shortenUrlRequestSchema>;
export type ShortenUrlResponse = z.infer<typeof shortenUrlResponseSchema>;
