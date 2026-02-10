import { Laptop, Moon, Sun } from "lucide-react";

import { isThemePreference } from "../lib/theme";
import { useTheme } from "../state/theme-context";
import { Tabs, TabsList, TabsTrigger } from "./ui";

type ThemeToggleProps = {
  className?: string;
};

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { preference, setPreference } = useTheme();

  const handleValueChange = (value: string) => {
    if (isThemePreference(value)) {
      setPreference(value);
    }
  };

  return (
    <Tabs
      value={preference}
      onValueChange={handleValueChange}
      className={className}
    >
      <TabsList aria-label="テーマ選択">
        <TabsTrigger
          value="system"
          className="flex h-7 w-7 items-center justify-center p-0"
          aria-label="システムテーマ"
          title="システム"
        >
          <Laptop className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger
          value="latte"
          className="flex h-7 w-7 items-center justify-center p-0"
          aria-label="ライトテーマ"
          title="Latte"
        >
          <Sun className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger
          value="mocha"
          className="flex h-7 w-7 items-center justify-center p-0"
          aria-label="ダークテーマ"
          title="Mocha"
        >
          <Moon className="h-4 w-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
