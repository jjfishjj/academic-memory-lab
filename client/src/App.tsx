import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Game from "./pages/Game";
import TrainMnemonic from "./pages/TrainMnemonic";
import TrainRoleplay from "./pages/TrainRoleplay";
import TrainGesture from "./pages/TrainGesture";
import PeriodicTable from "./pages/PeriodicTable";
import PeriodicTutorial from "./pages/PeriodicTutorial";
import AlkaliRoute from "./pages/AlkaliRoute";


function Router() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <WouterRouter base={base || undefined}>
      <Switch>
        <Route path={"/"} component={PeriodicTutorial} />
        <Route path={"/explore"} component={PeriodicTable} />
        <Route path={"/alkali"} component={AlkaliRoute} />
        <Route path={"/original"} component={Home} />
        <Route path={"/game"} component={Game} />
        <Route path={"/train/mnemonic"} component={TrainMnemonic} />
        <Route path={"/train/roleplay"} component={TrainRoleplay} />
        <Route path={"/train/gesture"} component={TrainGesture} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
