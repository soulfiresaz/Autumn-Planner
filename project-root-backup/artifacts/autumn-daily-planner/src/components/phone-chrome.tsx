import { useEffect, useRef } from 'react';
import { CalendarCheck, CalendarDays, FolderKanban, ListChecks, Menu, Printer, Search, Settings, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  MONTHS, RANGE_START, addDays, clampToRange, fmtMonthDayShort, inRange, isValidISO, isValidMonth, monthOf, todayISO, weekStart,
} from '@/lib/dates';
import { usePlannerName } from '@/lib/settings';
import { lastBackup } from '@/lib/backup';
import { usePlannerStore } from '@/lib/planner-store';
import { DAY_SHEETS } from '@/pages/day-sheets';
import { WEEK_SHEETS } from '@/pages/week-sheets';

const LAST_WEEK_KEY = 'autumn-planner-last-week';
const rememberWeek = (ws: string) => { try { sessionStorage.setItem(LAST_WEEK_KEY, ws); } catch { /* fine */ } };
const recallWeek = () => {
  try { const v = sessionStorage.getItem(LAST_WEEK_KEY); if (v && isValidISO(v)) return v; } catch { /* fine */ }
  return weekStart(clampToRange(todayISO()));
};

type Where =
  | { level: 'day'; date: string; slug: string }
  | { level: 'week'; ws: string; slug: string }
  | { level: 'month'; ym: string }
  | { level: 'tasks' } | { level: 'projects' } | { level: 'other' };

export function parseLocation(loc: string): Where {
  const [, kind, a, b] = loc.split('/');
  if (kind === 'day' && isValidISO(a)) return { level: 'day', date: a, slug: b || DAY_SHEETS[0].slug };
  if (kind === 'week' && isValidISO(a)) return { level: 'week', ws: a, slug: b || WEEK_SHEETS[0].slug };
  if (kind === 'month' && isValidMonth(a)) return { level: 'month', ym: a };
  if (kind === 'tasks') return { level: 'tasks' };
  if (kind === 'projects' && !a) return { level: 'projects' };
  if (!kind) return { level: 'month', ym: monthOf(clampToRange(todayISO())) };
  return { level: 'other' };
}

/** Where a left / right swipe goes from here. */
export function swipeTargets(loc: string): { prev?: string; next?: string } {
  const w = parseLocation(loc);
  if (w.level === 'day') {
    const i = Math.max(0, DAY_SHEETS.findIndex(s => s.slug === w.slug));
    return {
      prev: i > 0 ? `/day/${w.date}/${DAY_SHEETS[i - 1].slug}` : undefined,
      next: i < DAY_SHEETS.length - 1 ? `/day/${w.date}/${DAY_SHEETS[i + 1].slug}` : undefined,
    };
  }
  if (w.level === 'week') {
    const i = Math.max(0, WEEK_SHEETS.findIndex(s => s.slug === w.slug));
    return {
      prev: i > 0 ? `/week/${w.ws}/${WEEK_SHEETS[i - 1].slug}` : undefined,
      next: i < WEEK_SHEETS.length - 1 ? `/week/${w.ws}/${WEEK_SHEETS[i + 1].slug}` : '/tasks',
    };
  }
  if (w.level === 'tasks') return { prev: `/week/${recallWeek()}/${WEEK_SHEETS[WEEK_SHEETS.length - 1].slug}`, next: '/projects' };
  if (w.level === 'projects') return { prev: '/tasks' };
  if (w.level === 'month') {
    const i = MONTHS.indexOf(w.ym as (typeof MONTHS)[number]);
    return { prev: i > 0 ? `/month/${MONTHS[i - 1]}` : undefined, next: i >= 0 && i < MONTHS.length - 1 ? `/month/${MONTHS[i + 1]}` : undefined };
  }
  return {};
}

function useBackupStale() {
  const { values } = usePlannerStore();
  const last = lastBackup();
  return Object.keys(values).length >= 12 && (!last || Date.now() - new Date(last).getTime() > 7 * 86400000);
}

/** Remember the week being looked at, so the Tasks and Projects pages can lead back to it. */
export function useRememberWeek() {
  const [location] = useLocation();
  useEffect(() => {
    const w = parseLocation(location);
    if (w.level === 'week') rememberWeek(w.ws);
    if (w.level === 'day') rememberWeek(weekStart(w.date));
  }, [location]);
}

/** Swipe left / right to turn pages. Only on phones, and never while writing or scrolling sideways. */
export function useSwipePages(setLocation: (to: string) => void) {
  const [location] = useLocation();
  const loc = useRef(location);
  loc.current = location;
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    let start: { x: number; y: number; t: number } | null = null;
    const blocked = (el: EventTarget | null) => {
      let n = el as HTMLElement | null;
      while (n && n !== document.body) {
        // A field you are typing in keeps its own swipes (to move the cursor or select words).
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(n.tagName) && n === document.activeElement) return true;
        if (n.matches?.('[role=dialog],[role=menu],.nav-wrap,.page-nav,.month-tabs,[data-no-swipe]')) return true;
        if (n.scrollWidth > n.clientWidth + 4 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true;
        n = n.parentElement;
      }
      return false;
    };
    const down = (e: TouchEvent) => {
      if (!mq.matches || e.touches.length !== 1 || blocked(e.target)) { start = null; return; }
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    };
    const up = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x; const dy = t.clientY - start.y; const dt = Date.now() - start.t;
      start = null;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6 || dt > 900) return;
      if (window.getSelection()?.toString()) return;
      const targets = swipeTargets(loc.current);
      const to = dx < 0 ? targets.next : targets.prev;
      if (to) setLocation(to);
    };
    document.addEventListener('touchstart', down, { passive: true });
    document.addEventListener('touchend', up, { passive: true });
    return () => { document.removeEventListener('touchstart', down); document.removeEventListener('touchend', up); };
  }, [setLocation]);
}

