import { useState } from 'react';
import { ArrowRightCircle, Undo2 } from 'lucide-react';
import { Link } from 'wouter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RANGE_END, RANGE_START, addDays, fmtMonthDayShort, fmtWeekday, fmtWeekdayShort, dayNumber, isValidISO, inRange, todayISO } from '@/lib/dates';
import { usePlannerStore } from '@/lib/planner-store';
import { isProjectScope, keyOf, moveChoices, planMove, planUndo, readItem, scopeDate, useProjects, type ItemRef, type Project } from '@/lib/tasks';

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

function whereLabel(scope: string, projects: Project[] = []) {
  if (isProjectScope(scope)) return projects.find(p => p.id === scopeDate(scope))?.name ?? 'a project';
  const d = scopeDate(scope);
  return scope.startsWith('d:') ? `${fmtWeekday(d).slice(0, 3)}, ${fmtMonthDayShort(d)}` : `week of ${fmtMonthDayShort(d)}`;
}

export function whereHref(scope: string, sheet = 'tasks') {
  if (isProjectScope(scope)) return `/projects/${scopeDate(scope)}`;
  return scope.startsWith('d:') ? `/day/${scopeDate(scope)}/${sheet}` : `/week/${scopeDate(scope)}/tasks`;
}

/** The little arrow that sends a task to tomorrow, next week, a week list, or any date. */
export function MoveMenu({ item, label = 'Move this task', onMoved }: { item: ItemRef; label?: string; onMoved?: () => void }) {
  const { move } = useMover();
  const projects = useProjects();
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
        {moveChoices(item.scope, projects).map(c => (
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

export function ProjectSelect({ value, onChange, label, className = 'task-select', empty = 'Pick a project' }: { value: string; onChange: (v: string) => void; label: string; className?: string; empty?: string }) {
  const projects = useProjects();
  return (
    <select className={`${className} ${value ? '' : 'is-empty'}`} aria-label={label} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{empty}</option>
      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}

export type RowKind = 'day' | 'week' | 'project';

/** One task line: check box, words, priority (and for the weekly list, a due day), and the move arrow. */
export function TaskRow({
  item, meta, showWhere = false, name, origin, originLabel,
}: { item: ItemRef; meta?: RowKind; showWhere?: boolean; name?: string; origin?: 'project' | 'week'; originLabel?: string }) {
  const { values, setValue, setMany } = usePlannerStore();
  const projects = useProjects();
  const { undo } = useMover();
  const it = readItem(values, item);
  const set = (field: string, v: string | boolean) => setValue(keyOf(item, field), v);
  const moved = it.moved !== '';
  const nm = name ?? `${item.prefix}-${item.n}`;
  const weekDays = item.scope.startsWith('w:') ? Array.from({ length: 7 }, (_, i) => addDays(scopeDate(item.scope), i)) : [];
  const toggleDone = (v: boolean) => setMany({ [keyOf(item, 'done')]: v, [keyOf(item, 'doneon')]: v ? todayISO() : '' });
  return (
    <div className={`task-row ${moved ? 'is-moved' : ''} ${it.done ? 'is-done' : ''} ${meta ? 'has-meta' : ''} ${origin ? `from-${origin}` : ''}`} data-testid={`task-row-${nm}`}>
      <input
        type="checkbox" className="check-input" checked={it.done} disabled={moved || !it.text.trim()}
        aria-label={`Mark done: ${it.text || 'task'}`} onChange={e => toggleDone(e.target.checked)} data-testid={`checkbox-${nm}`}
      />
      <div className="task-main">
        {origin && <span className={`origin-tag ${origin}`}>{originLabel ?? (origin === 'week' ? 'this week' : 'project')}</span>}
        <input
          className="task-text" value={it.text} readOnly={moved || !!origin} aria-label={`Task ${item.n + 1}`}
          onChange={e => set('text', e.target.value)} data-testid={`input-${nm}`}
        />
      </div>
      {meta && !moved && (
        <div className="task-meta">
          <select className={`task-select pri ${it.pri ? '' : 'is-empty'}`} aria-label="Priority: high, medium or low" value={it.pri} onChange={e => set('pri', e.target.value)} data-testid={`pri-${nm}`}>
            {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {meta === 'week' && (
            <select className={`task-select due-select ${it.due ? '' : 'is-empty'}`} aria-label="Due day this week" value={it.due} onChange={e => set('due', e.target.value)} data-testid={`due-${nm}`}>
              <option value="">Due day</option>
              {weekDays.map(d => <option key={d} value={d}>{`${fmtWeekdayShort(d)} ${dayNumber(d)}`}</option>)}
            </select>
          )}
        </div>
      )}
      {showWhere && (
        <Link href={whereHref(item.scope)} className="task-where print-hide">{whereLabel(item.scope, projects)}</Link>
      )}
      {moved ? (
        <span className="moved-note">
          <span>moved to <Link href={whereHref(it.moved)} className="moved-link">{whereLabel(it.moved, projects)}</Link></span>
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
