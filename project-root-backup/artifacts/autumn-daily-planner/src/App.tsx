import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Check, Leaf } from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { clampToRange, isValidISO, isValidMonth, monthOf, todayISO } from '@/lib/dates';
import { PlannerProvider, usePlannerStore } from '@/lib/planner-store';
import DayPage from '@/pages/day-page';
import MonthPage from '@/pages/month-page';
import NotFound from '@/pages/not-found';
import WeekPage from '@/pages/week-page';

const queryClient = new QueryClient();

function Shell({ children }: { children: ReactNode }) {
  const { savedState } = usePlannerStore();
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return (
    <div className="planner-app">
      <header className="topbar">
        <Link href="/" className="brand-lockup" aria-label="Autumn Planner, back to the calendar" data-testid="link-home">
          <div className="brand-mark" aria-hidden="true"><Leaf size={19} strokeWidth={1.5} /></div>
          <div>
            <div className="brand-name">Autumn Planner</div>
            <div className="brand-caption">November 2026 &ndash; January 2027</div>
          </div>
        </Link>
        <div className="saved-state" role="status" aria-live="polite" data-testid="status-saved">
          {savedState === 'saving' ? <><span className="saved-dot" />Saving&hellip;</> : <><Check size={13} /><span>Saved on this device</span></>}
        </div>
      </header>
      <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>
    </div>
  );
}

function Home() {
  return <MonthPage ym={monthOf(clampToRange(todayISO()))} />;
}

function Routes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/month/:ym">
        {params => (isValidMonth(params.ym) ? <MonthPage ym={params.ym} /> : <NotFound />)}
      </Route>
      <Route path="/week/:ws/:sheet?">
        {params => (isValidISO(params.ws) ? <WeekPage ws={params.ws} sheet={params.sheet} /> : <NotFound />)}
      </Route>
      <Route path="/day/:date/:sheet?">
        {params => (isValidISO(params.date) ? <DayPage date={params.date} sheet={params.sheet} /> : <NotFound />)}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlannerProvider>
          <WouterRouter hook={useHashLocation}>
            <Shell>
              <Routes />
            </Shell>
          </WouterRouter>
        </PlannerProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
