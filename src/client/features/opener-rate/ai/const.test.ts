import { describe, expect, it } from "vitest";

import {
  buildDefaultSystemPrompt,
  CHAT_STATE_MARKER,
  DEFAULT_SYSTEM_PROMPT,
} from "./const";

describe("ai const", () => {
  it("buildDefaultSystemPrompt generates default prompt", () => {
    expect(buildDefaultSystemPrompt()).toBe(DEFAULT_SYSTEM_PROMPT);
  });

  it("keeps required review and approval instructions", () => {
    expect(DEFAULT_SYSTEM_PROMPT).toContain("# 返答フロー（必須: 2段階）");
    expect(DEFAULT_SYSTEM_PROMPT).toContain(
      "最後に「この内容で反映してよいですか？」と確認する",
    );
    expect(DEFAULT_SYSTEM_PROMPT).toContain(
      "ユーザーが明示的に承認した場合のみJSONを返す",
    );
  });

  it("keeps required top-level key constraints", () => {
    expect(DEFAULT_SYSTEM_PROMPT).toContain(
      "少なくとも必須トップレベルは必ず含める",
    );
    expect(DEFAULT_SYSTEM_PROMPT).toContain(
      "deck, cards, patterns, subPatterns, labels, disruptionCategories, disruptionCards, pot, vs, mode, simulationTrials",
    );
    expect(DEFAULT_SYSTEM_PROMPT).toContain(
      "simulationTrials: 1000 | 10000 | 100000 | 1000000",
    );
    expect(DEFAULT_SYSTEM_PROMPT).toContain("JSONとして単体で parse 可能");
  });

  it("keeps required semantic interpretation rules", () => {
    expect(DEFAULT_SYSTEM_PROMPT).toContain("# 意味ルール（解釈の必須前提）");
    expect(DEFAULT_SYSTEM_PROMPT).toContain(
      "excludeFromOverall === true のパターンは、overall 判定および countable な成功数の集計対象から除外する",
    );
    expect(DEFAULT_SYSTEM_PROMPT).toContain(
      "basePatternUids が空配列の場合は、「いずれかの base pattern が1つでも成立しているとき」に適用候補になる",
    );
    expect(DEFAULT_SYSTEM_PROMPT).toContain(
      "mode が `exact` でも、pot（desires / prosperity）を使う場合または vs.enabled が true の場合はシミュレーション計算になる",
    );
  });

  it("uses current state marker", () => {
    expect(CHAT_STATE_MARKER).toBe("\n\n--- Current State ---");
    expect(DEFAULT_SYSTEM_PROMPT).toContain("`--- Current State ---`");
  });
});
