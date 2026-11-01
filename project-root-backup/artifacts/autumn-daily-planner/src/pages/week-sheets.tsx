import { Link } from 'wouter';
import { CheckInput, LineInput, PlainTextarea, TextField } from '@/components/fields';
import { SheetFrame } from '@/components/sheet';
import { usePlannerStore } from '@/lib/planner-store';
import { TaskRow } from '@/components/tasks';
import { addDays, dayNumber, fmtMonthDayShort, fmtWeekday, fmtWeekdayShort, inRange, weekNumber, weekRangeLabel, WEEKS } from '@/lib/dates';
import { HABIT_ROWS, useHabits } from '@/lib/habits';
import { WEEK_TASK_SLOTS, useItems } from '@/lib/tasks';

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
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function WeekTasksBody({ ws }: { ws: string }) {
  const items = useItems();
  const days = weekDays(ws).filter(d => inRange(d));
  const scheduled = items.filter(i => i.scope.startsWith('d:') && days.includes(i.scope.slice(2)) && !i.done && !i.moved);
  return (
    <>
      <div className="section-label"><span className="label-dot" />This week &middot; no day yet</div>
      {range(WEEK_TASK_SLOTS).map(n => <TaskRow key={n} meta item={{ scope: `w:${ws}`, prefix: 't', n }} name={`wt-${n}`} />)}
      <div className="section-label sched-label"><span className="label-dot" />Already on a day this week</div>
      {scheduled.length === 0 ? (
        <p className="soft-hint">Tasks you write on a day&rsquo;s page will gather here, so the week is easy to see at once.</p>
      ) : (
        <div className="sched-list">
          {scheduled.slice(0, 16).map(i => <TaskRow key={`${i.scope}${i.prefix}${i.n}`} item={i} showWhere name={`sched-${i.scope}-${i.prefix}-${i.n}`} />)}
        </div>
      )}
    </>
  );
}

