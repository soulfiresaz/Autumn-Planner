import { useMemo } from 'react';
import { addDays, fromISO, inRange, isValidISO, weekStart } from '@/lib/dates';
import { usePlannerStore, type Values } from '@/lib/planner-store';

/** A task or priority lives in one day (d:DATE) or in one week's own list (w:SUNDAY). */
export type ItemRef = { scope: string; prefix: 't' | 'p'; n: number };

export const DAY_TASK_SLOTS = 14;
export const WEEK_TASK_SLOTS = 12;
export const PROJECT_SLOTS = 8;
export const slotsFor = (scope: string) => (scope.startsWith('w:') ? WEEK_TASK_SLOTS : DAY_TASK_SLOTS);

export const keyOf = (ref: ItemRef, field: string) => `${ref.scope}:${ref.prefix}-${ref.n}-${field}`;
export const refId = (ref: ItemRef) => `${ref.scope}:${ref.prefix}-${ref.n}`;

export type TaskItem = ItemRef & {
  text: string; done: boolean; pri: string; due: string; proj: string; moved: string; movedSlot: string;
};

const ITEM_RE = /^([dw]:[^:]+):([tp])-(\d+)-text$/;
const str = (v: string | boolean | undefined) => (typeof v === 'string' ? v : '');

export function readItem(values: Values, ref: ItemRef): TaskItem {
  const g = (f: string) => values[keyOf(ref, f)];
  return {
    ...ref,
    text: str(g('text')), done: g('done') === true, pri: str(g('pri')), due: str(g('due')),
    proj: str(g('proj')), moved: str(g('moved')), movedSlot: str(g('mslot')),
  };
}

export function allItems(values: Values): TaskItem[] {
  const out: TaskItem[] = [];
  for (const key of Object.keys(values)) {
    const m = ITEM_RE.exec(key);
    if (!m) continue;
    const item = readItem(values, { scope: m[1], prefix: m[2] as 't' | 'p', n: Number(m[3]) });
    if (item.text.trim()) out.push(item);
  }
  // Days first by date, a week's own list before that week's days; priorities before tasks.
  const sortKey = (i: TaskItem) => {
    const id = i.scope.slice(2);
    return `${i.scope.startsWith('w:') ? id : weekStart(id)}|${i.scope.startsWith('w:') ? '0' : '1'}${id}|${i.prefix === 'p' ? 0 : 1}|${String(i.n).padStart(3, '0')}`;
  };
  return out.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1));
}

export function useItems(): TaskItem[] {
  const { values } = usePlannerStore();
  return useMemo(() => allItems(values), [values]);
}

/** First empty task row in a day or week list, or -1 if it is full. */
export function freeSlot(values: Values, scope: string): number {
  for (let n = 0; n < slotsFor(scope); n++) {
    const base = `${scope}:t-${n}-`;
    if (!str(values[base + 'text']).trim()) return n;
  }
  return -1;
}

export function scopeDate(scope: string): string {
  return scope.slice(2);
}

export function isValidScope(scope: string): boolean {
  if (scope.startsWith('d:')) return isValidISO(scope.slice(2)) && inRange(scope.slice(2));
  if (scope.startsWith('w:')) return isValidISO(scope.slice(2)) && weekStart(scope.slice(2)) === scope.slice(2);
  return false;
}

/** Where a task could go from here. */
export function moveChoices(from: string) {
  const dateOf = scopeDate(from);
  const isDay = from.startsWith('d:');
  const choices: { id: string; label: string; scope: string }[] = [];
  if (isDay) {
    const tomorrow = addDays(dateOf, 1);
    if (inRange(tomorrow)) choices.push({ id: 'tomorrow', label: 'Tomorrow', scope: `d:${tomorrow}` });
    const nextWeek = addDays(dateOf, 7);
    if (inRange(nextWeek)) choices.push({ id: 'nextweek', label: 'Next week, same day', scope: `d:${nextWeek}` });
    choices.push({ id: 'thisweek', label: "This week's list (no day yet)", scope: `w:${weekStart(dateOf)}` });
  } else {
    const nextWs = addDays(dateOf, 7);
    if (inRange(nextWs)) choices.push({ id: 'nextweek', label: "Next week's list", scope: `w:${nextWs}` });
  }
  return choices;
}

/** Copy an item to another day / week and mark the original as moved. Returns an error message, or null. */
export function planMove(values: Values, item: ItemRef, toScope: string): { updates: Values } | { error: string } {
  if (!isValidScope(toScope)) return { error: 'That date is outside the planner.' };
  if (toScope === item.scope) return { error: 'It is already there.' };
  const slot = freeSlot(values, toScope);
  if (slot < 0) return { error: 'That list is full. Make room there first, or pick another day.' };
  const from = readItem(values, item);
  const base = `${toScope}:t-${slot}-`;
  return {
    updates: {
      [base + 'text']: from.text,
      [base + 'pri']: from.pri,
      [base + 'due']: from.due,
      [base + 'proj']: from.proj,
      [keyOf(item, 'moved')]: toScope,
      [keyOf(item, 'mslot')]: String(slot),
      [keyOf(item, 'done')]: false,
    },
  };
}

export function planUndo(values: Values, item: ItemRef): Values {
  const from = readItem(values, item);
  const updates: Values = { [keyOf(item, 'moved')]: '', [keyOf(item, 'mslot')]: '' };
  if (from.moved && from.movedSlot !== '') {
    const copy = readItem(values, { scope: from.moved, prefix: 't', n: Number(from.movedSlot) });
    if (copy.text === from.text) {
      for (const f of ['text', 'pri', 'due', 'proj', 'done', 'moved', 'mslot']) updates[keyOf(copy, f)] = '';
    }
  }
  return updates;
}

export function scopeLabel(scope: string, fmtDay: (iso: string) => string, fmtWeek: (ws: string) => string) {
  return scope.startsWith('d:') ? fmtDay(scopeDate(scope)) : `${fmtWeek(scopeDate(scope))} (week list)`;
}

export function scopeDateSafe(scope: string) {
  return fromISO(scopeDate(scope));
}

/** Add a task to a day or week's list. */
export function planAdd(values: Values, scope: string, text: string, proj = ''): { updates: Values } | { error: string } {
  if (!isValidScope(scope)) return { error: 'That date is outside the planner.' };
  const slot = freeSlot(values, scope);
  if (slot < 0) return { error: 'That list is full. Pick another day.' };
  const base = `${scope}:t-${slot}-`;
  return { updates: { [base + 'text']: text, [base + 'proj']: proj } };
}

export type Project = { id: string; name: string };

export function useProjects(): Project[] {
  const { values } = usePlannerStore();
  return useMemo(() => {
    const out: Project[] = [];
    for (let i = 0; i < PROJECT_SLOTS; i++) {
      const name = str(values[`proj:${i}:name`]).trim();
      if (name) out.push({ id: String(i), name });
    }
    return out;
  }, [values]);
}
