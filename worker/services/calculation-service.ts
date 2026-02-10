import { calculateOpenerRateDomain } from "../../src/domain/opener-rate";
import type {
  CalculateInput,
  CalculateOutput,
} from "../../src/shared/apiSchemas";

export const calculateOpenerRate = (input: CalculateInput): CalculateOutput =>
  calculateOpenerRateDomain(input);
