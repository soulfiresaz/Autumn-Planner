import { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { TaskRow } from '@/components/tasks';
import { usePlannerStore, useRawField } from '@/lib/planner-store';
import { PROJECT_SLOTS, planAdd, projectScope, useItems } from '@/lib/tasks';
import { PlainPage } from './plain-page';

function AddProject() {
  const { values, setValue } = usePlannerStore();
  const [name, setName] = useState('');
  const full = !Array.from({ length: PROJECT_SLOTS }, (_, i) => i).some(i => !String(values[`proj:${i}:name`] ?? '').trim());
  const add = () => {
    const text = name.trim();
    if (!text) return;
    for (let i = 0; i < PROJECT_SLOTS; i++) {
      if (!String(values[`proj:${i}:name`] ?? '').trim()) { setValue(`proj:${i}:name`, text); setName(''); return; }
    }
  };
  if (full) return <p className="soft-hint">That&rsquo;s all {PROJECT_SLOTS} project spaces.</p>;
  return (
    <form className="add-task" onSubmit={e => { e.preventDefault(); add(); }}>
      <label className="add-label" htmlFor="project-name-new">Project name</label>
      <input id="project-name-new" className="add-text" placeholder="Write the name of a new project" value={name} onChange={e => setName(e.target.value)} data-testid="project-new-name" />
      <button type="submit" className="chip-link is-accent" data-testid="project-new-add">Add project</button>
    </form>
  );
}

export default function ProjectsPage() {
  const { values } = usePlannerStore();
  const items = useItems();
  const named = Array.from({ length: PROJECT_SLOTS }, (_, i) => i).filter(i => String(values[`proj:${i}:name`] ?? '').trim());
  return (
    <PlainPage title="Projects" subtitle="A project is a bigger goal with its own list of tasks. Open one to work on just that project." testid="projects-page">
      <AddProject />
      <div className="filter-row">
        <Link href="/tasks" className="inline-link" data-testid="project-row-tasks">Go to your tasks</Link>
      </div>
      <div className="project-list">
        {named.map(i => {
          const mine = items.filter(t => t.scope === projectScope(i));
          const open = mine.filter(t => !t.done && !t.moved).length;
          const high = mine.filter(t => !t.done && !t.moved && t.pri === 'H').length;
          const next = String(values[`proj:${i}:next`] ?? '');
          return (
            <Link key={i} href={`/projects/${i}`} className="project-row" data-testid={`project-row-${i}`}>
              <span className="pr-main"><b>{String(values[`proj:${i}:name`])}</b><i>{next.trim() ? `Next: ${next}` : 'No next step yet'}</i></span>
              <span className="pr-count">{open} open{high ? ` · ${high} high` : ''}</span>
              <ChevronRight size={18} />
            </Link>
          );
        })}
      </div>
    </PlainPage>
  );
}

type View = 'open' | 'done' | 'all';

export function ProjectDetailPage({ id }: { id: string }) {
  const n = Number(id);
  const valid = Number.isInteger(n) && n >= 0 && n < PROJECT_SLOTS;
  const [name, setName] = useRawField(`proj:${valid ? n : 0}:name`);
  const [next, setNext] = useRawField(`proj:${valid ? n : 0}:next`);
  const [notes, setNotes] = useRawField(`proj:${valid ? n : 0}:notes`);
  const { values, setMany } = usePlannerStore();
  const items = useItems().filter(t => t.scope === projectScope(id));
  const [view, setView] = useState<View>('open');
  const [text, setText] = useState('');
  const [pri, setPri] = useState('');
  const [msg, setMsg] = useState('');
  const shown = items.filter(t => (view === 'open' ? !t.done && !t.moved : view === 'done' ? t.done : true));
  const add = () => {
    if (!text.trim()) return;
    const plan = planAdd(values, projectScope(id), text.trim(), pri);
    if ('error' in plan) { setMsg(plan.error); return; }
    setMany(plan.updates); setText(''); setPri(''); setMsg('');
  };
  if (!valid) {
    return <PlainPage title="Project not found" testid="project-detail"><Link href="/projects" className="inline-link">Back to all projects</Link></PlainPage>;
  }
  return (
    <PlainPage title={name.trim() || 'New project'} subtitle="Just this project: its next step, notes and tasks." testid="project-detail">
      <Link href="/projects" className="chip-link back-link" data-testid="back-to-projects"><ArrowLeft size={15} /> <span>All projects</span></Link>
      <label className="mini-field big"><span className="mini-cap">Project name</span>
        <input className="field-input" value={name} onChange={e => setName(e.target.value)} data-testid="project-name" />
      </label>
      <label className="mini-field big"><span className="mini-cap">Next step</span>
        <input className="field-input" value={next} onChange={e => setNext(e.target.value)} data-testid="project-next" />
      </label>
      <label className="mini-field big"><span className="mini-cap">Notes</span>
        <textarea className="field-textarea ruled-area project-notes" value={notes} onChange={e => setNotes(e.target.value)} />
      </label>
      <h2 className="group-title">Tasks in this project</h2>
      <p className="soft-hint">Mark a task <b>High</b> priority and it will also show on your daily pages. Everything else stays here.</p>
      <form className="add-task" onSubmit={e => { e.preventDefault(); add(); }}>
        <input className="add-text" placeholder="Add a task to this project…" value={text} onChange={e => setText(e.target.value)} aria-label="New project task" data-testid="project-add-text" />
        <select className="task-select" value={pri} onChange={e => setPri(e.target.value)} aria-label="Priority">
          <option value="">Priority</option><option value="H">High</option><option value="M">Medium</option><option value="L">Low</option>
        </select>
        <button type="submit" className="chip-link is-accent" data-testid="project-add">Add</button>
        {msg && <span className="add-msg" role="status">{msg}</span>}
      </form>
      <div className="filter-row">
        <div className="seg" role="tablist" aria-label="Show">
          {([['open', 'Open'], ['done', 'Done'], ['all', 'Everything']] as [View, string][]).map(([v, l]) => (
            <button key={v} type="button" role="tab" aria-selected={view === v} className={`seg-btn ${view === v ? 'on' : ''}`} onClick={() => setView(v)} data-testid={`pview-${v}`}>{l}</button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="soft-hint">{view === 'open' ? 'No open tasks yet. Add the first one above.' : 'Nothing here yet.'}</p>
      ) : shown.map(t => <TaskRow key={t.n} item={t} meta="project" name={`pj-${id}-${t.n}`} />)}
    </PlainPage>
  );
}
