import { describe, expect, it } from "vitest";

import {
  createCalculateInput,
  createSimulationSettings,
  defaultExactSettings,
  defaultPotState,
} from "./test-fixtures";

describe("calculate test fixtures", () => {
  it("fills default pot/settings", () => {
    const input = createCalculateInput({
      deck: { cardCount: 1, firstHand: 1 },
      cards: [],
      patterns: [],
      subPatterns: [],
      labels: [],
    });

    expect(input.pot).toEqual(defaultPotState);
    expect(input.settings).toEqual(defaultExactSettings);
  });

  it("respects provided pot/settings", () => {
    const input = createCalculateInput({
      deck: { cardCount: 1, firstHand: 1 },
      cards: [],
      patterns: [],
      subPatterns: [],
      labels: [],
      pot: {
        desiresOrExtravagance: { count: 1 },
        prosperity: { count: 1, cost: 3 },
      },
      settings: createSimulationSettings(1234),
    });

    expect(input.pot).toEqual({
      desiresOrExtravagance: { count: 1 },
      prosperity: { count: 1, cost: 3 },
    });
    expect(input.settings).toEqual({
      mode: "simulation",
      simulationTrials: 1234,
    });
  });
});
