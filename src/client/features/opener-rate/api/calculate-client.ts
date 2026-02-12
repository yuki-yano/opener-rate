import { calculateOpenerRateDomain } from "../../../domain/opener-rate";
import type {
  CalculateInput,
  CalculateOutput,
} from "../../../../shared/apiSchemas";

export type CalculateClient = {
  calculate(input: CalculateInput): Promise<CalculateOutput>;
};

export const localCalculateClient: CalculateClient = {
  async calculate(input: CalculateInput): Promise<CalculateOutput> {
    return calculateOpenerRateDomain(input);
  },
};
