import { Link, Redirect, useLocation } from 'wouter';
import { PageLayout, PrintMenu, SheetTabs, StepLinks } from '@/components/nav';
import { WEEKS, addDays, fmtMonthDayShort, fmtWeekday, inRange, todayISO, weekNumber, weekRangeLabel } from '@/lib/dates';
import { Scope } from '@/lib/planner-store';
import { useDocumentTitle, usePrintMode } from '@/lib/use-print';
import { WEEK_SHEETS, WeekSheet } from './week-sheets';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function WeekPicker({ ws, slug }: { ws: string; slug: string }) {
  const [, setLocation] = useLocation();
  return (
    <label className="week-picker">
      <span className="sr-only">Choose a week</span>
      <select value={ws} onChange={e => setLocation(`/week/${e.target.value}/${slug}`)} aria-label="Choose a week" data-testid="week-picker">
        {WEEKS.map(w => <option key={w} value={w}>{`Week ${weekNumber(w)} \u00b7 ${fmtMonthDayShort(w)} \u2013 ${fmtMonthDayShort(addDays(w, 6))}`}</option>)}
      </select>
      <span className="step-of">of {WEEKS.length}</span>
    </label>
  );
}

export default function WeekPage({ ws, sheet }: { ws: string; sheet?: string }) {
  const sheetIndex = sheet ? WEEK_SHEETS.findIndex(s => s.slug === sheet) : 0;
  const i = WEEKS.indexOf(ws);
  const { all, printNow } = usePrintMode();
  useDocumentTitle(`Week ${weekNumber(ws)} · ${weekRangeLabel(ws)} · Autumn Planner`);
  if (i < 0 || sheetIndex < 0) return <Redirect to="/" />;

  const prev = WEEKS[i - 1];
  const next = WEEKS[i + 1];
  const slug = WEEK_SHEETS[sheetIndex].slug;
  const today = todayISO();

  const bar = (
    <div className="context-bar">
      <div className="context-left">
        <nav className="day-letters" aria-label="Days of this week">
          {LETTERS.map((letter, k) => {
            const d = addDays(ws, k);
            const label = `${fmtWeekday(d)}, ${fmtMonthDayShort(d)}`;
            return inRange(d) ? (
              <Link key={d} href={`/day/${d}`} className={`day-letter ${d === today ? 'is-today' : ''}`} aria-label={label} title={label} data-testid={`weekday-${k}`}>{letter}</Link>
            ) : (
              <span key={d} className="day-letter is-outside" aria-hidden="true">{letter}</span>
            );
          })}
        </nav>
      </div>
      <StepLinks
        prev={prev && `/week/${prev}/${slug}`}
        next={next && `/week/${next}/${slug}`}
        prevLabel="Previous week"
        nextLabel="Next week"
      >
        <WeekPicker ws={ws} slug={slug} />
      </StepLinks>
      <div className="context-actions">
        <PrintMenu
          options={[
            { label: 'Print this sheet', run: () => printNow(false) },
            { label: `Print all week sheets`, run: () => printNow(true) },
          ]}
        />
      </div>
    </div>
  );

  const tabs = (
    <SheetTabs
      label="Week sheets"
      active={sheetIndex}
      tabs={WEEK_SHEETS.map(s => ({ href: `/week/${ws}/${s.slug}`, label: s.label, testid: `tab-week-${s.slug}` }))}
    />
  );

  return (
    <PageLayout
      bar={bar}
      tabs={tabs}
      print={
        <Scope scope={`w:${ws}`}>
          {(all ? WEEK_SHEETS.map((_, k) => k) : [sheetIndex]).map(k => <WeekSheet key={k} ws={ws} index={k} />)}
        </Scope>
      }
    >
      <Scope scope={`w:${ws}`}><WeekSheet ws={ws} index={sheetIndex} /></Scope>
    </PageLayout>
  );
}
