import { useState } from 'react';
import { Link } from 'wouter';
import { TaskRow, whereHref } from '@/components/tasks';
import { RANGE_END, RANGE_START, clampToRange, fmtLong, inRange, isValidISO, todayISO, weekRangeLabel } from '@/lib/dates';
import { usePlannerStore } from '@/lib/planner-store';
import { isProjectScope, planAdd, scopeDate, useItems } from '@/lib/tasks';
import { PlainPage } from './plain-page';

type View = 'open' | 'done' | 'moved' | 'all';
const VIEWS: [View, string][] = [['open', 'Open'], ['done', 'Done'], ['moved', 'Moved along'], ['all', 'Everything']];

function AddTask() {
  const { values, setMany } = usePlannerStore();
  const [text, setText] = useState('');
  const [date, setDate] = useState(clampToRange(todayISO()));
  const [pri, setPri] = useState('');
  const [msg, setMsg] = useState('');
  const add = () => {
    if (!text.trim()) return;
    if (!isValidISO(date) || !inRange(date)) { setMsg('Pick a day between Nov 1 and Jan 31.'); return; }
    const plan = planAdd(values, `d:${date}`, text.trim(), pri);
    if ('error' in plan) { setMsg(plan.error); return; }
    setMany(plan.updates);
    setText(''); setPri(''); setMsg('Added to ' + fmtLong(date) + '.');
  };
  return (
    <form className="add-task" onSubmit={e => { e.preventDefault(); add(); }}>
      <input className="add-text" placeholder="Write a task…" value={text} onChange={e => setText(e.target.value)} aria-label="New task" data-testid="add-task-text" />
      <input type="date" className="add-date" min={RANGE_START} max={RANGE_END} value={date} onChange={e => setDate(e.target.value)} aria-label="Day for the task" data-testid="add-task-date" />
      <select className="task-select" value={pri} onChange={e => setPri(e.target.value)} aria-label="Priority">
        <option value="">Priority</option><option value="H">High</option><option value="M">Medium</option><option value="L">Low</option>
      </select>
      <button type="submit" className="chip-link is-accent" data-testid="add-task-go">Add</button>
      {msg && <span className="add-msg" role="status">{msg}</span>}
    </form>
  );
}

export default function TasksPage() {
  const all = useItems();
  // This is the "Tasks" list: what you wrote on days and weeks. Project tasks live in their own projects.
  const items = all.filter(i => !isProjectScope(i.scope));
  const [view, setView] = useState<View>('open');
  const shown = items.filter(i => {
    if (view === 'open') return !i.done && !i.moved;
    if (view === 'done') return i.done;
    if (view === 'moved') return !!i.moved;
    return true;
  });
  const groups: { scope: string; list: typeof shown }[] = [];
  for (const i of shown) {
    const last = groups[groups.length - 1];
    if (last && last.scope === i.scope) last.list.push(i); else groups.push({ scope: i.scope, list: [i] });
  }
  return (
    <PlainPage title="Tasks" subtitle="Your everyday task list: everything you have written on a day or a week, in one place. Projects have their own pages, and their tasks do not appear here." testid="tasks-page">
      <AddTask />
      <div className="filter-row">
        <div className="seg" role="tablist" aria-label="Show">
          {VIEWS.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={view === v} className={`seg-btn ${view === v ? 'on' : ''}`} onClick={() => setView(v)} data-testid={`view-${v}`}>{l}</button>)}
        </div>
        <Link href="/projects" className="inline-link">Go to your projects</Link>
      </div>
      {groups.length === 0 ? (
        <p className="soft-hint" data-testid="tasks-empty">Nothing here yet. Tasks you write on the day pages will gather here.</p>
      ) : groups.map(g => (
        <section className="task-group" key={g.scope}>
          <h2 className="group-title">
            <Link href={whereHref(g.scope)} className="inline-link">{g.scope.startsWith('d:') ? fmtLong(scopeDate(g.scope)) : `Week of ${weekRangeLabel(scopeDate(g.scope))} · week list`}</Link>
          </h2>
          {g.list.map(i => <TaskRow key={`${i.prefix}${i.n}`} item={i} meta={i.prefix === 't' ? (i.scope.startsWith('w:') ? 'week' : 'day') : undefined} name={`m-${i.scope}-${i.prefix}-${i.n}`} />)}
        </section>
      ))}
    </PlainPage>
  );
}
