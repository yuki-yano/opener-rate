import { useState } from "react";

import { ThemeToggle } from "./components/theme-toggle";
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui";
import { ThemeProvider } from "./state/theme-context";

const ScaffoldScreen = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-latte-base text-latte-text">
      <header className="border-latte-surface0 bg-latte-mantle/90 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <p className="text-latte-subtext0 text-xs font-medium tracking-wider">
              CLOUDFLARE WORKERS
            </p>
            <h1 className="text-lg font-semibold">Opener Rate</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
        <Card>
          <h2 className="text-lg font-semibold">Scaffold Ready</h2>
          <p className="text-latte-subtext0 mt-2 text-sm">
            Vite + React + Tailwind + Hono + D1 + Drizzle
            の初期構成を作成済みです。
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Next Step</h2>
          <p className="text-latte-subtext0 mt-2 text-sm">
            初動率ロジック移植と、D1保存の本実装をこの土台に乗せます。
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4" size="sm" variant="default">
                モーダルの確認
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>UI Primitive Scaffold</DialogTitle>
                <DialogDescription>
                  duel-logger ベースで UI
                  を構成し、ダークモード配色のみvde-monitorのmochaを反映しています。
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </Card>
      </main>
    </div>
  );
};

export const App = () => {
  return (
    <ThemeProvider>
      <ScaffoldScreen />
    </ThemeProvider>
  );
};
