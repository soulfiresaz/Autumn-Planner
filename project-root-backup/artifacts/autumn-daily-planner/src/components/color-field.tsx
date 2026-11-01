import { useEffect, useRef, useState } from 'react';

/**
 * A color picker that stays steady while the device's color sheet is open:
 * the picker updates at once, and the planner is told once you pause or finish.
 */
export function ColorField({ value, onCommit, label, testid }: { value: string; onCommit: (hex: string) => void; label: string; testid: string }) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<number | undefined>(undefined);
  const ref = useRef<HTMLInputElement>(null);
  const latest = useRef(draft);
  const commit = useRef(onCommit);
  commit.current = onCommit;

  useEffect(() => { setDraft(value); latest.current = value; }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const done = () => { window.clearTimeout(timer.current); if (latest.current !== value) commit.current(latest.current); };
    el.addEventListener('change', done);
    return () => { el.removeEventListener('change', done); window.clearTimeout(timer.current); };
  });

  return (
    <input
      ref={ref} type="color" value={draft} aria-label={label} data-testid={testid}
      onChange={e => {
        const v = e.target.value;
        latest.current = v;
        setDraft(v);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => commit.current(v), 350);
      }}
    />
  );
}
