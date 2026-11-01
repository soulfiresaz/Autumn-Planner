import { Fragment, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { fmtLong, weekRangeLabel } from '@/lib/dates';
import { usePlannerStore } from '@/lib/planner-store';
import { isWordsField, locate } from '@/lib/sheet-map';
import { PlainPage } from './plain-page';

function Marked({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  const start = Math.max(0, i - 40);
  const end = Math.min(text.length, i + q.length + 80);
  return (
    <>
      {start > 0 && '…'}{text.slice(start, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length, end)}{end < text.length && '…'}
    </>
  );
}

export default function SearchPage() {
  const { values } = usePlannerStore();
  const [q, setQ] = useState('');
  const term = q.trim();
  const results = useMemo(() => {
    if (term.length < 2) return [];
    const needle = term.toLowerCase();
    const out: { key: string; text: string; href: string; when: string; where: string }[] = [];
    for (const [key, v] of Object.entries(values)) {
      if (typeof v !== 'string') continue;
      const [kind, id, ...rest] = key.split(':');
      if (!isWordsField(rest.join(':'))) continue;
      if (!v.toLowerCase().includes(needle)) continue;
      const loc = locate(key);
      if (!loc) continue;
      const when = kind === 'd' ? fmtLong(id) : kind === 'w' ? `Week of ${weekRangeLabel(id)}` : kind === 'm' ? id : kind === 'pj' ? 'Project task' : 'Project';
      out.push({ key, text: v, href: loc.href, when, where: loc.where });
      if (out.length >= 80) break;
    }
    return out.sort((a, b) => (a.key < b.key ? -1 : 1));
  }, [values, term]);
  return (
    <PlainPage title="Search" subtitle="Find any word you have written, on any day, week or project." testid="search-page">
      <input className="search-box" type="search" placeholder="Search your planner…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search your planner" data-testid="search-input" autoFocus />
      {term.length >= 2 && results.length === 0 && <p className="soft-hint" data-testid="search-none">Nothing found for &ldquo;{term}&rdquo;.</p>}
      <ul className="search-results" data-testid="search-results">
        {results.map(r => (
          <Fragment key={r.key}>
            <li>
              <Link href={r.href} className="search-hit">
                <span className="hit-when">{r.when} &middot; {r.where}</span>
                <span className="hit-text"><Marked text={r.text} q={term} /></span>
              </Link>
            </li>
          </Fragment>
        ))}
      </ul>
    </PlainPage>
  );
}
