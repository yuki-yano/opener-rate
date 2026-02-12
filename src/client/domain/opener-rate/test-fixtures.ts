import type { CalculateInput } from "../../../shared/apiSchemas";

export const defaultPotState: CalculateInput["pot"] = {
  desiresOrExtravagance: { count: 0 },
  prosperity: { count: 0, cost: 6 },
};

export const defaultExactSettings: CalculateInput["settings"] = {
  mode: "exact",
  simulationTrials: 10000,
};

export const createSimulationSettings = (
  simulationTrials = 1000,
): CalculateInput["settings"] => ({
  mode: "simulation",
  simulationTrials,
});

type CalculateInputFixtureParams = Omit<CalculateInput, "pot" | "settings"> & {
  pot?: CalculateInput["pot"];
  settings?: CalculateInput["settings"];
};

export const createCalculateInput = (
  params: CalculateInputFixtureParams,
): CalculateInput => ({
  ...params,
  pot: params.pot ?? { ...defaultPotState },
  settings: params.settings ?? { ...defaultExactSettings },
});
