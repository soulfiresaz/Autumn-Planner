import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ProjectSelect, TaskRow, whereHref } from '@/components/tasks';
import { RANGE_END, RANGE_START, clampToRange, fmtLong, inRange, isValidISO, todayISO, weekRangeLabel } from '@/lib/dates';
import { usePlannerStore } from '@/lib/planner-store';
import { planAdd, scopeDate, useItems, useProjects } from '@/lib/tasks';
import { PlainPage } from './plain-page';

type View = 'open' | 'done' | 'moved' | 'all';
const VIEWS: [View, string][] = [['open', 'Open'], ['done', 'Done'], ['moved', 'Moved along'], ['all', 'Everything']];

function AddTask() {
  const { values, setMany } = usePlannerStore();
  const [text, setText] = useState('');
  const [date, setDate] = useState(clampToRange(todayISO()));
  const [proj, setProj] = useState('');
  const [msg, setMsg] = useState('');
  const add = () => {
    if (!text.trim()) return;
    if (!isValidISO(date) || !inRange(date)) { setMsg('Pick a day between Nov 1 and Jan 31.'); return; }
    const plan = planAdd(values, `d:${date}`, text.trim(), proj);
    if ('error' in plan) { setMsg(plan.error); return; }
    setMany(plan.updates);
    setText(''); setMsg('Added to ' + fmtLong(date) + '.');
  };
  return (
    <form className="add-task" onSubmit={e => { e.preventDefault(); add(); }}>
      <input className="add-text" placeholder="Write a task…" value={text} onChange={e => setText(e.target.value)} aria-label="New task" data-testid="add-task-text" />
      <input type="date" className="add-date" min={RANGE_START} max={RANGE_END} value={date} onChange={e => setDate(e.target.value)} aria-label="Day for the task" data-testid="add-task-date" />
      <ProjectSelect value={proj} onChange={setProj} label="Project for the task" />
      <button type="submit" className="chip-link is-accent" data-testid="add-task-go">Add</button>
      {msg && <span className="add-msg" role="status">{msg}</span>}
    </form>
  );
}

export default function TasksPage() {
  const items = useItems();
  const projects = useProjects();
  const [view, setView] = useState<View>('open');
  const [proj, setProj] = useState('');
  const shown = useMemo(() => items.filter(i => {
    if (proj && i.proj !== proj) return false;
    if (view === 'open') return !i.done && !i.moved;
    if (view === 'done') return i.done;
    if (view === 'moved') return !!i.moved;
    return true;
  }), [items, view, proj]);
  const groups: { scope: string; list: typeof shown }[] = [];
  for (const i of shown) {
    const last = groups[groups.length - 1];
    if (last && last.scope === i.scope) last.list.push(i); else groups.push({ scope: i.scope, list: [i] });
  }
  return (
    <PlainPage title="All tasks" subtitle="Everything you have written on a day or a week, in one place. Check things off, edit them, or send them to another day with the arrow." testid="tasks-page">
      <AddTask />
      <div className="filter-row">
        <div className="seg" role="tablist" aria-label="Show">
          {VIEWS.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={view === v} className={`seg-btn ${view === v ? 'on' : ''}`} onClick={() => setView(v)} data-testid={`view-${v}`}>{l}</button>)}
        </div>
        {projects.length > 0 && (
          <select className="task-select" aria-label="Filter by project" value={proj} onChange={e => setProj(e.target.value)}>
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>
      {groups.length === 0 ? (
        <p className="soft-hint" data-testid="tasks-empty">Nothing here yet. Tasks you write on the day pages will gather here.</p>
      ) : groups.map(g => (
        <section className="task-group" key={g.scope}>
          <h2 className="group-title">
            <Link href={whereHref(g.scope)} className="inline-link">{g.scope.startsWith('d:') ? fmtLong(scopeDate(g.scope)) : `Week of ${weekRangeLabel(scopeDate(g.scope))} · week list`}</Link>
          </h2>
          {g.list.map(i => <TaskRow key={`${i.prefix}${i.n}`} item={i} meta={i.prefix === 't'} name={`m-${i.scope}-${i.prefix}-${i.n}`} />)}
        </section>
      ))}
    </PlainPage>
  );
}
