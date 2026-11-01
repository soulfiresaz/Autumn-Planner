import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Check, Leaf, Printer } from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import autumnStillLife from './assets/autumn-still-life.png';

const queryClient = new QueryClient();
const STORAGE_KEY = 'autumn-daily-planner-v1';

const sheets = [
  { path: '/', label: 'Daily overview', title: 'A day, gently', short: 'Overview' },
  { path: '/schedule', label: 'Schedule', title: 'The day in hours', short: 'Schedule' },
  { path: '/priorities', label: 'Priorities', title: 'What matters today', short: 'Priorities' },
  { path: '/wellness', label: 'Wellness', title: 'A little care', short: 'Wellness' },
  { path: '/meals-movement', label: 'Meals & movement', title: 'Nourish & move', short: 'Meals' },
  { path: '/reflection', label: 'Notes & reflection', title: 'A page to keep', short: 'Reflection' },
];

type PlannerValues = Record<string, string | boolean>;
type PlannerContextValue = {
  values: PlannerValues;
  setValue: (key: string, value: string | boolean) => void;
};
const PlannerContext = createContext<PlannerContextValue | null>(null);

function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('Planner fields must be rendered inside the planner.');
  return context;
}

function useStoredValues() {
  const [values, setValues] = useState<PlannerValues>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) as PlannerValues : {};
    } catch {
      return {};
    }
  });
  const [savedState, setSavedState] = useState<'saved' | 'saving'>('saved');
  useEffect(() => {
    setSavedState('saving');
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
        setSavedState('saved');
      } catch {
        setSavedState('saved');
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [values]);
  const setValue = (key: string, value: string | boolean) => {
    setValues(current => ({ ...current, [key]: value }));
  };
  return { values, setValue, savedState };
}

function TextField({
  id, label, placeholder, className = '', rows, ruled = false,
}: {
  id: string; label: string; placeholder?: string; className?: string; rows?: number; ruled?: boolean;
}) {
  const { values, setValue } = usePlanner();
  const value = typeof values[id] === 'string' ? values[id] as string : '';
  return (
    <div className={`field-block ${className}`}>
      <label className="section-label" htmlFor={id}><span className="label-dot" />{label}</label>
      {rows ? (
        <textarea
          id={id}
          data-testid={`textarea-${id}`}
          aria-label={label}
          className={`field-textarea ${ruled ? 'ruled-area' : ''}`}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={event => setValue(id, event.target.value)}
        />
      ) : (
        <input
          id={id}
          data-testid={`input-${id}`}
          aria-label={label}
          className="field-input"
          placeholder={placeholder}
          value={value}
          onChange={event => setValue(id, event.target.value)}
        />
      )}
    </div>
  );
}

function CheckInput({ id, label, className = '' }: { id: string; label: string; className?: string }) {
  const { values, setValue } = usePlanner();
  return (
    <input
      type="checkbox"
      id={id}
      data-testid={`checkbox-${id}`}
      aria-label={label}
      className={`check-input ${className}`}
      checked={values[id] === true}
      onChange={event => setValue(id, event.target.checked)}
    />
  );
}

function SheetHeader({ index }: { index: number }) {
  const current = sheets[index];
  return (
    <header className="sheet-head">
      {index === 0 && <img className="art-corner" src={autumnStillLife} alt="" aria-hidden="true" />}
      <div>
        <div className="eyebrow">Autumn daily planner · sheet {String(index + 1).padStart(2, '0')}</div>
        <h1 className="sheet-title">{current.title}</h1>
        <p className="sheet-subtitle">A little room to make the day your own.</p>
      </div>
      <span className="folio">{String(index + 1).padStart(2, '0')} / 06</span>
    </header>
  );
}

function SheetFooter({ index }: { index: number }) {
  return (
    <footer className="sheet-footer">
      <span>Autumn, at your own pace</span>
      <span>{String(index + 1).padStart(2, '0')} — 06</span>
    </footer>
  );
}

