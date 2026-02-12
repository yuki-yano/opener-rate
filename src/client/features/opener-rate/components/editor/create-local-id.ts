export const createLocalId = (prefix: string) =>
  `${prefix}-${crypto.randomUUID()}`;
