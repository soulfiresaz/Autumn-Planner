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
  /** Change several saved values at once. Empty strings and false remove a key. */
  setMany: (updates: Values) => void;
  /** Replace everything (used when restoring a backup). */
  replaceAll: (next: Values) => void;
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

  // Save right away if the page is closed or sent to the background before the short delay is up.
  const latest = useRef(values);
  latest.current = values;
  useEffect(() => {
    const flush = () => {
      if (!dirty.current) return;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(latest.current)); } catch { /* storage may be blocked */ }
    };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onHide); };
  }, []);

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

  const setMany = useCallback((updates: Values) => {
    dirty.current = true;
    setValues(current => {
      const next = { ...current };
      for (const [key, v] of Object.entries(updates)) {
        if (v === '' || v === false) delete next[key];
        else next[key] = v;
      }
      return next;
    });
  }, []);

  const replaceAll = useCallback((next: Values) => {
    dirty.current = true;
    setValues({ ...next });
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
    () => ({ values, setValue, setMany, replaceAll, savedState, daysWithEntries, weeksWithEntries }),
    [values, setValue, setMany, replaceAll, savedState, daysWithEntries, weeksWithEntries],
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

export function useScopeName() {
  return useContext(ScopeContext);
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

/** Read / write one saved value by its full key (for fields that live outside the current page's scope). */
export function useRawField(key: string): [string, (v: string) => void] {
  const { values, setValue } = usePlannerStore();
  const raw = values[key];
  return [typeof raw === 'string' ? raw : '', (v: string) => setValue(key, v)];
}

export function useRawToggle(key: string): [boolean, (v: boolean) => void] {
  const { values, setValue } = usePlannerStore();
  return [values[key] === true, (v: boolean) => setValue(key, v)];
}

export const STORAGE_KEY_NAME = STORAGE_KEY;
