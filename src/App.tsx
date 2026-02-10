import { OpenerRateScreen } from "./features/opener-rate/components/opener-rate-screen";
import { ThemeProvider } from "./state/theme-context";

export const App = () => {
  return (
    <ThemeProvider>
      <OpenerRateScreen />
    </ThemeProvider>
  );
};
