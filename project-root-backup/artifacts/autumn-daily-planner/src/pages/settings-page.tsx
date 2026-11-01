import { Check, X } from 'lucide-react';
import { ColorGuide } from '@/components/color-guide';
import { ColorField } from '@/components/color-field';
import { TEXT_SIZES, DARK_PRESETS, BG_PRESETS, DEFAULT_BG, DEFAULT_DARK, DEFAULT_NAME, MAX_SAVED, PRESETS, clampDark, clampLight, autoBehind, softMatches, useIsDark, useSettings } from '@/lib/settings';
import { PlainPage } from './plain-page';

export default function SettingsPage() {
  const { accent, setAccent, nameRaw, setName, saved, setSaved, bg, setBg, savedBg, setSavedBg, theme, setTheme, textSize, setTextSize, darkBase, setDark, savedDark, setSavedDark, backLight, setBackLight, backDark, setBackDark } = useSettings();
  const isDark = useIsDark();

  // One set of page-color controls, for whichever mode you are looking at.
  const page = isDark ? darkBase : bg;
  const setPage = (v: string) => (isDark ? setDark(v) : setBg(v === DEFAULT_BG ? '' : v));
  const savedPages = isDark ? savedDark : savedBg;
  const setSavedPages = isDark ? setSavedDark : setSavedBg;
  const pageSaved = savedPages.includes(page);
  const shown = isDark ? clampDark(page) : clampLight(page);
  const customBack = isDark ? backDark : backLight;
  const setBack = isDark ? setBackDark : setBackLight;
  const behind = customBack || autoBehind(shown, isDark);
  const presets: { hex: string; label?: string }[] = isDark ? DARK_PRESETS : BG_PRESETS.map(hex => ({ hex }));
  const matches = softMatches(accent);
  const pageSwatch = (c: string, label?: string, removable = false) => (
    <span key={c} className="swatch-wrap">
      <button type="button" className={`swatch ${c === page ? 'on' : ''}`} style={{ background: c }} title={label} aria-label={`Use page color ${label ?? c}`} aria-pressed={c === page} onClick={() => setPage(c)} data-testid={`${isDark ? 'dark' : 'bg'}swatch-${c.slice(1)}`}>
        {c === page && <Check size={16} strokeWidth={2.4} color={isDark ? '#fff' : '#493a30'} />}
      </button>
      {removable && <button type="button" className="swatch-x" aria-label={`Remove saved color ${c}`} onClick={() => setSavedPages(savedPages.filter(x => x !== c))}><X size={11} strokeWidth={2.6} /></button>}
    </span>
  );
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

      <section className="settings-block guide-block">
        <h2 className="settings-h">How the colors fit together</h2>
        <p className="soft-hint">Each layer has a number. These are the real colors you are using right now.</p>
        <ColorGuide watch={`${accent}|${bg}|${theme}|${darkBase}|${textSize}`} />
      </section>

      <section className="settings-block">
        <h2 className="settings-h">Text size</h2>
        <div className="seg" role="group" aria-label="Text size">
          {TEXT_SIZES.map(t => (
            <button key={t.id} type="button" className={`seg-btn ${textSize === t.id ? 'on' : ''}`} aria-pressed={textSize === t.id} onClick={() => setTextSize(t.id === 'medium' ? '' : t.id)} data-testid={`size-${t.id}`}>{t.label}</button>
          ))}
        </div>
        <p className="soft-hint">Changes all the small writing, on this device and every page. Printing always stays the same size.</p>
      </section>

      <section className="settings-block">
        <h2 className="settings-h">Light or dark</h2>
        <div className="seg" role="group" aria-label="Light or dark">
          {([['light', 'Light'], ['dark', 'Dark'], ['device', 'Match my device']] as const).map(([id, label]) => (
            <button key={id} type="button" className={`seg-btn ${theme === id ? 'on' : ''}`} aria-pressed={theme === id} onClick={() => setTheme(id)} data-testid={`theme-${id}`}>{label}</button>
          ))}
        </div>
        <p className="soft-hint">You are looking at the {isDark ? 'dark' : 'light'} version now. The color choices below are for this version.</p>
      </section>

      <section className="settings-block">
        <h2 className="settings-h">Page color &middot; {isDark ? 'dark' : 'light'}</h2>
        <p className="soft-hint">The color of the page you write on. The color behind it starts as a deeper shade of the same color, so the page stands out. You can pick your own below.</p>
        <div className="bg-sample" style={{ background: behind }} aria-hidden="true" data-testid="page-sample">
          <div className="bg-sample-card" style={{ background: shown, borderColor: isDark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.12)', color: isDark ? '#fff' : '#483a30' }}><b>Sample</b>This is your page.</div>
        </div>
        <div className="accent-row">
          <label className="color-pick">
            <ColorField value={page} onCommit={setPage} label="Pick any page color" testid={isDark ? 'dark-input' : 'bg-input'} />
            <span>Pick any color</span>
          </label>
          <code className="hex">{page}</code>
          <button type="button" className="mini-btn" disabled={pageSaved || savedPages.length >= MAX_SAVED} onClick={() => setSavedPages([...savedPages, page])} data-testid={isDark ? 'save-dark' : 'save-bg'}>{pageSaved ? 'Saved' : 'Save this color'}</button>
          <button type="button" className="mini-btn" onClick={() => setPage(isDark ? DEFAULT_DARK : DEFAULT_BG)} data-testid={isDark ? 'reset-dark' : 'reset-bg'}>Back to the original</button>
        </div>
        <h3 className="settings-sub">Color behind the page</h3>
        <div className="accent-row">
          <label className="color-pick">
            <ColorField value={behind} onCommit={setBack} label="Pick the color behind the page" testid="back-input" />
            <span>{customBack ? 'Your own color' : 'Automatic'}</span>
          </label>
          <code className="hex">{behind}</code>
          <button type="button" className="mini-btn" disabled={!customBack} onClick={() => setBack('')} data-testid="reset-back">Automatic</button>
        </div>
        {!isDark && (<><h3 className="settings-sub">Soft matches for your accent</h3><div className="swatches">{matches.map(c => pageSwatch(c))}</div></>)}
        <h3 className="settings-sub">Ready-made colors</h3>
        <div className="swatches">{presets.map(c => pageSwatch(c.hex, c.label))}</div>
        <h3 className="settings-sub">Your saved colors</h3>
        {savedPages.length ? <div className="swatches">{savedPages.map(c => pageSwatch(c, undefined, true))}</div> : <p className="soft-hint">Nothing saved yet.</p>}
      </section>

      <section className="settings-block">
        <h2 className="settings-h">Accent color</h2>
        <p className="soft-hint">This colors the buttons, today's date, highlighted tabs and small bits of writing.</p>
        <div className="accent-row">
          <label className="color-pick">
            <ColorField value={accent} onCommit={setAccent} label="Pick any color" testid="accent-input" />
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
