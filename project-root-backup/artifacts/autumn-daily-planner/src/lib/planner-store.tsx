import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

// Everything the person writes is saved on this device, in one small record.
// Keys look like:  d:2026-11-01:overview-intention   (a day)
//                  w:2026-11-01:focus                 (a week, keyed by its Sunday)
//                  m:2026-11:focus                    (a month)
const STORAGE_KEY = 'autumn-planner-v2';

export type Values = Record<string, string | boolean>;
type SavedState = 'saved' | 'saving';

type StoreValue = {
  values: Values;
  setValue: (key: string, value: string | boolean) => void;
  savedState: SavedState;
  daysWithEntries: Set<string>;
  weeksWithEntries: Set<string>;
};

const StoreContext = createContext<StoreValue | null>(null);
const ScopeContext = createContext<string>('');

function load(): Values {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as Values) : {};
  } catch {
    return {};
  }
}

const hasContent = (v: string | boolean | undefined) => (typeof v === 'string' ? v.trim() !== '' : v === true);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Values>(load);
  const [savedState, setSavedState] = useState<SavedState>('saved');
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) return;
    setSavedState('saving');
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      } catch {
        /* storage may be blocked (private mode); the page still works for this visit */
      }
      setSavedState('saved');
    }, 180);
    return () => window.clearTimeout(timer);
  }, [values]);

  // Keep two open tabs in step.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        dirty.current = false;
        setValues(load());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setValue = useCallback((key: string, value: string | boolean) => {
    dirty.current = true;
    setValues(current => {
      const next = { ...current };
      if (value === '' || value === false) delete next[key];
      else next[key] = value;
      return next;
    });
  }, []);

  const { daysWithEntries, weeksWithEntries } = useMemo(() => {
    const days = new Set<string>();
    const weeks = new Set<string>();
    for (const [key, v] of Object.entries(values)) {
      if (!hasContent(v)) continue;
      const [kind, id] = key.split(':');
      if (kind === 'd') days.add(id);
      else if (kind === 'w') weeks.add(id);
    }
    return { daysWithEntries: days, weeksWithEntries: weeks };
  }, [values]);

  const value = useMemo(
    () => ({ values, setValue, savedState, daysWithEntries, weeksWithEntries }),
    [values, setValue, savedState, daysWithEntries, weeksWithEntries],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function usePlannerStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('usePlannerStore must be used inside PlannerProvider');
  return ctx;
}

/** Wraps a page so every field inside saves under that day / week / month. */
export function Scope({ scope, children }: { scope: string; children: ReactNode }) {
  return <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>;
}

export function useField(name: string): [string, (v: string) => void] {
  const scope = useContext(ScopeContext);
  const { values, setValue } = usePlannerStore();
  const key = `${scope}:${name}`;
  const raw = values[key];
  return [typeof raw === 'string' ? raw : '', (v: string) => setValue(key, v)];
}

export function useToggle(name: string): [boolean, (v: boolean) => void] {
  const scope = useContext(ScopeContext);
  const { values, setValue } = usePlannerStore();
  const key = `${scope}:${name}`;
  return [values[key] === true, (v: boolean) => setValue(key, v)];
}

export function useChoice(name: string): [string, (v: string) => void] {
  return useField(name);
}
