import { CalendarCheck } from 'lucide-react';
import { Link } from 'wouter';
import { PageLayout, PrintMenu } from '@/components/nav';
import { MONTHS, inRange, monthParts, todayISO } from '@/lib/dates';
import { Scope } from '@/lib/planner-store';
import { useDocumentTitle, usePrintMode } from '@/lib/use-print';
import { MonthSheet } from './month-sheet';

export default function MonthPage({ ym }: { ym: string }) {
  const today = todayISO();
  const { name, year } = monthParts(ym);
  const { printNow } = usePrintMode();
  useDocumentTitle(`${name} ${year} · Autumn Planner`);

  const bar = (
    <div className="context-bar">
      <nav className="month-tabs" aria-label="Months">
        {MONTHS.map(m => {
          const p = monthParts(m);
          return (
            <Link
              key={m}
              href={`/month/${m}`}
              className={`month-tab ${m === ym ? 'active' : ''}`}
              aria-current={m === ym ? 'page' : undefined}
              data-testid={`tab-month-${m}`}
            >
              <span className="mt-full">{p.name}</span>
              <span className="mt-short">{p.short}</span>
              <span className="mt-year">{p.year}</span>
            </Link>
          );
        })}
      </nav>
      <div className="context-actions">
        {inRange(today) && (
          <Link href={`/day/${today}`} className="chip-link" data-testid="link-today">
            <CalendarCheck size={15} strokeWidth={1.7} /> <span>Today</span>
          </Link>
        )}
        <PrintMenu options={[{ label: 'Print this month', run: () => printNow(true) }]} />
      </div>
    </div>
  );

  return (
    <PageLayout bar={bar} print={<Scope scope={`m:${ym}`}><MonthSheet ym={ym} /></Scope>}>
      <Scope scope={`m:${ym}`}><MonthSheet ym={ym} /></Scope>
    </PageLayout>
  );
}
