import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

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
  useEffect(() => {
    document.title = title;
  }, [title]);
}
