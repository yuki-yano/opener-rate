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
  Select,
} from "../../../../components/ui";
import type { MultiSelectOption } from "../common/multi-select";
import { MultiSelect } from "../common/multi-select";
import {
  disruptionCategoriesAtom,
  labelsAtom,
  patternsAtom,
  subPatternsAtom,
} from "../../state";
import { createLocalId } from "./create-local-id";
import {
  buildComposedSubPattern,
  resolveComposeEntries,
  type ComposeSource,
} from "./pattern-compose";

const createDefaultSubPatternName = (index: number) =>
  `サブパターン${index + 1}`;
const createDefaultPatternName = (index: number) => `パターン${index + 1}`;

export const PatternComposeDialogTrigger = () => {
  const patterns = useAtomValue(patternsAtom);
  const [subPatterns, setSubPatterns] = useAtom(subPatternsAtom);
  const disruptionCategories = useAtomValue(disruptionCategoriesAtom);
  const labels = useAtomValue(labelsAtom);

  const [composeMainSourceUid, setComposeMainSourceUid] = useState("");
  const [composeFilterSourceUid, setComposeFilterSourceUid] = useState("");
  const [composeCategoryUids, setComposeCategoryUids] = useState<string[]>([]);
  const [composeLabelUids, setComposeLabelUids] = useState<string[]>([]);
  const [composeName, setComposeName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const resetComposeForm = () => {
    setComposeMainSourceUid("");
    setComposeFilterSourceUid("");
    setComposeCategoryUids([]);
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
  const selectedComposeCategoryUids = Array.from(
    new Set(composeCategoryUids),
  ).filter((uid) => availableComposeCategoryUids.has(uid));
  const selectedComposeLabelUids = Array.from(new Set(composeLabelUids)).filter(
    (uid) => availableComposeLabelUids.has(uid),
  );

  const canSelectComposeSources = composeSourceOptions.length >= 2;
  const canSelectComposeCategory = penetrationCategoryOptions.length > 0;
  const isComposeLocked = !canSelectComposeSources || !canSelectComposeCategory;
  const selectedMainComposeSource = composeSourceByValue.get(
    effectiveComposeMainSourceUid,
  );
  const selectedFilterComposeSource = composeSourceByValue.get(
    effectiveComposeFilterSourceUid,
  );
  const hasComposeSourceSelection =
    effectiveComposeMainSourceUid.length > 0 &&
    effectiveComposeFilterSourceUid.length > 0 &&
    effectiveComposeMainSourceUid !== effectiveComposeFilterSourceUid &&
    selectedMainComposeSource != null &&
    selectedFilterComposeSource != null;
  const composeEffectiveEntries =
    hasComposeSourceSelection &&
    selectedMainComposeSource &&
    selectedFilterComposeSource
      ? resolveComposeEntries(
          selectedMainComposeSource,
          selectedFilterComposeSource,
          selectedComposeCategoryUids,
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
    if (
      effectiveComposeMainSourceUid.length === 0 ||
      effectiveComposeFilterSourceUid.length === 0
    ) {
      return;
    }
    if (effectiveComposeMainSourceUid === effectiveComposeFilterSourceUid) {
      return;
    }
    if (selectedComposeCategoryUids.length === 0) return;
    const mainSource = composeSourceByValue.get(effectiveComposeMainSourceUid);
    const filterSource = composeSourceByValue.get(
      effectiveComposeFilterSourceUid,
    );
    if (mainSource == null || filterSource == null) return;

    const nextSubPattern = buildComposedSubPattern({
      uid: createLocalId("sub_pattern"),
      name: composeName,
      mainSource,
      filterSource,
      selectedCategoryUids: selectedComposeCategoryUids,
      selectedLabelUids: selectedComposeLabelUids,
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
        <FlaskConical className="mr-1.5 h-3.5 w-3.5 text-latte-blue" />
        合成
      </Button>
      <DialogContent className="p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>貫通合成ジェネレーター</DialogTitle>
          <DialogDescription>
            1つ目をメイン、2つ目をフィルタとして評価するサブパターンを生成します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg border border-latte-blue/20 bg-[linear-gradient(145deg,rgba(var(--ctp-blue),0.12),rgba(var(--ctp-surface0),0.35))] p-3">
          <div className="space-y-0.5">
            {isComposeLocked ? (
              <p className="text-[11px] text-latte-overlay1">
                利用条件: 合成元2件以上 + 妨害カテゴリ1件以上
              </p>
            ) : null}
            {!isComposeLocked &&
            hasComposeSourceSelection &&
            selectedComposeCategoryUids.length > 0 &&
            !hasComposePenetrationTarget ? (
              <p className="text-[11px] text-latte-overlay1">
                選択中の妨害カテゴリでは、メイン/フィルタ合算の貫通効果がありません。
              </p>
            ) : null}
            {!isComposeLocked &&
            hasComposeSourceSelection &&
            hasComposePenetrationTarget &&
            hasComposeSkippedCategories ? (
              <p className="text-[11px] text-latte-overlay1">
                一部妨害カテゴリは加算効果がないため、生成対象から除外されます。
              </p>
            ) : null}
            {!isComposeLocked && composeName.trim().length === 0 ? (
              <p className="text-[11px] text-latte-overlay1">
                生成サブパターン名は必須です。
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-[11px] text-latte-subtext0">
              メイン元（1つ目）
              <Select
                ariaLabel="メイン元"
                disabled={!canSelectComposeSources}
                triggerClassName="h-9"
                value={effectiveComposeMainSourceUid}
                options={composeSourceOptions}
                onChange={setComposeMainSourceUid}
                placeholder="メイン/サブを選択"
              />
            </label>
            <label className="space-y-1 text-[11px] text-latte-subtext0">
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
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-[11px] text-latte-subtext0">
              妨害カテゴリ（複数可）
              <MultiSelect
                disabled={!canSelectComposeCategory}
                options={penetrationCategoryOptions}
                value={selectedComposeCategoryUids}
                onChange={setComposeCategoryUids}
                placeholder="妨害カテゴリを選択"
              />
            </label>
            <label className="space-y-1 text-[11px] text-latte-subtext0">
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
          <label className="space-y-1 text-[11px] text-latte-subtext0">
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
