import { Link } from 'wouter';

export default function NotFound() {
  return (
    <main className="main-area">
      <article className="sheet" style={{ minHeight: 320, textAlign: 'center' }}>
        <div className="sheet-content" style={{ paddingTop: 40 }}>
          <div className="eyebrow">Autumn planner</div>
          <h1 className="sheet-title" style={{ margin: '0 auto' }}>That page isn&rsquo;t here</h1>
          <p className="sheet-subtitle" style={{ margin: '14px auto 26px' }}>
            This planner covers November 1, 2026 through January 31, 2027.
          </p>
          <Link href="/" className="chip-link is-accent" data-testid="link-back-calendar">Back to the calendar</Link>
        </div>
      </article>
    </main>
  );
}
