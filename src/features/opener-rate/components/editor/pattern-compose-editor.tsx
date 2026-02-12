import { FlaskConical } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  RadioCardGroup,
  Select,
} from "../../../../components/ui";
import type { SubPatternTriggerCondition } from "../../../../shared/apiSchemas";
import type { MultiSelectOption } from "../common/multi-select";
import { MultiSelect } from "../common/multi-select";
import {
  cardsAtom,
  disruptionCategoriesAtom,
  labelsAtom,
  patternsAtom,
  subPatternsAtom,
} from "../../state";
import { createLocalId } from "./create-local-id";
import { PatternConditionEditor } from "./pattern-condition-editor";
import {
  buildComposedSubPattern,
  type ManualPenetrationAmountByCategory,
  resolveComposeEntries,
  type ComposeSource,
} from "./pattern-compose";

const createDefaultSubPatternName = (index: number) =>
  `サブパターン${index + 1}`;
const createDefaultPatternName = (index: number) => `パターン${index + 1}`;
const createDefaultCondition = (): SubPatternTriggerCondition => ({
  mode: "required",
  count: 1,
  uids: [],
});
const filterInputModeOptions = [
  { value: "existing", label: "既存から選ぶ" },
  { value: "inline", label: "その場で作る" },
] as const;
const dedupe = (values: string[]) => Array.from(new Set(values));
const toInt = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

