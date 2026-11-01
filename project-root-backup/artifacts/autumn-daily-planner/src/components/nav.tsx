import { useEffect, useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { Link } from 'wouter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type PrintOption = { label: string; run: () => void };

export function PrintMenu({ options }: { options: PrintOption[] }) {
  if (options.length === 1) {
    return (
      <button className="print-button" type="button" aria-label="Print" onClick={options[0].run} data-testid="button-print">
        <Printer size={15} strokeWidth={1.7} /> <span>Print</span>
      </button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="print-button" type="button" aria-label="Print" data-testid="button-print">
          <Printer size={15} strokeWidth={1.7} /> <span>Print</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="print-menu">
        {options.map(option => (
          <DropdownMenuItem key={option.label} onSelect={option.run} className="print-menu-item" data-testid={`print-${option.label.toLowerCase().replace(/\W+/g, '-')}`}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StepLinks({
  prev, next, prevLabel, nextLabel, children,
}: { prev?: string; next?: string; prevLabel: string; nextLabel: string; children?: ReactNode }) {
  return (
    <div className="step-links">
      {prev ? (
        <Link href={prev} className="step-btn" aria-label={prevLabel} data-testid="link-prev"><ChevronLeft size={18} /></Link>
      ) : (
        <span className="step-btn is-disabled" aria-disabled="true"><ChevronLeft size={18} /></span>
      )}
      {children}
      {next ? (
        <Link href={next} className="step-btn" aria-label={nextLabel} data-testid="link-next"><ChevronRight size={18} /></Link>
      ) : (
        <span className="step-btn is-disabled" aria-disabled="true"><ChevronRight size={18} /></span>
      )}
    </div>
  );
}

export function SheetTabs({ tabs, active, label }: { tabs: { href: string; label: string; testid: string }[]; active: number; label: string }) {
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    const el = activeRef.current;
    const box = el?.parentElement;
    if (el && box) box.scrollLeft = Math.max(0, el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2);
  }, [active]);
  return (
    <nav className="nav-wrap" aria-label={label}>
      <div className="page-nav">
        {tabs.map((tab, i) => (
          <Link
            ref={i === active ? activeRef : undefined}
            key={tab.href}
            href={tab.href}
            className={`nav-link ${i === active ? 'active' : ''}`}
            aria-current={i === active ? 'page' : undefined}
            data-testid={tab.testid}
          >
            <span className="nav-index">{String(i + 1).padStart(2, '0')}</span><span>{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Wraps a page: screen content on top, a hidden print copy underneath. */
export function PageLayout({ bar, tabs, children, print }: { bar: ReactNode; tabs?: ReactNode; children: ReactNode; print: ReactNode }) {
  return (
    <>
      <div className="context-wrap">{bar}</div>
      {tabs}
      <main className="main-area">{children}</main>
      <div className="print-all" aria-hidden="true">{print}</div>
    </>
  );
}
