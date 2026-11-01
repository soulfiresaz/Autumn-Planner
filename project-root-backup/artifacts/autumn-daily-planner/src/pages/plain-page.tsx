import type { ReactNode } from 'react';
import { useDocumentTitle } from '@/lib/use-print';

export function PlainPage({ title, subtitle, children, testid }: { title: string; subtitle?: string; children: ReactNode; testid?: string }) {
  useDocumentTitle(`${title} · Autumn Planner`);
  return (
    <>
      <main className="main-area plain-main" data-testid={testid}>
        <section className="plain-sheet">
          <h1 className="sheet-title">{title}</h1>
          {subtitle && <p className="sheet-subtitle">{subtitle}</p>}
          <div className="plain-body">{children}</div>
        </section>
      </main>
    </>
  );
}