export const PatternComposeDialogTrigger = () => {
  const patterns = useAtomValue(patternsAtom);
  const [subPatterns, setSubPatterns] = useAtom(subPatternsAtom);
  const cards = useAtomValue(cardsAtom);
  const disruptionCategories = useAtomValue(disruptionCategoriesAtom);
  const labels = useAtomValue(labelsAtom);

  const [filterInputMode, setFilterInputMode] = useState<"existing" | "inline">(
    "existing",
  );
  const [composeMainSourceUid, setComposeMainSourceUid] = useState("");
  const [composeFilterSourceUid, setComposeFilterSourceUid] = useState("");
  const [inlineFilterConditions, setInlineFilterConditions] = useState<
    SubPatternTriggerCondition[]
  >([createDefaultCondition()]);
  const [inlineFilterTriggerSourceUids, setInlineFilterTriggerSourceUids] =
    useState<string[]>([]);
  const [composeCategoryUids, setComposeCategoryUids] = useState<string[]>([]);
  const [composeManualPenetrationAmount, setComposeManualPenetrationAmount] =
    useState(0);
  const [composeLabelUids, setComposeLabelUids] = useState<string[]>([]);
  const [composeName, setComposeName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const resetComposeForm = () => {
    setFilterInputMode("existing");
    setComposeMainSourceUid("");
    setComposeFilterSourceUid("");
    setInlineFilterConditions([createDefaultCondition()]);
    setInlineFilterTriggerSourceUids([]);
    setComposeCategoryUids([]);
    setComposeManualPenetrationAmount(0);
    setComposeLabelUids([]);
    setComposeName("");
  };
  const handleDialogOpenChange = (nextOpen: boolean) => {
    setIsDialogOpen(nextOpen);
    resetComposeForm();
  };

  const penetrationCategoryOptions = useMemo<MultiSelectOption[]>(
    () =>
      disruptionCategories
        .filter((category) => category.name.trim().length > 0)
        .map((category) => ({
          value: category.uid,
          label: category.name,
        })),
    [disruptionCategories],
  );
  const labelOptions = useMemo<MultiSelectOption[]>(
    () =>
      labels
        .filter((label) => label.name.trim().length > 0)
        .map((label) => ({
          value: label.uid,
          label: label.name,
        })),
    [labels],
  );
  const cardOptions = useMemo<MultiSelectOption[]>(
    () =>
      cards
        .filter((card) => card.name.trim().length > 0)
        .map((card) => ({
          value: card.uid,
          label: card.name,
        })),
    [cards],
  );
  const composeSources = useMemo<ComposeSource[]>(() => {
    const fromPatterns = patterns.map((pattern, index) => ({
      value: `pattern:${pattern.uid}`,
      label: `メイン: ${pattern.name.trim() || createDefaultPatternName(index)}`,
      conditions: pattern.conditions,
      basePatternUids: [pattern.uid],
      triggerSourceUids: [],
      effects: pattern.effects ?? [],
    }));
    const fromSubPatterns = subPatterns.map((subPattern, index) => ({
      value: `sub_pattern:${subPattern.uid}`,
      label: `サブ: ${subPattern.name.trim() || createDefaultSubPatternName(index)}`,
      conditions: subPattern.triggerConditions,
      basePatternUids: subPattern.basePatternUids,
      triggerSourceUids: subPattern.triggerSourceUids,
      effects: subPattern.effects,
    }));
    return [...fromPatterns, ...fromSubPatterns];
  }, [patterns, subPatterns]);
  const composeSourceOptions = useMemo<MultiSelectOption[]>(
    () =>
      composeSources.map((source) => ({
        value: source.value,
        label: source.label,
      })),
    [composeSources],
  );
  const composeSourceByValue = useMemo(
    () => new Map(composeSources.map((source) => [source.value, source])),
    [composeSources],
  );
  const availableComposeSourceUids = useMemo(
    () => new Set(composeSourceOptions.map((option) => option.value)),
    [composeSourceOptions],
  );
  const availableComposeCategoryUids = useMemo(
    () => new Set(penetrationCategoryOptions.map((option) => option.value)),
    [penetrationCategoryOptions],
  );
  const availableCardUids = useMemo(
    () => new Set(cardOptions.map((option) => option.value)),
    [cardOptions],
  );
  const availableComposeLabelUids = useMemo(
    () => new Set(labelOptions.map((option) => option.value)),
    [labelOptions],
  );

  const effectiveComposeMainSourceUid = availableComposeSourceUids.has(
    composeMainSourceUid,
  )
    ? composeMainSourceUid
    : "";
  const effectiveComposeFilterSourceUid = availableComposeSourceUids.has(
    composeFilterSourceUid,
  )
    ? composeFilterSourceUid
    : "";
  const selectedComposeCategoryUids = dedupe(composeCategoryUids).filter(
    (uid) => availableComposeCategoryUids.has(uid),
  );
  const selectedComposeLabelUids = dedupe(composeLabelUids).filter((uid) =>
    availableComposeLabelUids.has(uid),
  );
  const selectedInlineFilterTriggerSourceUids = dedupe(
    inlineFilterTriggerSourceUids,
  ).filter((uid) => availableCardUids.has(uid));
  const effectiveManualPenetrationAmount = Math.max(
    0,
    Math.min(20, composeManualPenetrationAmount),
  );
  const manualPenetrationAmountByCategory =
    useMemo<ManualPenetrationAmountByCategory>(() => {
      if (effectiveManualPenetrationAmount <= 0) return {};
      return Object.fromEntries(
        selectedComposeCategoryUids.map((uid) => [
          uid,
          effectiveManualPenetrationAmount,
        ]),
      );
    }, [effectiveManualPenetrationAmount, selectedComposeCategoryUids]);

  const canSelectComposeSources = composeSourceOptions.length >= 2;
  const canSelectMainSource = composeSourceOptions.length >= 1;
  const canSelectComposeCategory = penetrationCategoryOptions.length > 0;
  const isComposeLocked = !canSelectMainSource || !canSelectComposeCategory;
  const selectedMainComposeSource = composeSourceByValue.get(
    effectiveComposeMainSourceUid,
  );
  const selectedFilterComposeSource =
    filterInputMode === "existing"
      ? composeSourceByValue.get(effectiveComposeFilterSourceUid)
      : null;
  const inlineFilterSource: ComposeSource | null =
    filterInputMode === "inline"
      ? {
          value: "inline_filter",
          label: "手動フィルタ",
          conditions: inlineFilterConditions,
          basePatternUids: [],
          triggerSourceUids: selectedInlineFilterTriggerSourceUids,
          effects: [],
        }
      : null;
  const effectiveFilterSource =
    filterInputMode === "existing"
      ? selectedFilterComposeSource
      : inlineFilterSource;
  const hasComposeSourceSelection =
    effectiveComposeMainSourceUid.length > 0 &&
    selectedMainComposeSource != null &&
    (filterInputMode === "existing"
      ? effectiveComposeFilterSourceUid.length > 0 &&
        effectiveComposeMainSourceUid !== effectiveComposeFilterSourceUid &&
        selectedFilterComposeSource != null
      : inlineFilterConditions.length > 0);
  const composeEffectiveEntries =
    hasComposeSourceSelection &&
    selectedMainComposeSource &&
    effectiveFilterSource
      ? resolveComposeEntries(
          selectedMainComposeSource,
          effectiveFilterSource,
          selectedComposeCategoryUids,
          manualPenetrationAmountByCategory,
        )
      : [];
  const hasComposePenetrationTarget = composeEffectiveEntries.length > 0;
  const hasComposeSkippedCategories =
    selectedComposeCategoryUids.length > composeEffectiveEntries.length;
  const canRunCompose =
    !isComposeLocked &&
    hasComposeSourceSelection &&
    selectedComposeCategoryUids.length > 0 &&
    composeName.trim().length > 0 &&
    hasComposePenetrationTarget;

  const handleCompose = () => {
    if (effectiveComposeMainSourceUid.length === 0) {
      return;
    }
    if (
      filterInputMode === "existing" &&
      effectiveComposeMainSourceUid === effectiveComposeFilterSourceUid
    ) {
      return;
    }
    if (filterInputMode === "inline" && inlineFilterConditions.length === 0) {
      return;
    }
    if (selectedComposeCategoryUids.length === 0) return;
    const mainSource = composeSourceByValue.get(effectiveComposeMainSourceUid);
    const filterSource =
      filterInputMode === "existing"
        ? composeSourceByValue.get(effectiveComposeFilterSourceUid)
        : inlineFilterSource;
    if (mainSource == null || filterSource == null) return;

    const nextSubPattern = buildComposedSubPattern({
      uid: createLocalId("sub_pattern"),
      name: composeName,
      mainSource,
      filterSource,
      selectedCategoryUids: selectedComposeCategoryUids,
      selectedLabelUids: selectedComposeLabelUids,
      manualPenetrationAmountByCategory,
    });
    if (nextSubPattern == null) return;

    setSubPatterns((current) => [...current, nextSubPattern]);
    setIsDialogOpen(false);
    resetComposeForm();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <Button
        type="button"
        variant="outline"
        className="h-8 px-3 text-xs"
        onClick={() => handleDialogOpenChange(true)}
      >
        <FlaskConical className="mr-1.5 h-3.5 w-3.5 text-ui-blue" />
        合成
      </Button>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain p-4 sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>貫通合成ジェネレーター</DialogTitle>
          <DialogDescription>
            1つ目をメイン、2つ目をフィルタとして評価するサブパターンを生成します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-md border border-ui-surface0 bg-ui-crust p-3.5">
          <div className="space-y-0.5">
            {isComposeLocked ? (
              <p className="text-[11px] text-ui-overlay1">
                利用条件: 合成元1件以上 + 妨害カテゴリ1件以上
              </p>
            ) : null}
            {!isComposeLocked &&
            filterInputMode === "inline" &&
            inlineFilterConditions.length === 0 ? (
              <p className="text-[11px] text-ui-overlay1">
                手動フィルタでは条件を1件以上設定してください。
              </p>
            ) : null}
            {!isComposeLocked &&
            hasComposeSourceSelection &&
            selectedComposeCategoryUids.length > 0 &&
            !hasComposePenetrationTarget ? (
              <p className="text-[11px] text-ui-overlay1">
                選択中の妨害カテゴリでは、メイン/フィルタ合算の貫通効果がありません。
              </p>
            ) : null}
            {!isComposeLocked &&
            hasComposeSourceSelection &&
            hasComposePenetrationTarget &&
            hasComposeSkippedCategories ? (
              <p className="text-[11px] text-ui-overlay1">
                一部妨害カテゴリは加算効果がないため、生成対象から除外されます。
              </p>
            ) : null}
            {!isComposeLocked && composeName.trim().length === 0 ? (
              <p className="text-[11px] text-ui-overlay1">
                生成サブパターン名は必須です。
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="space-y-1 text-[11px] text-ui-subtext0">
              フィルタ入力方法
              <RadioCardGroup
                name="compose-filter-input-mode"
                value={filterInputMode}
                options={filterInputModeOptions}
                disabled={!canSelectMainSource}
                onChange={setFilterInputMode}
              />
            </label>
            <label className="space-y-1 text-[11px] text-ui-subtext0">
              メイン元（1つ目）
              <Select
                ariaLabel="メイン元"
                disabled={!canSelectMainSource}
                triggerClassName="h-9"
                value={effectiveComposeMainSourceUid}
                options={composeSourceOptions}
                onChange={setComposeMainSourceUid}
                placeholder="メイン/サブを選択"
              />
            </label>
            {filterInputMode === "existing" ? (
              <label className="space-y-1 text-[11px] text-ui-subtext0">
                フィルタ元（2つ目）
                <Select
                  ariaLabel="フィルタ元"
                  disabled={!canSelectComposeSources}
                  triggerClassName="h-9"
                  value={effectiveComposeFilterSourceUid}
                  options={composeSourceOptions}
                  onChange={setComposeFilterSourceUid}
                  placeholder="メイン/サブを選択"
                />
              </label>
            ) : (
              <label className="space-y-1 text-[11px] text-ui-subtext0">
                フィルタ対象カード（任意）
                <MultiSelect
                  options={cardOptions}
                  value={selectedInlineFilterTriggerSourceUids}
                  onChange={setInlineFilterTriggerSourceUids}
                  placeholder="対象カードを選択"
                  emptyText="有効なカードがありません"
                />
              </label>
            )}
          </div>
          {filterInputMode === "inline" ? (
            <div className="space-y-1.5 rounded-md border border-ui-surface0/70 bg-ui-crust/60 p-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-ui-subtext0">
                  手動フィルタ条件
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-[11px]"
                  onClick={() =>
                    setInlineFilterConditions((current) => [
                      ...current,
                      createDefaultCondition(),
                    ])
                  }
                >
                  条件追加
                </Button>
              </div>
              {inlineFilterConditions.map((condition, conditionIndex) => (
                <PatternConditionEditor
                  scope="sub_pattern"
                  key={`inline-filter-condition-${conditionIndex}`}
                  condition={condition}
                  index={conditionIndex}
                  cardOptions={cardOptions}
                  onChange={(next) =>
                    setInlineFilterConditions((current) =>
                      current.map((target, idx) =>
                        idx === conditionIndex ? next : target,
                      ),
                    )
                  }
                  onRemove={() =>
                    setInlineFilterConditions((current) =>
                      current.filter((_, idx) => idx !== conditionIndex),
                    )
                  }
                />
              ))}
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="space-y-1 text-[11px] text-ui-subtext0">
              妨害カテゴリ（複数可）
              <MultiSelect
                disabled={!canSelectComposeCategory}
                options={penetrationCategoryOptions}
                value={selectedComposeCategoryUids}
                onChange={setComposeCategoryUids}
                placeholder="妨害カテゴリを選択"
              />
            </label>
            <label className="space-y-1 text-[11px] text-ui-subtext0">
              手動貫通加算（カテゴリごと）
              <Input
                className="h-9"
                type="number"
                min={0}
                max={20}
                disabled={isComposeLocked}
                value={effectiveManualPenetrationAmount}
                onChange={(event) =>
                  setComposeManualPenetrationAmount(
                    Math.max(
                      0,
                      Math.min(
                        20,
                        toInt(
                          event.target.value,
                          composeManualPenetrationAmount,
                        ),
                      ),
                    ),
                  )
                }
              />
            </label>
            <label className="space-y-1 text-[11px] text-ui-subtext0">
              生成サブパターン名（必須）
              <Input
                className="h-9"
                disabled={isComposeLocked}
                value={composeName}
                placeholder="生成サブパターン名を入力"
                onChange={(event) => setComposeName(event.target.value)}
              />
            </label>
          </div>
          <label className="space-y-1 text-[11px] text-ui-subtext0">
            合成結果に付与するラベル（任意）
            <MultiSelect
              options={labelOptions}
              value={selectedComposeLabelUids}
              onChange={setComposeLabelUids}
              placeholder="付与ラベルを選択"
              emptyText="有効なラベルがありません"
            />
          </label>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-9 px-3 text-xs"
              disabled={!canRunCompose}
              onClick={handleCompose}
            >
              サブパターン生成
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