function ScheduleSheet() {
  const { values, setValue } = usePlanner();
  const hours = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00', '6:00', '7:00'];
  return (
    <div className="sheet-content">
      <TextField id="schedule-date" label="Date" />
      <div style={{ marginTop: 27 }}>
        {hours.map((hour, index) => (
          <div className="write-row" key={`${hour}-${index}`}>
            <span className="time-label">{hour}</span>
            <input
              className="row-input"
              aria-label={`Schedule entry at ${hour}`}
              data-testid={`input-schedule-${index}`}
              value={typeof values[`schedule-${index}`] === 'string' ? values[`schedule-${index}`] as string : ''}
              onChange={event => setValue(`schedule-${index}`, event.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PrioritiesSheet() {
  const { values, setValue } = usePlanner();
  return (
    <div className="sheet-content">
      <TextField id="priorities-date" label="Date" />
      <div className="section-label" style={{ marginTop: 27 }}><span className="label-dot" />The important things</div>
      {Array.from({ length: 6 }, (_, index) => (
        <div className="check-row" key={index}>
          <CheckInput id={`priority-done-${index}`} label={`Mark priority ${index + 1} complete`} />
          <input
            className="priority-input"
            aria-label={`Priority ${index + 1}`}
            data-testid={`input-priority-${index}`}
            value={typeof values[`priority-${index}`] === 'string' ? values[`priority-${index}`] as string : ''}
            onChange={event => setValue(`priority-${index}`, event.target.value)}
          />
        </div>
      ))}
      <div style={{ marginTop: 28 }}>
        <TextField id="priorities-notes" label="Room for notes" rows={3} ruled />
      </div>
    </div>
  );
}

function WellnessSheet() {
  const { values, setValue } = usePlanner();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const moods = ['Settled', 'Bright', 'Tender', 'Tired', 'Other'];
  return (
    <div className="sheet-content">
      <TextField id="wellness-date" label="Date" />
      <div className="wellness-layout" style={{ marginTop: 26 }}>
        <section>
          <div className="section-label"><span className="label-dot" />Habit tracker</div>
          <table className="habit-table">
            <thead><tr><th scope="col">Habit</th>{days.map((day, index) => <th scope="col" key={`${day}-${index}`}>{day}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: 6 }, (_, row) => (
                <tr key={row}>
                  <td>
                    <input
                      className="habit-name"
                      aria-label={`Habit name ${row + 1}`}
                      data-testid={`input-habit-${row}`}
                      value={typeof values[`habit-name-${row}`] === 'string' ? values[`habit-name-${row}`] as string : ''}
                      onChange={event => setValue(`habit-name-${row}`, event.target.value)}
                    />
                  </td>
                  {days.map((day, col) => <td key={`${day}-${col}`}><CheckInput id={`habit-${row}-${col}`} label={`Habit ${row + 1}, ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][col]}`} className="habit-check" /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <div className="section-label"><span className="label-dot" />Mood, just now</div>
          <div className="mood-scale"><span aria-hidden="true" />{['1', '2', '3', '4', '5'].map(n => <span key={n}>{n}</span>)}</div>
          <div className="mood-list">
            {moods.map(mood => (
              <div className="mood-item" key={mood}>
                <span className="mood-name">{mood}</span>
                {[1, 2, 3, 4, 5].map(level => (
                  <input
                    key={level}
                    type="radio"
                    className="mood-choice"
                    name="mood-tracker"
                    aria-label={`${mood}, ${level} of 5`}
                    data-testid={`radio-mood-${mood.toLowerCase()}-${level}`}
                    checked={values['mood-tracker'] === `${mood}-${level}`}
                    onChange={() => setValue('mood-tracker', `${mood}-${level}`)}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
      <div style={{ marginTop: 24 }}><TextField id="wellness-note" label="A note to myself" rows={2} /></div>
    </div>
  );
}

function MealsSheet() {
  const { values, setValue } = usePlanner();
  const meals = ['Breakfast', 'Lunch', 'Dinner', 'Something small'];
  return (
    <div className="sheet-content">
      <TextField id="meals-date" label="Date" />
      <div className="meal-layout" style={{ marginTop: 25 }}>
        <section>
          <div className="section-label"><span className="label-dot" />At the table</div>
          {meals.map((meal, index) => (
            <div className="meal-entry" key={meal}>
              <label className="meal-kind" htmlFor={`meal-${index}`}>{meal}</label>
              <input
                id={`meal-${index}`}
                className="row-input"
                aria-label={`${meal} notes`}
                data-testid={`input-meal-${index}`}
                value={typeof values[`meal-${index}`] === 'string' ? values[`meal-${index}`] as string : ''}
                onChange={event => setValue(`meal-${index}`, event.target.value)}
              />
            </div>
          ))}
          <div style={{ marginTop: 23 }}><TextField id="meal-thoughts" label="Food notes" rows={3} /></div>
        </section>
        <section>
          <div className="movement-box">
            <div className="section-label"><span className="label-dot" />Movement</div>
            <input className="field-input" aria-label="Movement activity" data-testid="input-movement" value={typeof values.movement === 'string' ? values.movement : ''} onChange={event => setValue('movement', event.target.value)} />
            <div style={{ marginTop: 13 }}>
              <label className="section-label" htmlFor="movement-time">Time / feeling</label>
              <input id="movement-time" className="field-input" aria-label="Movement time or feeling" data-testid="input-movement-time" value={typeof values['movement-time'] === 'string' ? values['movement-time'] as string : ''} onChange={event => setValue('movement-time', event.target.value)} />
            </div>
          </div>
          <div className="movement-box">
            <div className="section-label"><span className="label-dot" />Water, through the day</div>
            <div className="water-track">
              {Array.from({ length: 8 }, (_, index) => <CheckInput key={index} id={`water-${index}`} label={`Water glass ${index + 1}`} className="water-check" />)}
            </div>
            <div style={{ color: '#968570', fontSize: 10, marginTop: 8 }}>Each mark is a small pause.</div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReflectionSheet() {
  const { values, setValue } = usePlanner();
  return (
    <div className="sheet-content">
      <TextField id="reflection-date" label="Date" />
      <div className="reflection-grid" style={{ marginTop: 20 }}>
        <div className="prompt-card">
          <div className="prompt-title">What felt like enough today?</div>
          <textarea className="field-textarea ruled-area prompt-lines" aria-label="What felt like enough today?" data-testid="textarea-reflection-enough" value={typeof values['reflection-enough'] === 'string' ? values['reflection-enough'] as string : ''} onChange={event => setValue('reflection-enough', event.target.value)} />
        </div>
        <div className="prompt-card">
          <div className="prompt-title">What would I like to remember?</div>
          <textarea className="field-textarea ruled-area prompt-lines" aria-label="What would I like to remember?" data-testid="textarea-reflection-remember" value={typeof values['reflection-remember'] === 'string' ? values['reflection-remember'] as string : ''} onChange={event => setValue('reflection-remember', event.target.value)} />
        </div>
      </div>
      <div className="section-label" style={{ marginTop: 14 }}><span className="label-dot" />Open notes</div>
      <textarea className="field-textarea ruled-area" style={{ minHeight: 224 }} aria-label="Open notes" data-testid="textarea-reflection-notes" value={typeof values['reflection-notes'] === 'string' ? values['reflection-notes'] as string : ''} onChange={event => setValue('reflection-notes', event.target.value)} />
      <div className="signature" style={{ marginTop: 18, textAlign: 'right' }}>and then, let it rest</div>
    </div>
  );
}

function OverviewSheet() {
  return (
    <div className="sheet-content">
      <TextField id="overview-date" label="Date" />
      <div className="two-column" style={{ marginTop: 25 }}>
        <TextField id="overview-intention" label="Today's intention" />
        <TextField id="overview-focus" label="A place to begin" />
      </div>
      <TextField id="overview-notes" label="Open notes" rows={6} ruled className="overview-notes" />
      <div className="signature" style={{ textAlign: 'right', marginTop: 20 }}>one thing at a time</div>
    </div>
  );
}

function SheetBody({ index }: { index: number }) {
  if (index === 0) return <OverviewSheet />;
  if (index === 1) return <ScheduleSheet />;
  if (index === 2) return <PrioritiesSheet />;
  if (index === 3) return <WellnessSheet />;
  if (index === 4) return <MealsSheet />;
  return <ReflectionSheet />;
}

function Sheet({ index }: { index: number }) {
  return (
    <article className="sheet" aria-label={`${sheets[index].label} planner page`}>
      <SheetHeader index={index} />
      <SheetBody index={index} />
      <SheetFooter index={index} />
    </article>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function PlannerShell({ children, index, savedState }: { children: ReactNode; index: number; savedState: 'saved' | 'saving' }) {
  return (
    <div className="planner-app">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><Leaf size={19} strokeWidth={1.5} /></div>
          <div><div className="brand-name">Autumn Daily</div><div className="brand-caption">A considered daybook</div></div>
        </div>
        <div className="top-actions">
          <div className="saved-state" role="status" aria-live="polite" data-testid="status-saved">
            {savedState === 'saving' ? <><span className="saved-dot" />Saving locally</> : <><Check size={13} /><span>Saved on this device</span></>}
          </div>
          <button className="print-button" type="button" onClick={() => window.print()} data-testid="button-print">
            <Printer size={15} strokeWidth={1.7} /> Print all six
          </button>
        </div>
      </header>
      <nav className="nav-wrap" aria-label="Planner pages">
        <div className="page-nav">
          {sheets.map((sheet, item) => (
            <Link
              key={sheet.path}
              href={sheet.path}
              className={`nav-link ${index === item ? 'active' : ''}`}
              aria-current={index === item ? 'page' : undefined}
              data-testid={`link-${sheet.short.toLowerCase()}`}
            >
              <span className="nav-index">{String(item + 1).padStart(2, '0')}</span><span>{sheet.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <main className="main-area">{children}</main>
      <div className="print-all" aria-hidden="true">
        {sheets.map((sheet, item) => <Sheet key={sheet.path} index={item} />)}
      </div>
    </div>
  );
}

function PlannerRoute({ index }: { index: number }) {
  return <Sheet index={index} />;
}

function Router({ value }: { value: PlannerContextValue & { savedState: 'saved' | 'saving' } }) {
  const [location] = useLocation();
  const activeIndex = Math.max(0, sheets.findIndex(sheet => sheet.path === location));
  return (
    <PlannerContext.Provider value={value}>
      <PlannerShell index={activeIndex} savedState={value.savedState}>
        <RoutedErrorBoundary>
          <Switch>
            {sheets.map((sheet, index) => <Route key={sheet.path} path={sheet.path} component={() => <PlannerRoute index={index} />} />)}
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
      </PlannerShell>
    </PlannerContext.Provider>
  );
}

function App() {
  const planner = useStoredValues();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router value={planner} />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
