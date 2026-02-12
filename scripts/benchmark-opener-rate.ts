import { performance } from "node:perf_hooks";
import process from "node:process";

import type {
  CalculateInput,
  CalculateOutput,
} from "../src/shared/apiSchemas.ts";
import { calculateOpenerRateDomain } from "../src/client/domain/opener-rate/calculate.ts";
import { calculateByExact } from "../src/client/domain/opener-rate/calculate-exact.ts";
import { calculateBySimulation } from "../src/client/domain/opener-rate/calculate-simulation.ts";
import { compilePatterns } from "../src/client/domain/opener-rate/compile-conditions.ts";
import { compileSubPatterns } from "../src/client/domain/opener-rate/compile-sub-patterns.ts";
import { normalizeCalculateInput } from "../src/client/domain/opener-rate/normalize.ts";

type BenchOptions = {
  iterations: number;
  warmup: number;
  simTrials: number;
};

type BenchResult = {
  name: string;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  minMs: number;
  maxMs: number;
};

type PreparedInput = {
  normalized: NonNullable<ReturnType<typeof normalizeCalculateInput>["value"]>;
  compiledPatterns: ReturnType<typeof compilePatterns>;
  compiledSubPatterns: ReturnType<typeof compileSubPatterns>;
};

const readPositiveIntOption = (
  args: string[],
  key: string,
  fallback: number,
) => {
  const prefix = `--${key}=`;
  const option = args.find((arg) => arg.startsWith(prefix));
  if (option == null) return fallback;

  const valueText = option.slice(prefix.length);
  const value = Number.parseInt(valueText, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid option: --${key}=${valueText}`);
  }
  return value;
};

const parseOptions = (args: string[]): BenchOptions => ({
  iterations: readPositiveIntOption(args, "iterations", 10),
  warmup: readPositiveIntOption(args, "warmup", 2),
  simTrials: readPositiveIntOption(args, "sim-trials", 20_000),
});

const percentile = (sortedValues: number[], ratio: number) => {
  if (sortedValues.length === 0) return 0;
  const rawIndex = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * ratio) - 1),
  );
  return sortedValues[rawIndex] ?? 0;
};

const roundMs = (value: number) => Number.parseFloat(value.toFixed(3));

const runBench = (
  name: string,
  task: () => CalculateOutput | void,
  options: BenchOptions,
): BenchResult => {
  for (let i = 0; i < options.warmup; i += 1) {
    task();
  }

  const samples: number[] = [];
  for (let i = 0; i < options.iterations; i += 1) {
    const start = performance.now();
    task();
    samples.push(performance.now() - start);
  }

  const sorted = [...samples].sort((left, right) => left - right);
  const total = samples.reduce((sum, value) => sum + value, 0);
  const mean = total / samples.length;

  return {
    name,
    meanMs: roundMs(mean),
    p50Ms: roundMs(percentile(sorted, 0.5)),
    p95Ms: roundMs(percentile(sorted, 0.95)),
    minMs: roundMs(sorted[0] ?? 0),
    maxMs: roundMs(sorted[sorted.length - 1] ?? 0),
  };
};

const prepareInput = (input: CalculateInput): PreparedInput => {
  const normalized = normalizeCalculateInput(input);
  if (!normalized.ok) {
    throw new Error(
      `normalize failed: deckSize=${normalized.error.deckSize}, totalCards=${normalized.error.totalCards}`,
    );
  }

  return {
    normalized: normalized.value,
    compiledPatterns: compilePatterns(normalized.value),
    compiledSubPatterns: compileSubPatterns(normalized.value),
  };
};

const createBaseCards = () =>
  Array.from({ length: 20 }, (_, index) => ({
    uid: `c${String(index + 1).padStart(2, "0")}`,
    name: `Card ${index + 1}`,
    count: 2,
    memo: "",
  }));

const createBaseLabels = () =>
  Array.from({ length: 6 }, (_, index) => ({
    uid: `l-${index + 1}`,
    name: `Label ${index + 1}`,
    memo: "",
  }));

const createBasePatterns = (uids: string[]) =>
  Array.from({ length: 12 }, (_, index) => {
    const a = uids[index % uids.length] ?? uids[0];
    const b = uids[(index + 1) % uids.length] ?? uids[0];
    const c = uids[(index + 2) % uids.length] ?? uids[0];
    const d = uids[(index + 3) % uids.length] ?? uids[0];
    const e = uids[(index + 4) % uids.length] ?? uids[0];
    const f = uids[(index + 5) % uids.length] ?? uids[0];
    const conditions: CalculateInput["patterns"][number]["conditions"] = [
      { mode: "required", count: 1, uids: [a, b, c] },
      { mode: "required_distinct", count: 1, uids: [d, e] },
      {
        mode: "draw_total",
        operator: "gte",
        threshold: 2,
        rules: [
          { uids: [a, b], mode: "cap1" },
          { uids: [c, d, e], mode: "cap1" },
        ],
      },
    ];
    if (index % 2 === 0) {
      conditions.push({ mode: "leave_deck", count: 1, uids: [f, a] });
    }

    return {
      uid: `p-${index + 1}`,
      name: `Pattern ${index + 1}`,
      active: true,
      excludeFromOverall: index % 6 === 0,
      conditions,
      labels: [{ uid: `l-${(index % 4) + 1}` }],
      effects:
        index % 3 === 0
          ? [
              {
                type: "add_penetration",
                disruptionCategoryUids: ["cat-negate"],
                amount: 1,
              },
            ]
          : [],
      memo: "",
    } satisfies CalculateInput["patterns"][number];
  });

const createBaseSubPatterns = (uids: string[]) =>
  [
    {
      uid: "sp-1",
      name: "Sub Pattern 1",
      active: true,
      basePatternUids: ["p-1", "p-2"],
      triggerConditions: [
        { mode: "required", count: 1, uids: [uids[0] ?? "c01"] },
      ],
      triggerSourceUids: [uids[0] ?? "c01"],
      applyLimit: "once_per_distinct_uid",
      effects: [{ type: "add_label", labelUids: ["l-5"] }],
      memo: "",
    },
    {
      uid: "sp-2",
      name: "Sub Pattern 2",
      active: true,
      basePatternUids: ["p-3", "p-4", "p-5"],
      triggerConditions: [
        {
          mode: "draw_total",
          operator: "gte",
          threshold: 1,
          rules: [{ uids: [uids[5] ?? "c06", uids[6] ?? "c07"], mode: "cap1" }],
        },
      ],
      triggerSourceUids: [],
      applyLimit: "once_per_trial",
      effects: [
        {
          type: "add_penetration",
          disruptionCategoryUids: ["cat-banish"],
          amount: 1,
        },
      ],
      memo: "",
    },
    {
      uid: "sp-3",
      name: "Sub Pattern 3",
      active: true,
      basePatternUids: ["p-6", "p-7"],
      triggerConditions: [
        {
          mode: "base_match_total",
          operator: "gte",
          threshold: 1,
          rules: [{ uids: [uids[7] ?? "c08", uids[8] ?? "c09"], mode: "raw" }],
        },
      ],
      triggerSourceUids: [],
      applyLimit: "once_per_trial",
      effects: [{ type: "add_label", labelUids: ["l-6"] }],
      memo: "",
    },
  ] satisfies CalculateInput["subPatterns"];

const createExactInput = (): CalculateInput => {
  const cards = createBaseCards();
  const uids = cards.map((card) => card.uid);

  return {
    deck: { cardCount: 40, firstHand: 5 },
    cards,
    patterns: createBasePatterns(uids),
    subPatterns: createBaseSubPatterns(uids),
    labels: createBaseLabels(),
    pot: {
      desiresOrExtravagance: { count: 0 },
      prosperity: { count: 0, cost: 6 },
    },
    settings: {
      mode: "exact",
      simulationTrials: 10_000,
    },
  };
};

const createSimulationInput = (simTrials: number): CalculateInput => {
  const cards = createBaseCards();
  const uids = cards.map((card) => card.uid);

  return {
    deck: { cardCount: 42, firstHand: 5 },
    cards,
    patterns: createBasePatterns(uids),
    subPatterns: createBaseSubPatterns(uids),
    labels: createBaseLabels(),
    pot: {
      desiresOrExtravagance: { count: 1 },
      prosperity: { count: 1, cost: 6 },
    },
    settings: {
      mode: "simulation",
      simulationTrials: simTrials,
    },
    vs: {
      enabled: true,
      opponentDeckSize: 40,
      opponentHandSize: 5,
      opponentDisruptions: [
        {
          uid: "od-1",
          disruptionCategoryUid: "cat-negate",
          name: "Negate A",
          count: 3,
          oncePerName: true,
        },
        {
          uid: "od-2",
          disruptionCategoryUid: "cat-negate",
          name: "Negate B",
          count: 2,
          oncePerName: true,
        },
        {
          uid: "od-3",
          disruptionCategoryUid: "cat-banish",
          name: "Banish",
          count: 2,
          oncePerName: false,
        },
      ],
    },
  };
};

const createSimulationPlainInput = (simTrials: number): CalculateInput => {
  const cards = createBaseCards();
  const uids = cards.map((card) => card.uid);

  return {
    deck: { cardCount: 40, firstHand: 5 },
    cards,
    patterns: createBasePatterns(uids),
    subPatterns: createBaseSubPatterns(uids),
    labels: createBaseLabels(),
    pot: {
      desiresOrExtravagance: { count: 0 },
      prosperity: { count: 0, cost: 6 },
    },
    settings: {
      mode: "simulation",
      simulationTrials: simTrials,
    },
  };
};

const printHelp = () => {
  console.log(
    [
      "Usage: pnpm run bench:opener-rate -- [options]",
      "",
      "Options:",
      "  --iterations=<n>   benchmark iterations per task (default: 10)",
      "  --warmup=<n>       warmup iterations per task (default: 2)",
      "  --sim-trials=<n>   trials for simulation benchmark (default: 20000)",
    ].join("\n"),
  );
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseOptions(args);
  const exactInput = createExactInput();
  const simulationPlainInput = createSimulationPlainInput(options.simTrials);
  const simulationInput = createSimulationInput(options.simTrials);
  const exactPrepared = prepareInput(exactInput);
  const simulationPlainPrepared = prepareInput(simulationPlainInput);
  const simulationPrepared = prepareInput(simulationInput);

  let sink = "";
  const consume = (output: CalculateOutput) => {
    sink = output.overallProbability;
  };

  const results: BenchResult[] = [
    runBench(
      "exact.compile-only",
      () => {
        prepareInput(exactInput);
      },
      options,
    ),
    runBench(
      "exact.domain-full",
      () => {
        consume(calculateOpenerRateDomain(exactInput));
      },
      options,
    ),
    runBench(
      "exact.precompiled",
      () => {
        consume(
          calculateByExact({
            normalized: exactPrepared.normalized,
            compiledPatterns: exactPrepared.compiledPatterns,
            compiledSubPatterns: exactPrepared.compiledSubPatterns,
          }),
        );
      },
      options,
    ),
    runBench(
      "simulation-plain.domain-full",
      () => {
        consume(calculateOpenerRateDomain(simulationPlainInput));
      },
      options,
    ),
    runBench(
      "simulation-plain.precompiled",
      () => {
        consume(
          calculateBySimulation({
            normalized: simulationPlainPrepared.normalized,
            compiledPatterns: simulationPlainPrepared.compiledPatterns,
            compiledSubPatterns: simulationPlainPrepared.compiledSubPatterns,
            trials: options.simTrials,
            mode: "simulation",
          }),
        );
      },
      options,
    ),
    runBench(
      "simulation.compile-only",
      () => {
        prepareInput(simulationInput);
      },
      options,
    ),
    runBench(
      "simulation-pot-vs.domain-full",
      () => {
        consume(calculateOpenerRateDomain(simulationInput));
      },
      options,
    ),
    runBench(
      "simulation-pot-vs.precompiled",
      () => {
        consume(
          calculateBySimulation({
            normalized: simulationPrepared.normalized,
            compiledPatterns: simulationPrepared.compiledPatterns,
            compiledSubPatterns: simulationPrepared.compiledSubPatterns,
            trials: options.simTrials,
            mode: "simulation",
          }),
        );
      },
      options,
    ),
  ];

  const rows = results.map((result) => ({
    task: result.name,
    meanMs: result.meanMs,
    p50Ms: result.p50Ms,
    p95Ms: result.p95Ms,
    minMs: result.minMs,
    maxMs: result.maxMs,
  }));

  console.log("opener-rate benchmark");
  console.log(
    `iterations=${options.iterations}, warmup=${options.warmup}, simTrials=${options.simTrials}`,
  );
  console.table(rows);

  if (sink === "__never__") {
    console.log("unreachable");
  }
};

main();
