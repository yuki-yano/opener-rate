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
import type {
  PatternCondition,
  SubPatternEffect,
} from "../../../../shared/apiSchemas";
import type { MultiSelectOption } from "../common/multi-select";
import { MultiSelect } from "../common/multi-select";
import {
  disruptionCategoriesAtom,
  labelsAtom,
  patternsAtom,
  subPatternsAtom,
} from "../../state";
import { createLocalId } from "./create-local-id";

type ComposeDestination = "pattern" | "sub_pattern";
type ComposeSource = {
  value: string;
  label: string;
  conditions: PatternCondition[];
  basePatternUids: string[];
  triggerSourceUids: string[];
  effects: SubPatternEffect[];
};

type PatternComposeDialogTriggerProps = {
  defaultDestination: ComposeDestination;
};

const composeDestinationOptions = [
  { value: "sub_pattern", label: "サブパターンに追加" },
  { value: "pattern", label: "メインパターンに追加" },
] as const;

const createDefaultSubPatternName = (index: number) =>
  `サブパターン${index + 1}`;
const createDefaultPatternName = (index: number) => `パターン${index + 1}`;

const resolveCategoryPenetrationAmount = (
  source: ComposeSource,
  disruptionCategoryUid: string,
) =>
  source.effects.reduce((total, effect) => {
    if (effect.type !== "add_penetration") return total;
    if (!effect.disruptionCategoryUids.includes(disruptionCategoryUid)) {
      return total;
    }
    return total + effect.amount;
  }, 0);

const resolveComposeEntries = (
  sourceA: ComposeSource,
  sourceB: ComposeSource,
  categoryUids: string[],
) =>
  Array.from(new Set(categoryUids))
    .map((disruptionCategoryUid) => {
      const amountA = resolveCategoryPenetrationAmount(
        sourceA,
        disruptionCategoryUid,
      );
      const amountB = resolveCategoryPenetrationAmount(
        sourceB,
        disruptionCategoryUid,
      );
      return {
        disruptionCategoryUid,
        totalAmount: amountA + amountB,
      };
    })
    .filter((entry) => entry.totalAmount > 0);

