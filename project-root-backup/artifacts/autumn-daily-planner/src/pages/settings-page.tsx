import { Check, X } from 'lucide-react';
import { DEFAULT_ACCENT, DEFAULT_NAME, MAX_SAVED, PRESETS, useSettings } from '@/lib/settings';
import { PlainPage } from './plain-page';

export default function SettingsPage() {
  const { accent, setAccent, nameRaw, setName, saved, setSaved } = useSettings();
  const isSaved = saved.includes(accent);
  const swatch = (c: string, removable = false) => (
    <span key={c} className="swatch-wrap">
      <button type="button" className={`swatch ${c === accent ? 'on' : ''}`} style={{ background: c }} aria-label={`Use color ${c}`} aria-pressed={c === accent} onClick={() => setAccent(c)} data-testid={`swatch-${c.slice(1)}`}>
        {c === accent && <Check size={16} strokeWidth={2.4} />}
      </button>
      {removable && <button type="button" className="swatch-x" aria-label={`Remove saved color ${c}`} onClick={() => setSaved(saved.filter(x => x !== c))}><X size={11} strokeWidth={2.6} /></button>}
    </span>
  );
  return (
    <PlainPage title="Settings" subtitle="Make the planner yours." testid="settings-page">
      <section className="settings-block">
        <h2 className="settings-h">Planner name</h2>
        <input className="search-box" value={nameRaw} placeholder={DEFAULT_NAME} maxLength={40} aria-label="Planner name" data-testid="setting-name" onChange={e => setName(e.target.value)} />
      </section>

      <section className="settings-block">
        <h2 className="settings-h">Accent color</h2>
        <p className="soft-hint">This colors the buttons, today's date, highlighted tabs and small bits of writing.</p>
        <div className="accent-row">
          <label className="color-pick">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} aria-label="Pick any color" data-testid="accent-input" />
            <span>Pick any color</span>
          </label>
          <code className="hex">{accent}</code>
          <button type="button" className="mini-btn" disabled={isSaved || saved.length >= MAX_SAVED} onClick={() => setSaved([...saved, accent])} data-testid="save-color">
            {isSaved ? 'Saved' : 'Save this color'}
          </button>
          <button type="button" className="mini-btn" onClick={() => setAccent('')} data-testid="reset-color">Back to the original</button>
        </div>

        <h3 className="settings-sub">Your saved colors</h3>
        {saved.length ? <div className="swatches">{saved.map(c => swatch(c, true))}</div> : <p className="soft-hint">Nothing saved yet. Pick a color and tap &ldquo;Save this color&rdquo;.</p>}

        <h3 className="settings-sub">Ready-made colors</h3>
        <div className="swatches">{PRESETS.map(c => swatch(c))}</div>

        <div className="accent-preview" aria-hidden="true">
          <span className="chip-link is-accent">Button</span>
          <span className="holiday-tag" style={{ position: 'static' }}>a little writing</span>
        </div>
      </section>
    </PlainPage>
  );
}
