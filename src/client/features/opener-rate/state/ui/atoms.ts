import { atom } from "jotai";

import type {
  CalculateInput,
  CalculateOutput,
} from "../../../../../shared/apiSchemas";

export const isCalculatingAtom = atom(false);
export const calculationResultAtom = atom<CalculateOutput | null>(null);
export const previousCalculationResultAtom = atom<CalculateOutput | null>(null);
export const transportErrorAtom = atom<string | null>(null);

export const savedInputAtom = atom<CalculateInput | null>(null);

export const isSectionCollapsedAtom = atom<Record<string, boolean>>({});

export const shortUrlInputAtom = atom("");
export const shortUrlResultAtom = atom<string | null>(null);
export const shortUrlLoadingAtom = atom(false);
export const shortUrlErrorAtom = atom<string | null>(null);
export const shortUrlCacheAtom = atom<Record<string, string>>({});
export const shortUrlLockedUntilChangeAtom = atom(false);