export const PatternComposeDialogTrigger = ({
  defaultDestination,
}: PatternComposeDialogTriggerProps) => {
  const [patterns, setPatterns] = useAtom(patternsAtom);
  const [subPatterns, setSubPatterns] = useAtom(subPatternsAtom);
  const disruptionCategories = useAtomValue(disruptionCategoriesAtom);
  const labels = useAtomValue(labelsAtom);

  const [composeSourceAUid, setComposeSourceAUid] = useState("");
  const [composeSourceBUid, setComposeSourceBUid] = useState("");
  const [composeDestination, setComposeDestination] =
    useState<ComposeDestination>(defaultDestination);
  const [composeCategoryUids, setComposeCategoryUids] = useState<string[]>([]);
  const [composeLabelUids, setComposeLabelUids] = useState<string[]>([]);
  const [composeName, setComposeName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const defaultDestinationLabel =
    defaultDestination === "pattern" ? "メイン" : "サブ";

  const resetComposeForm = (
    destination: ComposeDestination = defaultDestination,
  ) => {
    setComposeSourceAUid("");
    setComposeSourceBUid("");
    setComposeDestination(destination);
    setComposeCategoryUids([]);
    setComposeLabelUids([]);
    setComposeName("");
  };
  const handleDialogOpenChange = (nextOpen: boolean) => {
    setIsDialogOpen(nextOpen);
    if (nextOpen) {
      resetComposeForm(defaultDestination);
      return;
    }
    resetComposeForm(defaultDestination);
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
    const hasPenetrationEffect = (effects: SubPatternEffect[]) =>
      effects.some((effect) => effect.type === "add_penetration");

    const fromPatterns = patterns
      .filter((pattern) => hasPenetrationEffect(pattern.effects ?? []))
      .map((pattern, index) => ({
        value: `pattern:${pattern.uid}`,
        label: `メイン: ${pattern.name.trim() || createDefaultPatternName(index)}`,
        conditions: pattern.conditions,
        basePatternUids: [pattern.uid],
        triggerSourceUids: [],
        effects: pattern.effects ?? [],
      }));
    const fromSubPatterns = subPatterns
      .filter((subPattern) => hasPenetrationEffect(subPattern.effects))
      .map((subPattern, index) => ({
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

  const effectiveComposeSourceAUid = availableComposeSourceUids.has(
    composeSourceAUid,
  )
    ? composeSourceAUid
    : "";
  const effectiveComposeSourceBUid = availableComposeSourceUids.has(
    composeSourceBUid,
  )
    ? composeSourceBUid
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
  const selectedComposeSourceA = composeSourceByValue.get(
    effectiveComposeSourceAUid,
  );
  const selectedComposeSourceB = composeSourceByValue.get(
    effectiveComposeSourceBUid,
  );
  const hasComposeSourceSelection =
    effectiveComposeSourceAUid.length > 0 &&
    effectiveComposeSourceBUid.length > 0 &&
    effectiveComposeSourceAUid !== effectiveComposeSourceBUid &&
    selectedComposeSourceA != null &&
    selectedComposeSourceB != null;
  const composeEffectiveEntries =
    hasComposeSourceSelection &&
    selectedComposeSourceA &&
    selectedComposeSourceB
      ? resolveComposeEntries(
          selectedComposeSourceA,
          selectedComposeSourceB,
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
      effectiveComposeSourceAUid.length === 0 ||
      effectiveComposeSourceBUid.length === 0
    ) {
      return;
    }
    if (effectiveComposeSourceAUid === effectiveComposeSourceBUid) return;
    if (selectedComposeCategoryUids.length === 0) return;
    const trimmedName = composeName.trim();
    if (trimmedName.length === 0) return;

    const sourceA = composeSourceByValue.get(effectiveComposeSourceAUid);
    const sourceB = composeSourceByValue.get(effectiveComposeSourceBUid);
    if (sourceA == null || sourceB == null) return;

    const composeEntries = resolveComposeEntries(
      sourceA,
      sourceB,
      selectedComposeCategoryUids,
    );
    if (composeEntries.length === 0) return;

    const union = (left: string[], right: string[]) =>
      Array.from(new Set([...left, ...right]));
    const nextComposePenetrationEffects = composeEntries.map((entry) => ({
      type: "add_penetration" as const,
      disruptionCategoryUids: [entry.disruptionCategoryUid],
      amount: entry.totalAmount,
    }));

    if (composeDestination === "pattern") {
      const nextPatternUid = createLocalId("pattern");
      setPatterns((current) => [
        ...current,
        {
          uid: nextPatternUid,
          name: trimmedName,
          active: true,
          excludeFromOverall: false,
          conditions: [...sourceA.conditions, ...sourceB.conditions],
          labels: selectedComposeLabelUids.map((uid) => ({ uid })),
          effects: nextComposePenetrationEffects,
          memo: `合成元: ${sourceA.label} / ${sourceB.label}`,
        },
      ]);
      setIsDialogOpen(false);
      resetComposeForm(defaultDestination);
      return;
    }

    const nextSubPatternUid = createLocalId("sub_pattern");
    setSubPatterns((current) => [
      ...current,
      {
        uid: nextSubPatternUid,
        name: trimmedName,
        active: true,
        basePatternUids: union(
          sourceA.basePatternUids,
          sourceB.basePatternUids,
        ),
        triggerConditions: [...sourceA.conditions, ...sourceB.conditions],
        triggerSourceUids: union(
          sourceA.triggerSourceUids,
          sourceB.triggerSourceUids,
        ),
        applyLimit: "once_per_trial",
        effects: [
          ...(selectedComposeLabelUids.length > 0
            ? [
                {
                  type: "add_label" as const,
                  labelUids: selectedComposeLabelUids,
                },
              ]
            : []),
          ...nextComposePenetrationEffects,
        ],
        memo: `合成元: ${sourceA.label} / ${sourceB.label}`,
      },
    ]);
    setIsDialogOpen(false);
    resetComposeForm(defaultDestination);
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
        合成ジェネレーター
      </Button>
      <DialogContent className="p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>貫通合成ジェネレーター</DialogTitle>
          <DialogDescription>
            メイン/サブを横断して合成できます。起動時の登録先は
            {defaultDestinationLabel}
            です。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-lg border border-latte-blue/20 bg-[linear-gradient(145deg,rgba(var(--ctp-blue),0.12),rgba(var(--ctp-surface0),0.35))] p-3">
          <div className="space-y-0.5">
            {isComposeLocked ? (
              <p className="text-[11px] text-latte-overlay1">
                利用条件: 貫通効果を持つパターン2件以上 + 妨害カテゴリ1件以上
              </p>
            ) : null}
            {!isComposeLocked &&
            hasComposeSourceSelection &&
            selectedComposeCategoryUids.length > 0 &&
            !hasComposePenetrationTarget ? (
              <p className="text-[11px] text-latte-overlay1">
                選択中のカテゴリには、2パターン合算で加算効果がありません。
              </p>
            ) : null}
            {!isComposeLocked &&
            hasComposeSourceSelection &&
            hasComposePenetrationTarget &&
            hasComposeSkippedCategories ? (
              <p className="text-[11px] text-latte-overlay1">
                一部カテゴリは加算効果がないため、生成対象から除外されます。
              </p>
            ) : null}
            {!isComposeLocked && composeName.trim().length === 0 ? (
              <p className="text-[11px] text-latte-overlay1">
                合成パターン名は必須です。
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-[11px] text-latte-subtext0">
              合成元A
              <Select
                ariaLabel="合成元A"
                disabled={!canSelectComposeSources}
                triggerClassName="h-9"
                value={effectiveComposeSourceAUid}
                options={composeSourceOptions}
                onChange={setComposeSourceAUid}
                placeholder="メイン/サブを選択"
              />
            </label>
            <label className="space-y-1 text-[11px] text-latte-subtext0">
              合成元B
              <Select
                ariaLabel="合成元B"
                disabled={!canSelectComposeSources}
                triggerClassName="h-9"
                value={effectiveComposeSourceBUid}
                options={composeSourceOptions}
                onChange={setComposeSourceBUid}
                placeholder="メイン/サブを選択"
              />
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="space-y-1 text-[11px] text-latte-subtext0">
              貫通カテゴリ（複数可）
              <MultiSelect
                disabled={!canSelectComposeCategory}
                options={penetrationCategoryOptions}
                value={selectedComposeCategoryUids}
                onChange={setComposeCategoryUids}
                placeholder="カテゴリを選択"
              />
            </label>
            <label className="space-y-1 text-[11px] text-latte-subtext0">
              生成先
              <Select
                ariaLabel="合成生成先"
                disabled={isComposeLocked}
                triggerClassName="h-9"
                value={composeDestination}
                options={composeDestinationOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={(value) =>
                  setComposeDestination(value as ComposeDestination)
                }
              />
            </label>
            <label className="space-y-1 text-[11px] text-latte-subtext0">
              合成パターン名（必須）
              <Input
                className="h-9"
                disabled={isComposeLocked}
                value={composeName}
                placeholder="合成パターン名を入力"
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
              合成生成
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
