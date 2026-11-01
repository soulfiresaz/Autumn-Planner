import type { ReactNode } from 'react';
import { CalendarDays } from 'lucide-react';
import { Link } from 'wouter';
import { useDocumentTitle } from '@/lib/use-print';

export function PlainPage({ title, subtitle, children, testid }: { title: string; subtitle?: string; children: ReactNode; testid?: string }) {
  useDocumentTitle(`${title} · Autumn Planner`);
  return (
    <>
      <div className="context-wrap">
        <div className="context-bar">
          <div className="context-left">
            <Link href="/" className="chip-link" data-testid="link-calendar"><CalendarDays size={15} strokeWidth={1.7} /> <span>Calendar</span></Link>
          </div>
        </div>
      </div>
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
