import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { ThinkingLevel } from "../../../../../shared/apiSchemas";
import { DEFAULT_SYSTEM_PROMPT } from "../const";

export type AiProvider = "google";

export const isChatOpenAtom = atom(false);

export const aiProviderAtom = atomWithStorage<AiProvider>(
  "opener-rate.aiProvider",
  "google",
);

export const thinkingLevelAtom = atomWithStorage<ThinkingLevel>(
  "opener-rate.aiThinkingLevel",
  "low",
);

export const systemPromptAtom = atomWithStorage<string>(
  "opener-rate.aiSystemPrompt",
  DEFAULT_SYSTEM_PROMPT,
);
