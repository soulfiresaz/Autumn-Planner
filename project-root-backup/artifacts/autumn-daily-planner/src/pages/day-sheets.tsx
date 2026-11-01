import { useId } from 'react';
import { CheckInput, LineInput, PlainTextarea, RadioChoice, TextField } from '@/components/fields';
import { SheetFrame } from '@/components/sheet';
import { fmtLong, weekNumber, weekStart } from '@/lib/dates';

function OverviewSheet() {
  return (
    <>
      <div className="two-column" style={{ marginTop: 4 }}>
        <TextField name="overview-intention" label="Today's intention" />
        <TextField name="overview-focus" label="A place to begin" />
      </div>
      <TextField name="overview-notes" label="Open notes" rows={6} ruled className="overview-notes" />
      <div className="signature" style={{ textAlign: 'right', marginTop: 20 }}>one thing at a time</div>
    </>
  );
}

const HOURS = ['7 am', '8 am', '9 am', '10 am', '11 am', '12 pm', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm'];

function ScheduleSheet() {
  return (
    <div>
      {HOURS.map((hour, index) => (
        <div className="write-row" key={hour}>
          <span className="time-label">{hour}</span>
          <LineInput name={`schedule-${index}`} label={`Schedule entry at ${hour}`} />
        </div>
      ))}
    </div>
  );
}

function PrioritiesSheet() {
  return (
    <>
      <div className="section-label"><span className="label-dot" />The important things</div>
      {Array.from({ length: 6 }, (_, index) => (
        <div className="check-row" key={index}>
          <CheckInput name={`priority-done-${index}`} label={`Mark priority ${index + 1} complete`} />
          <LineInput name={`priority-${index}`} label={`Priority ${index + 1}`} className="priority-input" />
        </div>
      ))}
      <div style={{ marginTop: 28 }}>
        <TextField name="priorities-notes" label="Room for notes" rows={3} ruled />
      </div>
    </>
  );
}

const MOODS = ['Settled', 'Bright', 'Tender', 'Tired', 'Other'];

function WellnessSheet() {
  const moodGroup = useId();
  return (
    <>
      <div className="wellness-layout">
        <section>
          <div className="movement-box">
            <div className="section-label"><span className="label-dot" />Movement</div>
            <LineInput name="movement" label="Movement activity" className="field-input" />
            <div style={{ marginTop: 13 }}>
              <div className="section-label">Time / feeling</div>
              <LineInput name="movement-time" label="Movement time or feeling" className="field-input" />
            </div>
          </div>
          <div className="movement-box">
            <div className="section-label"><span className="label-dot" />Water, through the day</div>
            <div className="water-track">
              {Array.from({ length: 8 }, (_, index) => (
                <CheckInput key={index} name={`water-${index}`} label={`Water glass ${index + 1}`} className="water-check" />
              ))}
            </div>
            <div className="hint-text">Each mark is a small pause.</div>
          </div>
        </section>
        <section>
          <div className="section-label"><span className="label-dot" />Mood, just now</div>
          <div className="mood-scale"><span aria-hidden="true" />{[1, 2, 3, 4, 5].map(n => <span key={n}>{n}</span>)}</div>
          <div className="mood-list">
            {MOODS.map(mood => (
              <div className="mood-item" key={mood}>
                <span className="mood-name">{mood}</span>
                {[1, 2, 3, 4, 5].map(level => (
                  <RadioChoice
                    key={level}
                    name="mood"
                    group={moodGroup}
                    option={`${mood}-${level}`}
                    label={`${mood}, ${level} of 5`}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
      <div style={{ marginTop: 24 }}><TextField name="wellness-note" label="A note to myself" rows={3} ruled /></div>
    </>
  );
}

function ReflectionSheet() {
  return (
    <>
      <div className="reflection-grid" style={{ marginTop: 0 }}>
        <div className="prompt-card">
          <div className="prompt-title">What felt like enough today?</div>
          <PlainTextarea name="reflection-enough" label="What felt like enough today?" className="field-textarea ruled-area prompt-lines" />
        </div>
        <div className="prompt-card">
          <div className="prompt-title">What would I like to remember?</div>
          <PlainTextarea name="reflection-remember" label="What would I like to remember?" className="field-textarea ruled-area prompt-lines" />
        </div>
      </div>
      <div className="section-label" style={{ marginTop: 14 }}><span className="label-dot" />Open notes</div>
      <PlainTextarea name="reflection-notes" label="Open notes" className="field-textarea ruled-area open-notes" style={{ minHeight: 224 }} />
      <div className="signature" style={{ marginTop: 18, textAlign: 'right' }}>and then, let it rest</div>
    </>
  );
}

export const DAY_SHEETS = [
  { slug: 'overview', label: 'Overview', title: 'A day, gently', Body: OverviewSheet },
  { slug: 'schedule', label: 'Schedule', title: 'The day in hours', Body: ScheduleSheet },
  { slug: 'priorities', label: 'Priorities', title: 'What matters today', Body: PrioritiesSheet },
  { slug: 'wellness', label: 'Wellness & movement', title: 'A little care', Body: WellnessSheet },
  { slug: 'reflection', label: 'Notes & reflection', title: 'A page to keep', Body: ReflectionSheet },
] as const;

export function DaySheet({ date, index }: { date: string; index: number }) {
  const sheet = DAY_SHEETS[index];
  const n = String(index + 1).padStart(2, '0');
  const total = String(DAY_SHEETS.length).padStart(2, '0');
  const wk = weekNumber(weekStart(date));
  return (
    <SheetFrame
      label={`${sheet.label} page for ${fmtLong(date)}`}
      eyebrow={`Week ${wk} · sheet ${n}`}
      title={sheet.title}
      subtitle={fmtLong(date)}
      folio={`${n} / ${total}`}
      art={index === 0}
      footerLeft="Autumn, at your own pace"
      footerRight={`${n} — ${total}`}
    >
      <sheet.Body />
    </SheetFrame>
  );
}
