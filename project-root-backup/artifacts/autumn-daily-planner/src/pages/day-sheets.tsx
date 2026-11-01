import { useId, type ReactElement } from 'react';
import { Link } from 'wouter';
import { CheckInput, LineInput, PlainTextarea, RadioChoice, TextField } from '@/components/fields';
import { PhotoOfDay } from '@/components/photo';
import { SheetFrame } from '@/components/sheet';
import { ProjectSelect, TaskRow, useMover } from '@/components/tasks';
import { HOLIDAYS } from '@/lib/holidays';
import {
  addDays, fmtLong, fmtMonthDayShort, fmtWeekday, fromISO, weekNumber, weekStart,
} from '@/lib/dates';
import { useHabits } from '@/lib/habits';
import { useField, usePlannerStore, useRawField } from '@/lib/planner-store';
import { DAY_TASK_SLOTS, planAdd, useItems, type TaskItem } from '@/lib/tasks';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/* ---------- 1. Begin gently ---------- */

function TodayHabits({ date }: { date: string }) {
  const ws = weekStart(date);
  const col = fromISO(date).getDay();
  const { names, isDone, setDone } = useHabits(ws);
  const rows = names.map((n, r) => ({ n, r })).filter(x => x.n.trim());
  return (
    <div className="today-habits">
      <div className="section-label"><span className="label-dot" />Habits for today</div>
      {rows.length === 0 ? (
        <p className="soft-hint">
          Write your habits once on <Link href={`/week/${ws}/habits`} className="inline-link">this week's Habits page</Link> and they will appear here.
        </p>
      ) : (
        <div className="habit-chips">
          {rows.map(({ n, r }) => (
            <label className="habit-chip" key={r}>
              <input type="checkbox" className="check-input" checked={isDone(r, col)} onChange={e => setDone(r, col, e.target.checked)} data-testid={`today-habit-${r}`} aria-label={`${n}, ${fmtWeekday(date)}`} />
              <span>{n}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function ListenStrip({ date }: { date: string }) {
  const ws = weekStart(date);
  const [title] = useRawField(`w:${ws}:book-title`);
  const [author] = useRawField(`w:${ws}:book-author`);
  return (
    <div className="listen-strip">
      <div className="section-label"><span className="label-dot" />In the car &middot; this week's book</div>
      <div className="listen-row">
        <div className="listen-book">
          {title.trim() ? (
            <><b>{title}</b>{author.trim() && <span>{' \u00b7 '}{author}</span>}</>
          ) : (
            <span className="soft-hint">Add this week's book on <Link href={`/week/${ws}/habits`} className="inline-link">the Habits &amp; reading page</Link>.</span>
          )}
        </div>
        <LineInput name="listen" label="Where I left off today" className="row-input listen-input" />
      </div>
    </div>
  );
}

function FocusProjects({ date }: { date: string }) {
  const items = useItems();
  const { values } = usePlannerStore();
  const { move } = useMover();
  const [p0, setP0] = useField('focus-proj-0');
  const [p1, setP1] = useField('focus-proj-1');
  const today = `d:${date}`;
  const block = (id: string, set: (v: string) => void, k: number) => {
    const next = typeof values[`proj:${id}:next`] === 'string' ? (values[`proj:${id}:next`] as string) : '';
    const open = id === '' ? [] : items.filter(i => i.proj === id && !i.done && !i.moved).slice(0, 4);
    return (
      <div className="focus-block" key={k}>
        <ProjectSelect value={id} onChange={set} label={`Project in focus ${k + 1}`} className="task-select focus-select" />
        {id !== '' && next.trim() && <div className="focus-next"><i>next step</i> {next}</div>}
        {open.map((i, idx) => (
          <div className={`focus-task ${idx >= 2 ? 'extra' : ''}`} key={`${i.scope}${i.prefix}${i.n}`}>
            <span className="focus-text">{i.text}</span>
            {i.scope !== today && (
              <button type="button" className="mini-btn print-hide" onClick={() => move(i, today)} data-testid={`bring-${i.n}`}>Bring to today</button>
            )}
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className="focus-projects">
      <div className="section-label"><span className="label-dot" />Current project focus</div>
      <div className="focus-grid">{block(p0, setP0, 0)}{block(p1, setP1, 1)}</div>
    </div>
  );
}

function FromEarlier({ date }: { date: string }) {
  const items = useItems();
  const { values, setMany } = usePlannerStore();
  const { move } = useMover();
  const today = `d:${date}`;
  const thisWeek = `w:${weekStart(date)}`;
  const open = items
    .filter(i => !i.done && !i.moved && ((i.scope.startsWith('d:') && i.scope.slice(2) < date) || i.scope === thisWeek))
    .sort((a, b) => (a.scope < b.scope ? 1 : -1))
    .slice(0, 8);
  const prev = addDays(date, -1);
  const last = range(3).map(i => String(values[`d:${prev}:tom-${i}`] ?? '')).filter(t => t.trim());
  const mine = (i: TaskItem) => i.scope === thisWeek ? 'on this week’s list' : fmtMonthDayShort(i.scope.slice(2));
  if (open.length === 0 && last.length === 0) return null;
  const addToday = (text: string) => {
    const plan = planAdd(values, today, text);
    if ('updates' in plan) setMany(plan.updates);
  };
  return (
    <div className="from-earlier screen-only" data-testid="from-earlier">
      <div className="section-label"><span className="label-dot" />From earlier &middot; bring along if you like</div>
      {last.map((t, k) => (
        <div className="earlier-row" key={`l${k}`}>
          <span className="earlier-text">{t}</span><span className="earlier-from">you wrote this last night</span>
          <button type="button" className="mini-btn" onClick={() => addToday(t)}>Add to today</button>
        </div>
      ))}
      {open.map(i => (
        <div className="earlier-row" key={`${i.scope}${i.prefix}${i.n}`}>
          <span className="earlier-text">{i.text}</span><span className="earlier-from">{mine(i)}</span>
          <button type="button" className="mini-btn" onClick={() => move(i, today)} data-testid="bring-earlier">Bring to today</button>
        </div>
      ))}
    </div>
  );
}

function BeginSheet({ date }: { date: string }) {
  const holiday = HOLIDAYS[date];
  return (
    <>
      <div className="begin-top">
        <div className="mini-field"><span className="section-label">Weather</span><LineInput name="weather" label="Weather" className="row-input boxed" /></div>
        <div className="mini-field">
          <span className="section-label">Special day</span>
          <LineInput name="special" label="Special day or event" className="row-input boxed" />
          {holiday && <span className="holiday-tag">{holiday.label}</span>}
        </div>
      </div>
      <div className="reminders-box">
        <div className="section-label"><span className="label-dot" />Reminders &middot; follow-ups &amp; calls</div>
        {range(3).map(i => <LineInput key={i} name={`rem-${i}`} label={`Reminder ${i + 1}`} className="row-input ruled-line" />)}
      </div>
      <ListenStrip date={date} />
      <FromEarlier date={date} />
      <div className="begin-cols">
        <div>
          <TextField name="intention" label="Today's intention" />
          <div className="section-label"><span className="label-dot" />Top priorities &middot; choose three</div>
          {range(3).map(n => <TaskRow key={n} item={{ scope: `d:${date}`, prefix: 'p', n }} name={`p-${n}`} />)}
        </div>
        <div>
          <div className="section-label"><span className="label-dot" />Appointments</div>
          {range(4).map(i => (
            <div className="appt-row" key={i}>
              <LineInput name={`appt-${i}-time`} label={`Appointment ${i + 1} time`} className="row-input appt-time" />
              <LineInput name={`appt-${i}-text`} label={`Appointment ${i + 1} detail`} className="row-input ruled-line" />
            </div>
          ))}
        </div>
      </div>
      <TodayHabits date={date} />
      <FocusProjects date={date} />
      <div className="section-label brain-label"><span className="label-dot" />Notes &amp; brain dump</div>
      <PlainTextarea name="brain" label="Notes and brain dump" className="field-textarea ruled-area brain-area" />
    </>
  );
}

/* ---------- 2. The day by hour ---------- */

const HOURS = ['6 am', '7 am', '8 am', '9 am', '10 am', '11 am', '12 pm', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm', '9 pm', '10 pm'];

function HoursSheet() {
  return (
    <div className="hours-layout">
      <div className="hours-col">
        <div className="section-label"><span className="label-dot" />Schedule &middot; write in each block</div>
        {HOURS.map(h => (
          <div className="write-row hour-row" key={h}>
            <span className="time-label">{h}</span>
            <LineInput name={`h-${h.replace(' ', '')}`} label={`Schedule entry at ${h}`} />
          </div>
        ))}
      </div>
      <div className="side-col">
        {[['side-focus', 'Focus blocks'], ['side-must', 'Must do'], ['side-calls', 'Calls & messages'], ['side-errands', 'Errands & travel']].map(([n, l]) => (
          <div className="side-box" key={n}>
            <div className="section-label"><span className="label-dot" />{l}</div>
            <PlainTextarea name={n} label={l} className="field-textarea ruled-area side-area" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 3. Tasks & projects ---------- */

function TasksSheet({ date }: { date: string }) {
  return (
    <>
      <div className="task-head" aria-hidden="true"><span /><span>Task</span><span>Priority &middot; due &middot; project</span></div>
      {range(DAY_TASK_SLOTS).map(n => <TaskRow key={n} meta item={{ scope: `d:${date}`, prefix: 't', n }} />)}
      <div className="two-column task-notes">
        <TextField name="proj-notes" label="Project notes · next steps" rows={3} ruled />
        <TextField name="waiting" label="Waiting on · follow up later" rows={3} ruled />
      </div>
    </>
  );
}

/* ---------- 4. Nourish ---------- */

const MEAL_NAMES = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snacks', 'Snacks & drinks']];

function NourishSheet() {
  return (
    <div className="nourish-layout">
      <section>
        <div className="section-label"><span className="label-dot" />Meals &middot; plan or record</div>
        {MEAL_NAMES.map(([id, label]) => (
          <div className="meal-block" key={id}>
            <div className="meal-kind">{label}</div>
            <PlainTextarea name={`meal-${id}`} label={label} className="field-textarea ruled-area meal-area" />
          </div>
        ))}
      </section>
      <section>
        <div className="section-label"><span className="label-dot" />Water &middot; fill one for each glass</div>
        <div className="water-track">{range(8).map(i => <CheckInput key={i} name={`water-${i}`} label={`Water glass ${i + 1}`} className="water-check" />)}</div>
        <div className="hint-text">Each mark is a small pause.</div>
        <div className="section-label grocery-label"><span className="label-dot" />Grocery &amp; pantry &middot; what to pick up</div>
        <PlainTextarea name="grocery" label="Grocery and pantry" className="field-textarea ruled-area grocery-area" />
      </section>
    </div>
  );
}

/* ---------- 5. Move & rest ---------- */

const MOODS = ['Settled', 'Bright', 'Tender', 'Tired', 'Other'];

function MoveSheet() {
  const moodGroup = useId();
  const restGroup = useId();
  return (
    <div className="move-layout">
      <section>
        <div className="movement-box">
          <div className="section-label"><span className="label-dot" />Movement</div>
          <LineInput name="mv-activity" label="Movement activity" className="field-input" />
          <div className="two-column mv-nums">
            <div><div className="section-label">Minutes</div><LineInput name="mv-minutes" label="Minutes moved" className="field-input" /></div>
            <div><div className="section-label">Distance</div><LineInput name="mv-distance" label="Distance" className="field-input" /></div>
          </div>
          <div className="section-label" style={{ marginTop: 12 }}>How it felt</div>
          <LineInput name="mv-feeling" label="How movement felt" className="field-input" />
        </div>
        <div className="movement-box">
          <div className="section-label"><span className="label-dot" />Rest</div>
          <div className="two-column mv-nums">
            <div><div className="section-label">Bedtime</div><LineInput name="sleep-bed" label="Bedtime" className="field-input" /></div>
            <div><div className="section-label">Wake</div><LineInput name="sleep-wake" label="Wake time" className="field-input" /></div>
          </div>
          <div className="section-label" style={{ marginTop: 12 }}>How rested, 1 to 5</div>
          <div className="rest-scale">
            {[1, 2, 3, 4, 5].map(n => (
              <label key={n} className="rest-opt"><RadioChoice name="rest" group={restGroup} option={String(n)} label={`Rested ${n} of 5`} /><span>{n}</span></label>
            ))}
          </div>
        </div>
      </section>
      <section>
        <div className="section-label"><span className="label-dot" />Mood, just now</div>
        <div className="mood-scale"><span aria-hidden="true" />{[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}</div>
        <div className="mood-list">
          {MOODS.map(mood => (
            <div className="mood-item" key={mood}>
              <span className="mood-name">{mood}</span>
              {[1, 2, 3, 4, 5].map(level => (
                <RadioChoice key={level} name="mood" group={moodGroup} option={`${mood}-${level}`} label={`${mood}, ${level} of 5`} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22 }}><TextField name="move-note" label="A note to myself" rows={4} ruled /></div>
      </section>
    </div>
  );
}

/* ---------- 6. Evening reflection ---------- */

function CarryForward({ date }: { date: string }) {
  const items = useItems().filter(i => i.scope === `d:${date}` && !i.done);
  return (
    <div className="carry-box">
      <div className="section-label"><span className="label-dot" />Carry forward &middot; unfinished tasks</div>
      {items.length === 0 ? (
        <p className="soft-hint">Nothing waiting. Tasks you haven&rsquo;t checked off will gather here, each with an arrow to move it to another day.</p>
      ) : (
        items.slice(0, 7).map(i => <TaskRow key={`${i.prefix}${i.n}`} item={i} name={`carry-${i.prefix}-${i.n}`} />)
      )}
    </div>
  );
}

function EveningSheet({ date }: { date: string }) {
  return (
    <div className="evening-layout">
      <section>
        <TextField name="win" label="Wins, large & small" rows={4} ruled className="ev-win" />
        <TextField name="learn" label="Noticed & learned" rows={4} ruled className="ev-learn" />
        <div className="section-label"><span className="label-dot" />Gratitude &middot; three, big or small</div>
        {range(3).map(i => <LineInput key={i} name={`grat-${i}`} label={`Gratitude ${i + 1}`} className="row-input ruled-line" />)}
        <TextField name="joy" label="Small joys" rows={3} ruled className="ev-joy" />
      </section>
      <section>
        <div className="section-label"><span className="label-dot" />Tomorrow&rsquo;s top three</div>
        {range(3).map(i => <LineInput key={i} name={`tom-${i}`} label={`Tomorrow's priority ${i + 1}`} className="row-input ruled-line" />)}
        <TextField name="gentle" label="Gentle reminders" rows={3} ruled className="ev-gentle" />
        <CarryForward date={date} />
        <div className="section-label"><span className="label-dot" />Picture of the day</div>
        <PhotoOfDay date={date} />
      </section>
    </div>
  );
}

export const DAY_SHEETS = [
  { slug: 'begin', label: 'Begin gently', title: 'Today, begin gently', Body: BeginSheet },
  { slug: 'hours', label: 'The day by hour', title: 'The day by hour', Body: HoursSheet },
  { slug: 'tasks', label: 'Tasks & projects', title: 'Tasks & projects', Body: TasksSheet },
  { slug: 'nourish', label: 'Nourish', title: 'Nourish', Body: NourishSheet },
  { slug: 'move', label: 'Move & rest', title: 'Move & rest', Body: MoveSheet },
  { slug: 'evening', label: 'Evening reflection', title: 'Evening reflection', Body: EveningSheet },
] as const;

export function DaySheet({ date, index }: { date: string; index: number }) {
  const sheet = DAY_SHEETS[index];
  const n = String(index + 1).padStart(2, '0');
  const total = String(DAY_SHEETS.length).padStart(2, '0');
  const wk = weekNumber(weekStart(date));
  const Body = sheet.Body as (p: { date: string }) => ReactElement;
  return (
    <SheetFrame
      label={`${sheet.label} page for ${fmtLong(date)}`}
      eyebrow={`Week ${wk} · sheet ${n}`}
      title={sheet.title}
      subtitle={fmtLong(date)}
      folio={`${n} / ${total}`}
      art={index === 0}
      className={`day-sheet day-${sheet.slug}`}
      footerLeft="Autumn, at your own pace"
      footerRight={`${n} — ${total}`}
    >
      <Body date={date} />
    </SheetFrame>
  );
}

