import { describe, expect, it } from "vitest";

import { defaultVsState, draftCardSchema, draftVsSchema } from "./state-schema";

describe("state-schema", () => {
  it("provides default vs simulation state", () => {
    expect(defaultVsState).toEqual({
      enabled: false,
      opponentDeckSize: 40,
      opponentHandSize: 5,
      opponentDisruptions: [],
    });
  });

  it("accepts draft card with empty name", () => {
    const parsed = draftCardSchema.safeParse({
      uid: "card-1",
      name: "",
      count: 1,
      memo: "",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts draft vs opponent disruptions with empty name", () => {
    const parsed = draftVsSchema.safeParse({
      enabled: true,
      opponentDeckSize: 40,
      opponentHandSize: 5,
      opponentDisruptions: [
        {
          uid: "op-1",
          name: "",
          count: 1,
          oncePerName: true,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });
});
