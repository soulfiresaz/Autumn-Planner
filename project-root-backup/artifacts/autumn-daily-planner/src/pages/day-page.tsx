import { CalendarCheck, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, Redirect } from 'wouter';
import { PageLayout, PrintMenu, SheetTabs } from '@/components/nav';
import {
  RANGE_END, RANGE_START, addDays, dayNumber, fmtLong, fmtMonthDayShort, fmtWeekday, inRange, isValidISO,
  todayISO, weekNumber, weekStart,
} from '@/lib/dates';
import { Scope, usePlannerStore } from '@/lib/planner-store';
import { useDocumentTitle, usePrintMode } from '@/lib/use-print';
import { DAY_SHEETS, DaySheet } from './day-sheets';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function WeekStrip({ date, slug, prev, next }: { date: string; slug: string; prev?: string; next?: string }) {
  const { daysWithEntries } = usePlannerStore();
  const ws = weekStart(date);
  const today = todayISO();
  return (
    <nav className="week-strip" aria-label="Days this week">
      {prev ? (
        <Link href={`/day/${prev}/${slug}`} className="ws-step" aria-label="Previous day" data-testid="link-prev"><ChevronLeft size={18} /></Link>
      ) : (
        <span className="ws-step is-disabled" aria-disabled="true"><ChevronLeft size={18} /></span>
      )}
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(ws, i);
        const open = inRange(d);
        const cls = `ws-day ${d === date ? 'is-current' : ''} ${d === today ? 'is-today' : ''} ${daysWithEntries.has(d) ? 'has-entries' : ''}`;
        const inner = (<><span className="ws-letter" aria-hidden="true">{LETTERS[i]}</span><span className="ws-num">{dayNumber(d)}</span><span className="ws-dot" aria-hidden="true" /></>);
        const label = `${fmtWeekday(d)}, ${fmtMonthDayShort(d)}${d === today ? ', today' : ''}${daysWithEntries.has(d) ? ', has entries' : ''}`;
        return open ? (
          <Link key={d} href={`/day/${d}/${slug}`} className={cls} aria-label={label} aria-current={d === date ? 'date' : undefined} data-testid={`strip-${d}`}>{inner}</Link>
        ) : (
          <span key={d} className={`${cls} is-outside`} aria-hidden="true">{inner}</span>
        );
      })}
      {next ? (
        <Link href={`/day/${next}/${slug}`} className="ws-step" aria-label="Next day" data-testid="link-next"><ChevronRight size={18} /></Link>
      ) : (
        <span className="ws-step is-disabled" aria-disabled="true"><ChevronRight size={18} /></span>
      )}
    </nav>
  );
}

export default function DayPage({ date, sheet }: { date: string; sheet?: string }) {
  const valid = isValidISO(date) && inRange(date);
  const sheetIndex = sheet ? DAY_SHEETS.findIndex(s => s.slug === sheet) : 0;
  const { all, printNow } = usePrintMode();
  useDocumentTitle(valid ? `${fmtLong(date)} · Autumn Planner` : 'Autumn Planner');
  if (!valid || sheetIndex < 0) return <Redirect to="/" />;

  const slug = DAY_SHEETS[sheetIndex].slug;
  const ws = weekStart(date);
  const today = todayISO();
  const prev = date > RANGE_START ? addDays(date, -1) : undefined;
  const next = date < RANGE_END ? addDays(date, 1) : undefined;

  const bar = (
    <div className="context-bar">
      <div className="context-left">
        <Link href={`/week/${ws}`} className="chip-link" data-testid="link-week">
          <CalendarRange size={15} strokeWidth={1.7} /> <span>Week {weekNumber(ws)}</span>
        </Link>
      </div>
      <div className="context-actions">
        {inRange(today) && date !== today && (
          <Link href={`/day/${today}/${slug}`} className="chip-link is-accent" data-testid="link-today">
            <CalendarCheck size={15} strokeWidth={1.7} /> <span>Today</span>
          </Link>
        )}
        <PrintMenu
          options={[
            { label: 'Print this sheet', run: () => printNow(false) },
            { label: `Print all ${DAY_SHEETS.length} sheets for this day`, run: () => printNow(true) },
          ]}
        />
      </div>
    </div>
  );

  const tabs = (
    <>
      <WeekStrip date={date} slug={slug} prev={prev} next={next} />
      <SheetTabs
        label="Day sheets"
        active={sheetIndex}
        tabs={DAY_SHEETS.map(s => ({ href: `/day/${date}/${s.slug}`, label: s.label, testid: `tab-day-${s.slug}` }))}
      />
    </>
  );

  return (
    <PageLayout
      bar={bar}
      tabs={tabs}
      print={
        <Scope scope={`d:${date}`}>
          {(all ? DAY_SHEETS.map((_, k) => k) : [sheetIndex]).map(k => <DaySheet key={k} date={date} index={k} />)}
        </Scope>
      }
    >
      <Scope scope={`d:${date}`}><DaySheet date={date} index={sheetIndex} /></Scope>
    </PageLayout>
  );
}
