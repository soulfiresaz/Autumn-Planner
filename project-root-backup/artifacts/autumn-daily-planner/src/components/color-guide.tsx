import { useEffect, useRef, useState } from 'react';

const hx = (v: number) => Math.round(v).toString(16).padStart(2, '0');

/** What the eye sees: paint each (possibly see-through) color over the ones beneath it. */
function seen(...layers: (string | undefined)[]): string {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g) return '';
    for (const color of layers) { if (!color) continue; g.fillStyle = color; g.fillRect(0, 0, 1, 1); }
    const d = g.getImageData(0, 0, 1, 1).data;
    return '#' + hx(d[0]) + hx(d[1]) + hx(d[2]);
  } catch { return ''; }
}

/** A labeled picture of every color layer, using the real colors on screen right now. */
export function ColorGuide({ watch }: { watch: string }) {
  const bgRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLSpanElement>(null);
  const accentRef = useRef<HTMLSpanElement>(null);
  const [hex, setHex] = useState<Record<string, string>>({});

  useEffect(() => {
    const id = window.setTimeout(() => {
      const css = (el: HTMLElement | null, prop: 'backgroundColor' | 'color' = 'backgroundColor') => (el ? getComputedStyle(el)[prop] : undefined);
      const bgC = css(bgRef.current), pageC = css(pageRef.current);
      setHex({
        bg: seen(bgC), page: seen(bgC, pageC), panel: seen(bgC, pageC, css(panelRef.current)), card: seen(bgC, pageC, css(cardRef.current)),
        ink: seen(css(inkRef.current, 'color')), accent: seen(css(accentRef.current)),
      });
    }, 120);
    return () => window.clearTimeout(id);
  }, [watch]);

  const tag = (n: number, name: string, what: string, h?: string) => (
    <div className="guide-tag"><span className="guide-num">{n}</span><div><b>{name}</b>{h && <code>{h}</code>}<p>{what}</p></div></div>
  );

  return (
    <div className="color-guide">
      <div className="guide-bg" ref={bgRef} data-testid="guide-bg">
        <span className="guide-cap">1 &middot; Behind the page</span>
        <div className="guide-page" ref={pageRef}>
          <span className="guide-cap">2 &middot; Page color</span>
          <div className="guide-panel" ref={panelRef}>
            <span className="guide-cap">3 &middot; Section panel</span>
            <span className="guide-ink" ref={inkRef}>5 &middot; Writing</span>
          </div>
          <div className="guide-card" ref={cardRef}>
            <span className="guide-cap">4 &middot; Highlight card</span>
          </div>
          <span className="guide-accent" ref={accentRef}>6 &middot; Accent</span>
        </div>
      </div>
      <div className="guide-tags">
        {tag(1, 'Behind the page', 'Chosen for you: a slightly deeper shade of your page color, so the page stands out. You do not pick this one.', hex.bg)}
        {tag(2, 'Page color', 'The color you pick in Page color. It is the paper you write on, and it is exactly the color you chose.', hex.page)}
        {tag(3, 'Section panel', 'The soft boxes that group things on a page, such as Weather, Priorities and Habits.', hex.panel)}
        {tag(4, 'Highlight card', 'The boxes with their own tint, such as Reminders and In the car. They are meant to stand out from the plain panels.', hex.card)}
        {tag(5, 'Writing', 'Titles, labels and everything you type.', hex.ink)}
        {tag(6, 'Accent', 'Buttons, today, the highlighted tab and little touches of writing. This is the one you choose in Accent color.', hex.accent)}
      </div>
    </div>
  );
}
