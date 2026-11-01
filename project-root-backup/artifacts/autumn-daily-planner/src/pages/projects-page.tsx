import { useState } from 'react';
import { Link } from 'wouter';
import { MoveMenu, whereHref } from '@/components/tasks';
import { RANGE_END, RANGE_START, clampToRange, fmtMonthDayShort, inRange, isValidISO, todayISO } from '@/lib/dates';
import { useRawField, usePlannerStore } from '@/lib/planner-store';
import { PROJECT_SLOTS, keyOf, planAdd, scopeDate, useItems } from '@/lib/tasks';
import { PlainPage } from './plain-page';

function ProjectCard({ id }: { id: number }) {
  const [name, setName] = useRawField(`proj:${id}:name`);
  const [next, setNext] = useRawField(`proj:${id}:next`);
  const [notes, setNotes] = useRawField(`proj:${id}:notes`);
  const items = useItems().filter(i => i.proj === String(id));
  const { values, setMany, setValue } = usePlannerStore();
  const [text, setText] = useState('');
  const [date, setDate] = useState(clampToRange(todayISO()));
  const [msg, setMsg] = useState('');
  const open = items.filter(i => !i.done && !i.moved);
  const done = items.filter(i => i.done);
  const add = () => {
    if (!text.trim()) return;
    if (!isValidISO(date) || !inRange(date)) { setMsg('Pick a day between Nov 1 and Jan 31.'); return; }
    const plan = planAdd(values, `d:${date}`, text.trim(), String(id));
    if ('error' in plan) { setMsg(plan.error); return; }
    setMany(plan.updates); setText(''); setMsg('');
  };
  return (
    <section className="project-card" data-testid={`project-${id}`}>
      <input className="project-name" placeholder="Name a project" value={name} onChange={e => setName(e.target.value)} aria-label={`Project ${id + 1} name`} data-testid={`project-name-${id}`} />
      {name.trim() && (
        <>
          <label className="mini-field"><span className="mini-cap">Next step</span><input className="field-input" value={next} onChange={e => setNext(e.target.value)} data-testid={`project-next-${id}`} /></label>
          <label className="mini-field"><span className="mini-cap">Notes</span><textarea className="field-textarea ruled-area project-notes" value={notes} onChange={e => setNotes(e.target.value)} /></label>
          <div className="section-label"><span className="label-dot" />Tasks &middot; {open.length} open{done.length ? `, ${done.length} done` : ''}</div>
          {open.map(i => (
            <div className="project-task" key={`${i.scope}${i.prefix}${i.n}`}>
              <input type="checkbox" className="check-input" aria-label={`Mark done: ${i.text}`} onChange={e => setValue(keyOf(i, 'done'), e.target.checked)} />
              <span className="project-task-text">{i.text}</span>
              <Link href={whereHref(i.scope)} className="task-where">{i.scope.startsWith('d:') ? fmtMonthDayShort(scopeDate(i.scope)) : 'week list'}</Link>
              <MoveMenu item={i} label="Bring this task to another day" />
            </div>
          ))}
          <form className="add-task slim" onSubmit={e => { e.preventDefault(); add(); }}>
            <input className="add-text" placeholder="Add a task for this project…" value={text} onChange={e => setText(e.target.value)} aria-label="New project task" data-testid={`project-add-text-${id}`} />
            <input type="date" className="add-date" min={RANGE_START} max={RANGE_END} value={date} onChange={e => setDate(e.target.value)} aria-label="Day for the task" />
            <button type="submit" className="chip-link is-accent" data-testid={`project-add-${id}`}>Add</button>
            {msg && <span className="add-msg" role="status">{msg}</span>}
          </form>
        </>
      )}
    </section>
  );
}

export default function ProjectsPage() {
  const { values } = usePlannerStore();
  // Show every named project plus one empty card, up to the limit.
  let shown = 0;
  for (let i = 0; i < PROJECT_SLOTS; i++) if (typeof values[`proj:${i}:name`] === 'string') shown = i + 1;
  const count = Math.min(PROJECT_SLOTS, shown + 1);
  return (
    <PlainPage title="Projects" subtitle="A project is a bigger goal made of many tasks. Name it here, then choose it in the Project box on any task, and that task is filed here. Use the arrow on a task to bring it to the day you want to work on it." testid="projects-page">
      <div className="project-grid">
        {Array.from({ length: count }, (_, i) => <ProjectCard key={i} id={i} />)}
      </div>
      {count >= PROJECT_SLOTS && <p className="soft-hint">That&rsquo;s all {PROJECT_SLOTS} project spaces.</p>}
    </PlainPage>
  );
}
