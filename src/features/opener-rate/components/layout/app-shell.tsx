import type { ReactNode } from "react";

type AppShellProps = {
  header: ReactNode;
  leftColumn: ReactNode;
  rightColumn: ReactNode;
};

export const AppShell = ({
  header,
  leftColumn,
  rightColumn,
}: AppShellProps) => {
  return (
    <div className="relative min-h-[100svh] bg-latte-base text-latte-text md:min-h-screen">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
        <div className="absolute left-[-8rem] top-[-6rem] h-64 w-64 rounded-full bg-latte-lavender/10 blur-2xl md:blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-10rem] h-80 w-80 rounded-full bg-latte-blue/10 blur-2xl md:blur-3xl" />
      </div>

      <div className="relative z-10">
        {header}
        <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-10 pt-6">
          <section className="order-1 space-y-5">{rightColumn}</section>
          <section className="order-2 space-y-5">{leftColumn}</section>
        </main>
      </div>
    </div>
  );
};
