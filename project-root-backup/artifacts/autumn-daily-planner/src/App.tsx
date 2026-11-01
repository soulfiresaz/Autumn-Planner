import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarDays, Check, FolderKanban, Leaf, ListChecks, Search, ShieldCheck } from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { addDays, clampToRange, isValidISO, isValidMonth, monthOf, todayISO } from '@/lib/dates';
import { lastBackup } from '@/lib/backup';
import { LevelSwitch, PhoneHeader, useRememberWeek, useSwipePages } from '@/components/phone-chrome';
import { PlannerProvider, usePlannerStore } from '@/lib/planner-store';
import BackupPage from '@/pages/backup-page';
import ProjectsPage, { ProjectDetailPage } from '@/pages/projects-page';
import SearchPage from '@/pages/search-page';
import TasksPage from '@/pages/tasks-page';
import DayPage from '@/pages/day-page';
import MonthPage from '@/pages/month-page';
import NotFound from '@/pages/not-found';
import WeekPage from '@/pages/week-page';

const queryClient = new QueryClient();

const NAV = [
  { href: '/', label: 'Calendar', icon: CalendarDays, match: (l: string) => l === '/' || l.startsWith('/month') || l.startsWith('/week') || l.startsWith('/day') },
  { href: '/tasks', label: 'Tasks', icon: ListChecks, match: (l: string) => l.startsWith('/tasks') },
  { href: '/projects', label: 'Projects', icon: FolderKanban, match: (l: string) => l.startsWith('/projects') },
  { href: '/search', label: 'Search', icon: Search, match: (l: string) => l.startsWith('/search') },
  { href: '/backup', label: 'Backup & restore', icon: ShieldCheck, match: (l: string) => l.startsWith('/backup') },
];

function BackupNudge() {
  const { values } = usePlannerStore();
  const [location] = useLocation();
  const [hidden, setHidden] = useState(false);
  const last = lastBackup();
  const stale = !last || Date.now() - new Date(last).getTime() > 7 * 86400000;
  if (hidden || location.startsWith('/backup') || Object.keys(values).length < 12 || !stale) return null;
  return (
    <div className="backup-nudge" role="note" data-testid="backup-nudge">
      <span>Your writing is saved on this device only. A quick backup keeps it safe.</span>
      <Link href="/backup" className="inline-link">Save a backup</Link>
      <button type="button" className="mini-btn" onClick={() => setHidden(true)}>Later</button>
    </div>
  );
}

/** The Calendar button opens the month you are looking at (or this month, from other pages). */
function calendarHref(location: string) {
  const [, kind, id] = location.split('/');
  if (kind === 'month' && isValidMonth(id)) return `/month/${id}`;
  if ((kind === 'day' || kind === 'week') && isValidISO(id)) return `/month/${monthOf(clampToRange(kind === 'week' ? addDays(id, 3) : id))}`;
  return '/';
}

function Shell({ children }: { children: ReactNode }) {
  const { savedState } = usePlannerStore();
  const [location, setLocation] = useLocation();
  useRememberWeek();
  useSwipePages(setLocation);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return (
    <div className="planner-app">
      <PhoneHeader />
      <LevelSwitch />
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
      <nav className="app-nav" aria-label="Planner sections">
        {NAV.map(n => (
          <Link key={n.href} href={n.href === '/' ? calendarHref(location) : n.href} className={`app-nav-link ${n.match(location) ? 'active' : ''}`} aria-current={n.match(location) ? 'page' : undefined} data-testid={`nav-${n.label.toLowerCase()}`}>
            <n.icon size={16} strokeWidth={1.7} /><span className={n.label.length > 9 ? 'nav-long' : ''}>{n.label}</span>
          </Link>
        ))}
      </nav>
      <BackupNudge />
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
      <Route path="/tasks" component={TasksPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/projects/:id">{params => <ProjectDetailPage id={params.id} />}</Route>
      <Route path="/search" component={SearchPage} />
      <Route path="/backup" component={BackupPage} />
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
