import { Link } from 'wouter';
import { PlainTextarea, TextField } from '@/components/fields';
import { SheetFrame } from '@/components/sheet';
import { usePlannerStore } from '@/lib/planner-store';
import { dayNumber, fmtLong, monthGrid, monthParts, todayISO, weekNumber } from '@/lib/dates';

const HEAD = [
  ['S', 'Sunday'], ['M', 'Monday'], ['T', 'Tuesday'], ['W', 'Wednesday'], ['T', 'Thursday'], ['F', 'Friday'], ['S', 'Saturday'],
];

export function MonthSheet({ ym }: { ym: string }) {
  const { daysWithEntries, weeksWithEntries } = usePlannerStore();
  const today = todayISO();
  const { name, year } = monthParts(ym);
  const rows = monthGrid(ym);

  return (
    <SheetFrame
      label={`${name} ${year} calendar page`}
      eyebrow="Month at a glance"
      title={name}
      subtitle={String(year)}
      art
      className="month-sheet"
      footerLeft="Autumn, at your own pace"
      footerRight={`${name} ${year}`}
    >
      <table className="cal-table">
        <caption className="sr-only">{`${name} ${year}`}</caption>
        <thead>
          <tr>
            <th scope="col" className="cal-wk-head">Wk</th>
            {HEAD.map(([letter, full], i) => (
              <th scope="col" key={i} abbr={full}><span aria-hidden="true">{letter}</span><span className="sr-only">{full}</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.weekStart}>
              <th scope="row" className="cal-wk">
                <Link
                  href={`/week/${row.weekStart}`}
                  className={`cal-wk-link ${weeksWithEntries.has(row.weekStart) ? 'has-entries' : ''}`}
                  aria-label={`Open week ${weekNumber(row.weekStart)}`}
                  data-testid={`link-week-${row.weekStart}`}
                >
                  {weekNumber(row.weekStart)}
                </Link>
              </th>
              {row.days.map((d, i) =>
                d ? (
                  <td key={d} className="cal-cell">
                    <Link
                      href={`/day/${d}`}
                      className={`cal-day ${d === today ? 'is-today' : ''} ${daysWithEntries.has(d) ? 'has-entries' : ''}`}
                      aria-label={`${fmtLong(d)}${d === today ? ', today' : ''}${daysWithEntries.has(d) ? ', has entries' : ''}`}
                      aria-current={d === today ? 'date' : undefined}
                      data-testid={`link-day-${d}`}
                    >
                      <span className="cal-num">{dayNumber(d)}</span>
                      <span className="cal-dot" aria-hidden="true" />
                    </Link>
                  </td>
                ) : (
                  <td key={`e${i}`} className="cal-cell cal-empty" />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cal-legend" aria-hidden="true">
        <span className="cal-hint">tap a day to open it, or a week number for the week</span>
        <span><i className="lg-today" />today</span>
        <span><i className="lg-dot" />has writing</span>
      </div>
      <div className="month-fields">
        <TextField name="focus" label={`${name} focus`} rows={3} ruled />
        <div className="section-label" style={{ marginTop: 18 }}><span className="label-dot" />Notes for the month</div>
        <PlainTextarea name="notes" label={`Notes for ${name}`} className="field-textarea ruled-area month-notes" style={{ minHeight: 130 }} />
      </div>
    </SheetFrame>
  );
}
