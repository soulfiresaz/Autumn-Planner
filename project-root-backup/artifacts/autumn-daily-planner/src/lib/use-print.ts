import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { usePlannerName } from '@/lib/settings';

/** Lets a page choose what the hidden print copy contains, then opens the print dialog. */
export function usePrintMode() {
  const [all, setAll] = useState(true);
  const printNow = (value: boolean) => {
    flushSync(() => setAll(value));
    window.print();
  };
  return { all, printNow };
}

export function useDocumentTitle(title: string) {
  const name = usePlannerName();
  useEffect(() => {
    document.title = title.replace('Autumn Planner', name);
  }, [title, name]);
}