function calendarTarget(w: Where): string {
  if (w.level === 'day') return `/month/${monthOf(clampToRange(w.date))}`;
  if (w.level === 'week') return `/month/${monthOf(clampToRange(addDays(w.ws, 3)))}`;
  if (w.level === 'month') return `/month/${w.ym}`;
  return `/month/${monthOf(clampToRange(todayISO()))}`;
}

/** The slim bar at the top of a phone: menu on the left, today on the right. */
export function PhoneHeader() {
  const [location] = useLocation();
  const w = parseLocation(location);
  const stale = useBackupStale();
  const plannerName = usePlannerName();
  const today = todayISO();
  return (
    <header className="phone-header phone-only">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="menu-btn" aria-label="Menu" data-testid="menu-button">
            <Menu size={24} strokeWidth={1.8} />{stale && <span className="menu-dot" aria-label="Backup suggested" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="phone-menu">
          {[
            { href: calendarTarget(w), label: 'Calendar', icon: CalendarDays, id: 'calendar' },
            { href: '/tasks', label: 'Tasks', icon: ListChecks, id: 'tasks' },
            { href: '/projects', label: 'Projects', icon: FolderKanban, id: 'projects' },
            { href: '/search', label: 'Search', icon: Search, id: 'search' },
            { href: '/backup', label: 'Backup & restore', icon: ShieldCheck, id: 'backup' },
            { href: '/settings', label: 'Settings', icon: Settings, id: 'settings' },
          ].map(item => (
            <DropdownMenuItem key={item.id} asChild className="phone-menu-item">
              <Link href={item.href} data-testid={`menu-${item.id}`}><item.icon size={19} strokeWidth={1.7} /> <span>{item.label}</span></Link>
            </DropdownMenuItem>
          ))}
          {(w.level === 'day' || w.level === 'week' || w.level === 'month') && (
            <DropdownMenuItem className="phone-menu-item" onSelect={() => window.print()} data-testid="menu-print">
              <Printer size={19} strokeWidth={1.7} /> <span>{w.level === 'day' ? 'Print this day' : w.level === 'week' ? 'Print this week' : 'Print this month'}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Link href="/" className="phone-brand" data-testid="phone-brand">{plannerName}</Link>
      {inRange(today) ? (
        <Link href={`/day/${today}/${DAY_SHEETS[0].slug}`} className="today-btn" data-testid="today-button">
          <CalendarCheck size={16} strokeWidth={1.8} /> <span>Today &middot; {fmtMonthDayShort(today)}</span>
        </Link>
      ) : <span />}
    </header>
  );
}

/** Day · Week · Month: one tap moves up or down a level, no scrolling mix-ups. */
export function LevelSwitch() {
  const [location] = useLocation();
  const w = parseLocation(location);
  if (w.level !== 'day' && w.level !== 'week' && w.level !== 'month') return null;
  const today = todayISO();
  const refDate = w.level === 'day' ? w.date : w.level === 'week' ? w.ws : `${w.ym}-01`;
  const dayTarget = () => {
    if (w.level === 'day') return location;
    const days = w.level === 'week'
      ? Array.from({ length: 7 }, (_, i) => addDays(w.ws, i))
      : null;
    const pick = w.level === 'week'
      ? (days!.includes(today) ? today : days!.find(inRange) ?? RANGE_START)
      : (monthOf(today) === w.ym && inRange(today) ? today : `${w.ym}-01`);
    return `/day/${clampToRange(pick)}/${DAY_SHEETS[0].slug}`;
  };
  const weekTarget = () => {
    if (w.level === 'week') return location;
    const d = w.level === 'day' ? w.date : (monthOf(today) === w.ym && inRange(today) ? today : `${w.ym}-01`);
    return `/week/${weekStart(clampToRange(d))}/${WEEK_SHEETS[0].slug}`;
  };
  const monthTarget = () => `/month/${monthOf(clampToRange(w.level === 'week' ? addDays(w.ws, 3) : refDate))}`;
  const items = [
    { id: 'day', label: 'Day', href: dayTarget() },
    { id: 'week', label: 'Week', href: weekTarget() },
    { id: 'month', label: 'Month', href: monthTarget() },
  ];
  return (
    <nav className="level-switch phone-only" aria-label="Level">
      {items.map(it => (
        <Link key={it.id} href={it.href} className={`level-btn ${w.level === it.id ? 'on' : ''}`} aria-current={w.level === it.id ? 'page' : undefined} data-testid={`level-${it.id}`}>{it.label}</Link>
      ))}
    </nav>
  );
}
