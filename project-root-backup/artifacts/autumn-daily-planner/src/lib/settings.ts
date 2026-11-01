import { useEffect, useState } from 'react';
import { useRawField } from '@/lib/planner-store';
import { PALETTE } from '@/lib/palette';

export const DEFAULT_ACCENT = '#a85839';
export const DEFAULT_NAME = 'My Planner';
export const MAX_SAVED = 12;

export const PRESETS = ['#a85839', '#b8862b', '#687454', '#2f6f73', '#3d5a99', '#6b4c9a', '#a8466f', '#c2492e', '#5a4a3c'];

export const DEFAULT_BG = '#f1ecdf';
export const BG_PRESETS = ['#f1ecdf', '#f3e6dc', '#f5e9d2', '#e8eddc', '#dfece9', '#e1e7f3', '#ebe3f2', '#f3e1e8', '#ece7e1'];

export const DEFAULT_DARK = '#2b211b';
export const DARK_PRESETS = [
  { hex: '#2b211b', label: 'Candlelight brown' },
  { hex: '#2a1f3d', label: 'Deep purple' },
  { hex: '#3a2034', label: 'Plum' },
  { hex: '#17202e', label: 'Midnight blue' },
  { hex: '#1c2a22', label: 'Forest' },
  { hex: '#232323', label: 'Charcoal' },
  { hex: '#0c0c0c', label: 'Black' },
];
export type ThemeMode = 'device' | 'light' | 'dark';

