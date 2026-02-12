import type { MultiSelectOption } from "../common/multi-select";

export const createDefaultRequiredCondition = () => ({
  mode: "required" as const,
  count: 1,
  uids: [],
});

export const toNamedOptions = (
  items: Array<{ uid: string; name: string }>,
): MultiSelectOption[] =>
  items
    .filter((item) => item.name.trim().length > 0)
    .map((item) => ({
      value: item.uid,
      label: item.name,
    }));

export const toggleUid = (current: string[], uid: string): string[] =>
  current.includes(uid)
    ? current.filter((target) => target !== uid)
    : [...current, uid];

export const removeUid = (current: string[], uid: string): string[] =>
  current.filter((target) => target !== uid);

export const updateItemByUid = <T extends { uid: string }>(
  items: T[],
  uid: string,
  updater: (item: T) => T,
): T[] => items.map((item) => (item.uid === uid ? updater(item) : item));

export const removeItemByUid = <T extends { uid: string }>(
  items: T[],
  uid: string,
): T[] => items.filter((item) => item.uid !== uid);
