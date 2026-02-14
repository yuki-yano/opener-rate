import { describe, expect, it } from "vitest";

import { canSatisfyPenetrationRequirements } from "./penetration-allocation";
import type { PenetrationEffect } from "./types";

describe("canSatisfyPenetrationRequirements", () => {
  it("treats multi-category penetration amount as a shared pool", () => {
    const penetrationEffects: PenetrationEffect[] = [
      {
        disruptionCategoryUids: ["cat-ash", "cat-veiler"],
        amount: 1,
      },
    ];

    const canPenetrateBoth = canSatisfyPenetrationRequirements({
      penetrationEffects,
      requiredPenetrationByDisruptionKey: {
        "cat-ash": 1,
        "cat-veiler": 1,
      },
    });

    expect(canPenetrateBoth).toBe(false);
  });

  it("can allocate shared penetration to either category", () => {
    const penetrationEffects: PenetrationEffect[] = [
      {
        disruptionCategoryUids: ["cat-ash", "cat-veiler"],
        amount: 1,
      },
    ];

    expect(
      canSatisfyPenetrationRequirements({
        penetrationEffects,
        requiredPenetrationByDisruptionKey: {
          "cat-ash": 1,
        },
      }),
    ).toBe(true);
    expect(
      canSatisfyPenetrationRequirements({
        penetrationEffects,
        requiredPenetrationByDisruptionKey: {
          "cat-veiler": 1,
        },
      }),
    ).toBe(true);
  });

  it("finds feasible allocation even when greedy assignment would fail", () => {
    const penetrationEffects: PenetrationEffect[] = [
      {
        disruptionCategoryUids: ["cat-ash", "cat-veiler"],
        amount: 1,
      },
      {
        disruptionCategoryUids: ["cat-ash"],
        amount: 1,
      },
    ];

    const canPenetrate = canSatisfyPenetrationRequirements({
      penetrationEffects,
      requiredPenetrationByDisruptionKey: {
        "cat-ash": 1,
        "cat-veiler": 1,
      },
    });

    expect(canPenetrate).toBe(true);
  });

  it("treats effects with the same poolId as one shared resource", () => {
    const independentEffects: PenetrationEffect[] = [
      {
        disruptionCategoryUids: ["cat-ash"],
        amount: 1,
      },
      {
        disruptionCategoryUids: ["cat-veiler"],
        amount: 1,
      },
    ];
    const pooledEffects: PenetrationEffect[] = [
      {
        disruptionCategoryUids: ["cat-ash"],
        amount: 1,
        poolId: "ice_route",
      },
      {
        disruptionCategoryUids: ["cat-veiler"],
        amount: 1,
        poolId: "ice_route",
      },
    ];

    expect(
      canSatisfyPenetrationRequirements({
        penetrationEffects: independentEffects,
        requiredPenetrationByDisruptionKey: {
          "cat-ash": 1,
          "cat-veiler": 1,
        },
      }),
    ).toBe(true);
    expect(
      canSatisfyPenetrationRequirements({
        penetrationEffects: pooledEffects,
        requiredPenetrationByDisruptionKey: {
          "cat-ash": 1,
          "cat-veiler": 1,
        },
      }),
    ).toBe(false);
  });
});
