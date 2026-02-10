declare global {
  interface Window {
    exportState?: () => string;
    importState?: (payload: string | unknown) => Promise<boolean>;
  }
}

export {};
