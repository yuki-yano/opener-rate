import { ThemeToggle } from "../../../../components/theme-toggle";

export const AppHeader = () => {
  return (
    <header className="border-b border-latte-surface1/80 bg-latte-mantle/92 md:backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs tracking-widest text-latte-subtext0">
              OPENER RATE
            </p>
            <h1 className="truncate text-lg font-semibold text-latte-text">
              初動率シミュレーター
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