function HabitsBody({ ws }: { ws: string }) {
  const days = weekDays(ws);
  const { names, setName, isDone, setDone } = useHabits(ws);
  return (
    <>
      <div className="section-label"><span className="label-dot" />Habit tracker &middot; names carry on to next week</div>
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
          {range(HABIT_ROWS).map(row => (
            <tr key={row}>
              <td><input className="habit-name" aria-label={`Habit name ${row + 1}`} data-testid={`input-habit-name-${row}`} value={names[row]} onChange={e => setName(row, e.target.value)} /></td>
              {days.map((d, col) => (
                <td key={d}>
                  <input type="checkbox" className="check-input habit-check" aria-label={`Habit ${row + 1}, ${fmtWeekday(d)}`} data-testid={`checkbox-habit-${row}-${col}`}
                    checked={isDone(row, col)} onChange={e => setDone(row, col, e.target.checked)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="reading-layout">
        <div>
          <div className="section-label"><span className="label-dot" />Reading &amp; learning</div>
          <div className="mini-field"><span className="mini-cap">Title</span><LineInput name="book-title" label="Book title" className="field-input" /></div>
          <div className="mini-field"><span className="mini-cap">Author or source</span><LineInput name="book-author" label="Author or source" className="field-input" /></div>
          <div className="two-column">
            <div className="mini-field"><span className="mini-cap">Progress</span><LineInput name="book-progress" label="Progress" className="field-input" /></div>
            <div className="mini-field"><span className="mini-cap">Started &middot; finished</span><LineInput name="book-dates" label="Started and finished" className="field-input" /></div>
          </div>
          <div className="section-label" style={{ marginTop: 8 }}><span className="label-dot" />Passages &amp; notes to keep</div>
          <PlainTextarea name="passages" label="Passages and notes to keep" className="field-textarea ruled-area passages-area" />
        </div>
        <div>
          <div className="section-label"><span className="label-dot" />Curiosities &middot; things to look up</div>
          <p className="soft-hint curi-hint">A question you&rsquo;d love to follow up on someday.</p>
          {range(7).map(i => <LineInput key={i} name={`curi-${i}`} label={`Curiosity ${i + 1}`} className="row-input ruled-line" />)}
        </div>
      </div>
    </>
  );
}

function MealsBody({ ws }: { ws: string }) {
  const days = weekDays(ws);
  return (
    <>
      <div className="section-label"><span className="label-dot" />Meals for the week</div>
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
      <PlainTextarea name="groceries" label="Groceries and pantry" className="field-textarea ruled-area grocery-notes" style={{ minHeight: 190 }} />
    </>
  );
}

function ReviewBody({ ws }: { ws: string }) {
  const items = useItems();
  const days = weekDays(ws);
  const { names, isDone } = useHabits(ws);
  const inWeek = (scope: string) => scope === `w:${ws}` || (scope.startsWith('d:') && days.includes(scope.slice(2)));
  const finished = items.filter(i => inWeek(i.scope) && i.done);
  const moved = items.filter(i => inWeek(i.scope) && i.moved);
  const open = items.filter(i => inWeek(i.scope) && !i.done && !i.moved);
  const habits = names.map((n, r) => ({ n, r })).filter(h => h.n.trim());
  const label = (scope: string) => (scope.startsWith('d:') ? fmtMonthDayShort(scope.slice(2)) : 'week list');
  return (
    <>
      <div className="review-stats">
        <div><b>{finished.length}</b><span>finished</span></div>
        <div><b>{moved.length}</b><span>moved along</span></div>
        <div><b>{open.length}</b><span>still open</span></div>
      </div>
      <div className="section-label"><span className="label-dot" />What you finished</div>
      {finished.length === 0 ? (
        <p className="soft-hint">As you check things off during the week, they will be listed here.</p>
      ) : (
        <ul className="review-list" data-testid="review-finished">
          {finished.slice(0, 20).map(i => <li key={`${i.scope}${i.prefix}${i.n}`}><span>{i.text}</span><i>{label(i.scope)}</i></li>)}
          {finished.length > 20 && <li className="more"><span>and {finished.length - 20} more</span></li>}
        </ul>
      )}
      <div className="section-label" style={{ marginTop: 16 }}><span className="label-dot" />Habits this week</div>
      {habits.length === 0 ? (
        <p className="soft-hint">Your habits will show here once you have written them.</p>
      ) : (
        <div className="habit-tally">
          {habits.map(({ n, r }) => {
            const count = days.filter((_, c) => isDone(r, c)).length;
            return (
              <div className="tally-row" key={r} data-testid={`tally-${r}`}>
                <span className="tally-name">{n}</span>
                <span className="tally-dots" aria-hidden="true">{days.map((_, c) => <i key={c} className={isDone(r, c) ? 'on' : ''} />)}</span>
                <span className="tally-count">{count} of 7</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="review-fields">
        <TextField name="rev-wins" label="What went well" rows={3} ruled className="rev-a" />
        <TextField name="rev-learn" label="What I learned" rows={3} ruled className="rev-b" />
        <TextField name="rev-next" label="For next week" rows={3} ruled className="rev-c" />
      </div>
    </>
  );
}

export const WEEK_SHEETS = [
  { slug: 'glance', label: 'Week at a glance', title: 'The week, gently', Body: GlanceBody },
  { slug: 'tasks', label: 'Tasks this week', title: 'Tasks this week', Body: WeekTasksBody },
  { slug: 'habits', label: 'Habits & reading', title: 'Habits & reading', Body: HabitsBody },
  { slug: 'meals', label: 'Meals & groceries', title: 'Meals & groceries', Body: MealsBody },
  { slug: 'review', label: 'Weekly review', title: 'Weekly review', Body: ReviewBody },
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
      className={`week-sheet week-${sheet.slug}${index === 0 ? ' week-glance' : ''}`}
      footerLeft="Autumn, at your own pace"
      footerRight={`week ${weekNumber(ws)}`}
    >
      <sheet.Body ws={ws} />
    </SheetFrame>
  );
}
