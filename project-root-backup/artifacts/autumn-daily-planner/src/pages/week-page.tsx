import { CalendarDays } from 'lucide-react';
import { Link, Redirect } from 'wouter';
import { PageLayout, PrintMenu, SheetTabs, StepLinks } from '@/components/nav';
import { WEEKS, addDays, clampToRange, monthOf, weekNumber, weekRangeLabel } from '@/lib/dates';
import { Scope } from '@/lib/planner-store';
import { useDocumentTitle, usePrintMode } from '@/lib/use-print';
import { WEEK_SHEETS, WeekSheet } from './week-sheets';

export default function WeekPage({ ws, sheet }: { ws: string; sheet?: string }) {
  const sheetIndex = sheet ? WEEK_SHEETS.findIndex(s => s.slug === sheet) : 0;
  const i = WEEKS.indexOf(ws);
  const { all, printNow } = usePrintMode();
  useDocumentTitle(`Week ${weekNumber(ws)} · ${weekRangeLabel(ws)} · Autumn Planner`);
  if (i < 0 || sheetIndex < 0) return <Redirect to="/" />;

  const prev = WEEKS[i - 1];
  const next = WEEKS[i + 1];
  const slug = WEEK_SHEETS[sheetIndex].slug;
  const month = monthOf(clampToRange(addDays(ws, 3)));

  const bar = (
    <div className="context-bar">
      <div className="context-left">
        <Link href={`/month/${month}`} className="chip-link" data-testid="link-calendar">
          <CalendarDays size={15} strokeWidth={1.7} /> <span>Calendar</span>
        </Link>
      </div>
      <StepLinks
        prev={prev && `/week/${prev}/${slug}`}
        next={next && `/week/${next}/${slug}`}
        prevLabel="Previous week"
        nextLabel="Next week"
      >
        <span className="step-label">Week {weekNumber(ws)} <span className="step-of">of {WEEKS.length}</span></span>
      </StepLinks>
      <div className="context-actions">
        <PrintMenu
          options={[
            { label: 'Print this sheet', run: () => printNow(false) },
            { label: `Print both week sheets`, run: () => printNow(true) },
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
