import { Link } from 'wouter';
import { CheckInput, LineInput, PlainTextarea, TextField } from '@/components/fields';
import { SheetFrame } from '@/components/sheet';
import { usePlannerStore } from '@/lib/planner-store';
import { addDays, dayNumber, fmtMonthDayShort, fmtWeekday, fmtWeekdayShort, inRange, weekNumber, weekRangeLabel, WEEKS } from '@/lib/dates';

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const weekDays = (ws: string) => Array.from({ length: 7 }, (_, i) => addDays(ws, i));

function GlanceBody({ ws }: { ws: string }) {
  const { daysWithEntries } = usePlannerStore();
  return (
    <>
      <TextField name="focus" label="This week's focus" rows={3} ruled />
      <div className="section-label" style={{ marginTop: 22 }}><span className="label-dot" />Three things for the week</div>
      {Array.from({ length: 3 }, (_, i) => (
        <div className="check-row" key={i}>
          <CheckInput name={`top-done-${i}`} label={`Mark weekly priority ${i + 1} complete`} />
          <LineInput name={`top-${i}`} label={`Weekly priority ${i + 1}`} className="priority-input" />
        </div>
      ))}
      <div className="section-label" style={{ marginTop: 26 }}><span className="label-dot" />The days</div>
      <div className="week-days">
        {weekDays(ws).map((d, i) => {
          const open = inRange(d);
          const mark = daysWithEntries.has(d);
          const label = (
            <>
              <span className="wd-name">{fmtWeekdayShort(d)}</span>
              <span className="wd-num">{dayNumber(d)}</span>
              {mark && <span className="wd-dot" aria-label="has entries" />}
            </>
          );
          return (
            <div className={`week-day-row ${open ? '' : 'is-outside'}`} key={d}>
              {open ? (
                <Link href={`/day/${d}`} className="week-day-link" aria-label={`Open ${fmtWeekday(d)}, ${fmtMonthDayShort(d)}`} data-testid={`link-day-${d}`}>
                  {label}
                </Link>
              ) : (
                <span className="week-day-link muted">{label}</span>
              )}
              <LineInput name={`daynote-${i}`} label={`Note for ${fmtWeekday(d)}`} />
            </div>
          );
        })}
      </div>
      <TextField name="notes" label="Notes for the week" rows={4} ruled className="week-notes" />
    </>
  );
}

const MEALS = ['Breakfast', 'Lunch', 'Dinner'];

function HabitsMealsBody({ ws }: { ws: string }) {
  const days = weekDays(ws);
  return (
    <>
      <div className="section-label"><span className="label-dot" />Habit tracker</div>
      <table className="habit-table">
        <thead>
          <tr>
            <th scope="col">Habit</th>
            {days.map((d, i) => (
              <th scope="col" key={d}><span className="ht-letter">{LETTERS[i]}</span><span className="ht-num">{dayNumber(d)}</span></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, row) => (
            <tr key={row}>
              <td><LineInput name={`habit-name-${row}`} label={`Habit name ${row + 1}`} className="habit-name" /></td>
              {days.map((d, col) => (
                <td key={d}><CheckInput name={`habit-${row}-${col}`} label={`Habit ${row + 1}, ${fmtWeekday(d)}`} className="habit-check" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="section-label" style={{ marginTop: 30 }}><span className="label-dot" />Meals for the week</div>
      <div className="meal-week">
        {days.map((d, i) => (
          <div className="meal-week-row" key={d}>
            <div className="mw-day"><span>{fmtWeekdayShort(d)}</span><b>{dayNumber(d)}</b></div>
            {MEALS.map(meal => (
              <label className="mw-cell" key={meal}>
                <span className="mw-label">{meal}</span>
                <LineInput name={`meal-${i}-${meal.toLowerCase()}`} label={`${meal} on ${fmtWeekday(d)}`} />
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="section-label" style={{ marginTop: 24 }}><span className="label-dot" />Groceries &amp; pantry</div>
      <PlainTextarea name="groceries" label="Groceries and pantry" className="field-textarea ruled-area grocery-notes" style={{ minHeight: 120 }} />
    </>
  );
}

export const WEEK_SHEETS = [
  { slug: 'glance', label: 'Week at a glance', title: 'The week, gently', Body: GlanceBody },
  { slug: 'habits', label: 'Habits & meals', title: 'Habits & meals', Body: HabitsMealsBody },
] as const;

export function WeekSheet({ ws, index }: { ws: string; index: number }) {
  const sheet = WEEK_SHEETS[index];
  const n = String(index + 1).padStart(2, '0');
  const total = String(WEEK_SHEETS.length).padStart(2, '0');
  return (
    <SheetFrame
      label={`${sheet.label} for the week of ${weekRangeLabel(ws)}`}
      eyebrow={`Week ${weekNumber(ws)} of ${WEEKS.length} · sheet ${n}`}
      title={sheet.title}
      subtitle={weekRangeLabel(ws)}
      folio={`${n} / ${total}`}
      art={index === 0}
      className={index === 0 ? 'week-glance' : 'week-habits'}
      footerLeft="Autumn, at your own pace"
      footerRight={`week ${weekNumber(ws)}`}
    >
      <sheet.Body ws={ws} />
    </SheetFrame>
  );
}
