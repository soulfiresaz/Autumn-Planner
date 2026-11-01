import { useMemo } from 'react';
import { WEEKS } from '@/lib/dates';
import { usePlannerStore, type Values } from '@/lib/planner-store';

export const HABIT_ROWS = 8;
const str = (v: string | boolean | undefined) => (typeof v === 'string' ? v : '');

/** The habit names in force for a week: its own list if it has one, otherwise the nearest earlier week's. */
export function habitNamesFor(values: Values, ws: string): { names: string[]; own: boolean } {
  const i = WEEKS.indexOf(ws);
  for (let k = i; k >= 0; k--) {
    if (values[`w:${WEEKS[k]}:habits-set`] === true) {
      return { names: Array.from({ length: HABIT_ROWS }, (_, r) => str(values[`w:${WEEKS[k]}:habit-name-${r}`])), own: k === i };
    }
  }
  return { names: Array(HABIT_ROWS).fill(''), own: false };
}

export function useHabits(ws: string) {
  const { values, setMany } = usePlannerStore();
  const { names } = useMemo(() => habitNamesFor(values, ws), [values, ws]);
  const setName = (row: number, name: string) => {
    const updates: Values = { [`w:${ws}:habits-set`]: true };
    names.forEach((n, r) => { updates[`w:${ws}:habit-name-${r}`] = r === row ? name : n; });
    setMany(updates);
  };
  const checkKey = (row: number, col: number) => `w:${ws}:habit-${row}-${col}`;
  const isDone = (row: number, col: number) => values[checkKey(row, col)] === true;
  const setDone = (row: number, col: number, v: boolean) => setMany({ [checkKey(row, col)]: v });
  return { names, setName, isDone, setDone };
}
