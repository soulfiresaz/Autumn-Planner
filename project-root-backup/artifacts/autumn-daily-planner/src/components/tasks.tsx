import { useState } from 'react';
import { ArrowRightCircle, Undo2 } from 'lucide-react';
import { Link } from 'wouter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RANGE_END, RANGE_START, fmtMonthDayShort, fmtWeekday, isValidISO, inRange } from '@/lib/dates';
import { usePlannerStore } from '@/lib/planner-store';
import { keyOf, moveChoices, planMove, planUndo, readItem, scopeDate, useProjects, type ItemRef } from '@/lib/tasks';

export function useMover() {
  const { values, setMany } = usePlannerStore();
  return {
    move(item: ItemRef, toScope: string): string | null {
      const plan = planMove(values, item, toScope);
      if ('error' in plan) return plan.error;
      setMany(plan.updates);
      return null;
    },
    undo(item: ItemRef) { setMany(planUndo(values, item)); },
  };
}

function whereLabel(scope: string) {
  const d = scopeDate(scope);
  return scope.startsWith('d:') ? `${fmtWeekday(d).slice(0, 3)}, ${fmtMonthDayShort(d)}` : `week of ${fmtMonthDayShort(d)}`;
}

export function whereHref(scope: string, sheet = 'tasks') {
  return scope.startsWith('d:') ? `/day/${scopeDate(scope)}/${sheet}` : `/week/${scopeDate(scope)}/tasks`;
}

/** The little arrow that sends a task to tomorrow, next week, a week list, or any date. */
export function MoveMenu({ item, label = 'Move this task', onMoved }: { item: ItemRef; label?: string; onMoved?: () => void }) {
  const { move } = useMover();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState('');
  const go = (scope: string) => {
    const err = move(item, scope);
    setError(err ?? '');
    if (!err) { setOpen(false); onMoved?.(); }
  };
  return (
    <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) setError(''); }}>
      <PopoverTrigger asChild>
        <button type="button" className="move-btn print-hide" aria-label={label} title={label} data-testid={`move-${item.scope}-${item.prefix}-${item.n}`}>
          <ArrowRightCircle size={18} strokeWidth={1.6} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="move-pop">
        <div className="move-title">Move to&hellip;</div>
        {moveChoices(item.scope).map(c => (
          <button key={c.id} type="button" className="move-choice" onClick={() => go(c.scope)} data-testid={`move-${c.id}`}>{c.label}</button>
        ))}
        <label className="move-date">
          <span>Pick a day</span>
          <input
            type="date" min={RANGE_START} max={RANGE_END} value={date}
            onChange={e => setDate(e.target.value)} data-testid="move-date"
          />
        </label>
        <button
          type="button" className="move-go" disabled={!isValidISO(date) || !inRange(date)}
          onClick={() => go(`d:${date}`)} data-testid="move-pick"
        >Move to that day</button>
        {error && <div className="move-error" role="alert">{error}</div>}
      </PopoverContent>
    </Popover>
  );
}

const PRIORITIES: [string, string][] = [['', 'Priority'], ['H', 'High'], ['M', 'Medium'], ['L', 'Low']];

export function ProjectSelect({ value, onChange, label, className = 'task-select' }: { value: string; onChange: (v: string) => void; label: string; className?: string }) {
  const projects = useProjects();
  return (
    <select className={`${className} ${value ? '' : 'is-empty'}`} aria-label={label} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Project</option>
      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}

/** One task or priority line: check box, words, and (optionally) priority / due / project and the move arrow. */
export function TaskRow({
  item, meta = false, showWhere = false, name,
}: { item: ItemRef; meta?: boolean; showWhere?: boolean; name?: string }) {
  const { values, setValue } = usePlannerStore();
  const { undo } = useMover();
  const it = readItem(values, item);
  const set = (field: string, v: string | boolean) => setValue(keyOf(item, field), v);
  const moved = it.moved !== '';
  const nm = name ?? `${item.prefix}-${item.n}`;
  return (
    <div className={`task-row ${moved ? 'is-moved' : ''} ${it.done ? 'is-done' : ''} ${meta ? 'has-meta' : ''}`} data-testid={`task-row-${nm}`}>
      <input
        type="checkbox" className="check-input" checked={it.done} disabled={moved || !it.text.trim()}
        aria-label={`Mark done: ${it.text || 'task'}`} onChange={e => set('done', e.target.checked)} data-testid={`checkbox-${nm}`}
      />
      <input
        className="task-text" value={it.text} readOnly={moved} aria-label={`Task ${item.n + 1}`}
        onChange={e => set('text', e.target.value)} data-testid={`input-${nm}`}
      />
      {meta && !moved && (
        <div className="task-meta">
          <select className={`task-select pri ${it.pri ? '' : 'is-empty'}`} aria-label="Priority: high, medium or low" value={it.pri} onChange={e => set('pri', e.target.value)}>
            {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input className="task-due" aria-label="Due" placeholder="due" value={it.due} onChange={e => set('due', e.target.value)} />
          <ProjectSelect value={it.proj} onChange={v => set('proj', v)} label="Project" />
        </div>
      )}
      {showWhere && (
        <Link href={whereHref(item.scope)} className="task-where print-hide">{whereLabel(item.scope)}</Link>
      )}
      {moved ? (
        <span className="moved-note">
          <span>moved to <Link href={whereHref(it.moved)} className="moved-link">{whereLabel(it.moved)}</Link></span>
          <button type="button" className="undo-btn print-hide" onClick={() => undo(item)} aria-label="Undo move" title="Undo move" data-testid={`undo-${nm}`}>
            <Undo2 size={14} />
          </button>
        </span>
      ) : (
        it.text.trim() && <MoveMenu item={item} />
      )}
    </div>
  );
}
