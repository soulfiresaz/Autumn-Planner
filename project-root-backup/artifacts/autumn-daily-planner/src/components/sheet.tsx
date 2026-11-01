import type { ReactNode } from 'react';
import autumnStillLife from '@/assets/autumn-still-life.png';

export function SheetFrame({
  eyebrow, title, subtitle, folio, footerLeft, footerRight, art = false, className = '', label, children,
}: {
  eyebrow: string; title: string; subtitle: string; folio?: string;
  footerLeft: string; footerRight?: string; art?: boolean; className?: string; label: string; children: ReactNode;
}) {
  return (
    <article className={`sheet ${className}`} aria-label={label}>
      <header className="sheet-head">
        {art && <img className="art-corner" src={autumnStillLife} alt="" aria-hidden="true" />}
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
