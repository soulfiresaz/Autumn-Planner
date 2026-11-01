import type { ReactNode } from 'react';

/** A quiet sunrise over hills: no season, no gender, and it takes your accent color in light and dark. */
function SheetArt() {
  return (
    <svg className="art-corner" viewBox="0 0 144 110" aria-hidden="true" focusable="false">
      <circle cx="98" cy="44" r="21" style={{ fill: 'var(--rust)', opacity: 0.85 }} />
      <path d="M0 80 C 26 60, 52 62, 76 78 S 124 94, 144 72 V110 H0 Z" style={{ fill: 'var(--rust)', opacity: 0.26 }} />
      <path d="M0 94 C 32 78, 62 82, 88 92 S 126 102, 144 90 V110 H0 Z" style={{ fill: 'var(--rust)', opacity: 0.5 }} />
      <path d="M0 105 C 40 96, 76 100, 108 104 S 132 108, 144 104 V110 H0 Z" style={{ fill: 'var(--rust)', opacity: 0.8 }} />
    </svg>
  );
}

export function SheetFrame({
  eyebrow, title, subtitle, folio, footerLeft, footerRight, art = false, className = '', label, children,
}: {
  eyebrow: string; title: string; subtitle: string; folio?: string;
  footerLeft: string; footerRight?: string; art?: boolean; className?: string; label: string; children: ReactNode;
}) {
  return (
    <article className={`sheet ${className}`} aria-label={label}>
      <header className="sheet-head">
        {art && <SheetArt />}
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="sheet-title">{title}</h1>
          <p className="sheet-subtitle">{subtitle}</p>
        </div>
        {folio && <span className="folio">{folio}</span>}
      </header>
      <div className="sheet-content">{children}</div>
      <footer className="sheet-footer">
        <span>{footerLeft}</span>
        {footerRight && <span>{footerRight}</span>}
      </footer>
    </article>
  );
}
