// Date helpers for the three-month planner (November 2026 - January 2027).
// Dates are handled as plain "YYYY-MM-DD" strings in the person's local time,
// so there are no time-zone surprises around midnight.

export const RANGE_START = '2026-11-01';
export const RANGE_END = '2027-01-31';
export const MONTHS = ['2026-11', '2026-12', '2027-01'] as const;

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidISO(s: string | undefined | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && toISO(fromISO(s)) === s;
}

export function addDays(s: string, n: number): string {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export const inRange = (s: string) => s >= RANGE_START && s <= RANGE_END;

export function todayISO(): string {
  return toISO(new Date());
}

export function clampToRange(s: string): string {
  if (s < RANGE_START) return RANGE_START;
  if (s > RANGE_END) return RANGE_END;
  return s;
}

/** The Sunday that starts the week containing this date. */
export function weekStart(s: string): string {
  const d = fromISO(s);
  d.setDate(d.getDate() - d.getDay());
  return toISO(d);
}

/** Every week (identified by its Sunday) that touches the planner's range. */
export const WEEKS: string[] = (() => {
  const out: string[] = [];
  let w = weekStart(RANGE_START);
  while (w <= RANGE_END) {
    out.push(w);
    w = addDays(w, 7);
  }
  return out;
})();

export const weekNumber = (ws: string) => WEEKS.indexOf(ws) + 1;

export function isValidMonth(ym: string | undefined | null): ym is (typeof MONTHS)[number] {
  return !!ym && (MONTHS as readonly string[]).includes(ym);
}

export const monthOf = (iso: string) => iso.slice(0, 7);

export function monthParts(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  return {
    name: first.toLocaleDateString('en-US', { month: 'long' }),
    short: first.toLocaleDateString('en-US', { month: 'short' }),
    year: y,
  };
}

/** Rows of 7 cells (Sunday first). Cells outside the month are null. */
export function monthGrid(ym: string): { weekStart: string; days: (string | null)[] }[] {
  const [y, m] = ym.split('-').map(Number);
  const first = toISO(new Date(y, m - 1, 1));
  const last = toISO(new Date(y, m, 0));
  const rows: { weekStart: string; days: (string | null)[] }[] = [];
  let ws = weekStart(first);
  while (ws <= last) {
    const days: (string | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      days.push(d >= first && d <= last ? d : null);
    }
    rows.push({ weekStart: ws, days });
    ws = addDays(ws, 7);
  }
  return rows;
}

export const fmtLong = (s: string) =>
  fromISO(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export const fmtWeekday = (s: string) => fromISO(s).toLocaleDateString('en-US', { weekday: 'long' });
export const fmtWeekdayShort = (s: string) => fromISO(s).toLocaleDateString('en-US', { weekday: 'short' });
export const fmtMonthDay = (s: string) => fromISO(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
export const fmtMonthDayShort = (s: string) => fromISO(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const dayNumber = (s: string) => fromISO(s).getDate();

export function weekRangeLabel(ws: string): string {
  const a = fromISO(ws);
  const b = fromISO(addDays(ws, 6));
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const mo = (d: Date) => d.toLocaleDateString('en-US', { month: 'long' });
  if (sameMonth) return `${mo(a)} ${a.getDate()} – ${b.getDate()}, ${b.getFullYear()}`;
  if (a.getFullYear() === b.getFullYear()) return `${mo(a)} ${a.getDate()} – ${mo(b)} ${b.getDate()}, ${b.getFullYear()}`;
  return `${mo(a)} ${a.getDate()}, ${a.getFullYear()} – ${mo(b)} ${b.getDate()}, ${b.getFullYear()}`;
}