export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hslOf(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/** Dark writing on light colors, light writing on dark colors. */
function textOn(hex: string): string {
  const lin = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = rgb(hex);
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.4 ? '#2b2118' : '#fff8eb';
}

export function mixHex(a: string, b: string, t: number) {
  const x = rgb(a), y = rgb(b);
  const c = x.map((v, i) => Math.round(v * t + y[i] * (1 - t)));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Soft backgrounds that go with an accent color. */
export const softMatches = (accent: string) => [
  mixHex(accent, '#ffffff', 0.12),
  mixHex(accent, DEFAULT_BG, 0.18),
  mixHex(accent, DEFAULT_BG, 0.3),
];

function hexOfHsl(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Keep the chosen dark color genuinely dark so the pages and writing stay readable. */
export function clampDark(hex: string): string {
  const [h, s, l] = hslOf(hex);
  return l <= 30 ? hex : hexOfHsl(h, s / 100, 0.3);
}

/** Lighten an accent just enough to be seen on a dark page. */
export function accentForDark(hex: string): string {
  const [h, s, l] = hslOf(hex);
  return l >= 62 ? hex : hexOfHsl(h, s / 100, 0.62);
}

/** The dark version of any planner color, tinted toward the chosen dark base. */
function darken(hex: string, base: string): string {
  const [h, s, l] = hslOf(hex).map((v, i) => (i === 0 ? v : v / 100)) as [number, number, number];
  const [bh, bs, bl] = hslOf(base).map((v, i) => (i === 0 ? v : v / 100)) as [number, number, number];
  const lo = bl + 0.06, hi = 0.92;
  const t = Math.min(1, Math.max(0, (1 - l) / 0.9));
  const L = lo + t * (hi - lo);
  const neutral = h >= 10 && h <= 62 && (s < 0.95 || l > 0.85);
  const H = neutral ? bh : h;
  const S = neutral ? Math.min(s, bs * 1.1) : s * 0.85;
  return hexOfHsl(H, S, L);
}

const hslTriplet = (hex: string) => { const [h, s, l] = hslOf(hex); return `${h} ${s}% ${l}%`; };

function darkCss(baseRaw: string): string {
  const base = clampDark(baseRaw);
  const d = (hex: string) => darken(hex, base);
  const vars = PALETTE.map(h => `--c-${h.slice(1)}:${d(h)};`).join('');
  const tokens = [
    ['--background', base], ['--foreground', d('#493a30')], ['--card', d('#fffaf0')], ['--card-foreground', d('#493a30')],
    ['--border', d('#d2c3ad')], ['--input', d('#d2c3ad')], ['--muted', d('#ded2be')], ['--muted-foreground', d('#8a7a68')],
    ['--secondary', d('#d9cbb5')], ['--accent', d('#d9cbb5')],
  ].map(([k, v]) => `${k}:${hslTriplet(v)};`).join('');
  return `@media screen{html[data-theme="dark"]{color-scheme:dark;--page-bg:${base};${vars}${tokens}}}`;
}

export function applyTheme(dark: boolean, base: string) {
  const root = document.documentElement;
  let el = document.getElementById('dark-theme') as HTMLStyleElement | null;
  if (!el) { el = document.createElement('style'); el.id = 'dark-theme'; document.head.appendChild(el); }
  el.textContent = darkCss(base);
  if (dark) root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
}

export function applyBg(hex: string) {
  const root = document.documentElement.style;
  if (isHex(hex)) root.setProperty('--page-bg', hex); else root.removeProperty('--page-bg');
}

export function applyAccent(hex: string) {
  const color = isHex(hex) ? hex : DEFAULT_ACCENT;
  const [h, s, l] = hslOf(color);
  const root = document.documentElement.style;
  root.setProperty('--rust', color);
  root.setProperty('--on-rust', textOn(color));
  root.setProperty('--primary', `${h} ${s}% ${l}%`);
  root.setProperty('--ring', `${h} ${s}% ${l}%`);
  root.setProperty('--primary-foreground', textOn(color) === '#2b2118' ? '25 30% 12%' : '40 55% 97%');
}

export function useSettings() {
  const [accentRaw, setAccent] = useRawField('s:accent');
  const [nameRaw, setName] = useRawField('s:name');
  const [savedRaw, setSavedRaw] = useRawField('s:saved');
  const [themeRaw, setTheme] = useRawField('s:theme');
  const [darkRaw, setDark] = useRawField('s:dark');
  const [savedDarkRaw, setSavedDarkRaw] = useRawField('s:saveddark');
  const theme: ThemeMode = themeRaw === 'light' || themeRaw === 'dark' ? themeRaw : 'device';
  const darkBase = isHex(darkRaw) ? darkRaw.toLowerCase() : DEFAULT_DARK;
  const savedDark = savedDarkRaw.split(',').filter(isHex);
  const setSavedDark = (list: string[]) => setSavedDarkRaw(list.join(','));
  const [bgRaw, setBg] = useRawField('s:bg');
  const [savedBgRaw, setSavedBgRaw] = useRawField('s:savedbg');
  const bg = isHex(bgRaw) ? bgRaw.toLowerCase() : DEFAULT_BG;
  const savedBg = savedBgRaw.split(',').filter(isHex);
  const setSavedBg = (list: string[]) => setSavedBgRaw(list.join(','));
  const accent = isHex(accentRaw) ? accentRaw.toLowerCase() : DEFAULT_ACCENT;
  const saved = savedRaw.split(',').filter(isHex);
  const setSaved = (list: string[]) => setSavedRaw(list.join(','));
  return { theme, setTheme, darkBase, setDark, savedDark, setSavedDark, bg, setBg, savedBg, setSavedBg, accent, setAccent, name: nameRaw.trim() || DEFAULT_NAME, nameRaw, setName, saved, setSaved };
}

export function usePlannerName() {
  const [n] = useRawField('s:name');
  return n.trim() || DEFAULT_NAME;
}

/** Keeps the page colors in step with the chosen theme, accent and background. */
export function useApplyAccent() {
  const { accent, bg, theme, darkBase } = useSettings();
  const [sys, setSys] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSys(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const dark = theme === 'dark' || (theme === 'device' && sys);
  useEffect(() => {
    const show = (isDark: boolean) => {
      applyTheme(isDark, darkBase);
      applyAccent(isDark ? accentForDark(accent) : accent);
      applyBg(!isDark && bg !== DEFAULT_BG ? bg : '');
    };
    show(dark);
    // Printing always uses the light pages with dark writing.
    const before = () => show(false);
    const after = () => show(dark);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, [dark, accent, bg, darkBase]);
}
