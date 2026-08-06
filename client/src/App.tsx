import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const Game = lazy(() => import("./pages/Game"));
const TrainMnemonic = lazy(() => import("./pages/TrainMnemonic"));
const TrainRoleplay = lazy(() => import("./pages/TrainRoleplay"));
const TrainGesture = lazy(() => import("./pages/TrainGesture"));
const TrainMrt = lazy(() => import("./pages/TrainMrt"));
const MrtCourse = lazy(() => import("./pages/MrtCourse"));
const MrtWrongBook = lazy(() => import("./pages/MrtWrongBook"));
const MrtDashboard = lazy(() => import("./pages/MrtDashboard"));
const MrtAudio = lazy(() => import("./pages/MrtAudio"));
const MemoryProfilePage = lazy(() => import("./pages/MemoryProfilePage"));
const TalentQuizPage = lazy(() => import("./pages/TalentQuizPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const CloudSyncPage = lazy(() => import("./pages/CloudSyncPage"));
const ElementGame = lazy(() => import("./pages/ElementGame"));
const MemGeniusArcade = lazy(() => import("./pages/MemGeniusArcade"));
const NotFound = lazy(() => import("./pages/NotFound"));


function Router() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <WouterRouter base={base || undefined}>
      <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center font-display font-bold text-primary">正在翻開記憶手帳…</div>}><Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/game"} component={Game} />
        <Route path={"/train/mnemonic"} component={TrainMnemonic} />
        <Route path={"/train/roleplay"} component={TrainRoleplay} />
        <Route path={"/train/gesture"} component={TrainGesture} />
        <Route path={"/train/mrt"} component={TrainMrt} />
        <Route path={"/train/mrt/course"} component={MrtCourse} />
        <Route path={"/train/mrt/errors"} component={MrtWrongBook} />
        <Route path={"/train/mrt/dashboard"} component={MrtDashboard} />
        <Route path={"/train/mrt/audio"} component={MrtAudio} />
        <Route path={"/train/mrt/profile"} component={MemoryProfilePage} />
        <Route path={"/train/mrt/quiz"} component={TalentQuizPage} />
        <Route path={"/train/mrt/achievements"} component={AchievementsPage} />
        <Route path={"/train/mrt/sync"} component={CloudSyncPage} />
        <Route path={"/train/elements"} component={ElementGame} />
        <Route path={"/memgenius"} component={MemGeniusArcade} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch></Suspense>
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
        switchable
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
