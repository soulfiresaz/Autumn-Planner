import { useEffect, useState } from 'react';
import { useRawField } from '@/lib/planner-store';
import { PALETTE } from '@/lib/palette';

export const DEFAULT_ACCENT = '#a85839';
export const DEFAULT_NAME = 'My Planner';
export const MAX_SAVED = 12;

export const PRESETS = ['#a85839', '#b8862b', '#687454', '#2f6f73', '#3d5a99', '#6b4c9a', '#a8466f', '#c2492e', '#5a4a3c'];

export const DEFAULT_BG = '#f9f5e9'; // the light page color
export const BG_PRESETS = ['#f9f5e9', '#f8ece4', '#faf0d9', '#eef3e2', '#e6f2ef', '#e9eefa', '#f2ebf8', '#f9e8ee', '#f0ebe5'];

export const DEFAULT_DARK = '#3a2d25'; // the dark page color
export const DARK_PRESETS = [
  { hex: '#3a2d25', label: 'Candlelight brown' },
  { hex: '#33274a', label: 'Deep purple' },
  { hex: '#472b40', label: 'Plum' },
  { hex: '#232f44', label: 'Midnight blue' },
  { hex: '#27382d', label: 'Forest' },
  { hex: '#2e2e2e', label: 'Charcoal' },
  { hex: '#141414', label: 'Black' },
];
export type ThemeMode = 'device' | 'light' | 'dark';

export type TextSize = 'small' | 'medium' | 'large' | 'xl';
export const TEXT_SIZES: { id: TextSize; label: string; scale: number }[] = [
  { id: 'small', label: 'Small', scale: 0.92 },
  { id: 'medium', label: 'Medium', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.15 },
  { id: 'xl', label: 'Extra large', scale: 1.32 },
];

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
  mixHex(accent, '#ffffff', 0.1),
  mixHex(accent, DEFAULT_BG, 0.12),
  mixHex(accent, DEFAULT_BG, 0.2),
];

function hexOfHsl(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('');
}

/** Lighten or darken a color a little, keeping its hue. */
export function shade(hex: string, delta: number): string {
  const [h, sat, l] = hslOf(hex);
  return hexOfHsl(h, sat / 100, Math.min(0.98, Math.max(0.02, l / 100 + delta)));
}

/** Keep a dark page color genuinely dark so the writing stays readable. */
export function clampDark(hex: string): string {
  const [h, s, l] = hslOf(hex);
  return l <= 36 ? hex : hexOfHsl(h, s / 100, 0.36);
}

/** Keep a light page color genuinely light for the same reason. */
export function clampLight(hex: string): string {
  const [h, s, l] = hslOf(hex);
  return l >= 78 ? hex : hexOfHsl(h, s / 100, 0.78);
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

function darkCss(pageRaw: string): string {
  const page = clampDark(pageRaw);
  const base = shade(page, -0.06); // the color behind the page, chosen for you
  const d = (hex: string) => darken(hex, base);
  const vars = PALETTE.map(h => `--c-${h.slice(1)}:${d(h)};`).join('');
  const tokens = [
    ['--background', base], ['--foreground', d('#493a30')], ['--card', d('#fffaf0')], ['--card-foreground', d('#493a30')],
    ['--border', d('#d2c3ad')], ['--input', d('#d2c3ad')], ['--muted', d('#ded2be')], ['--muted-foreground', d('#8a7a68')],
    ['--secondary', d('#d9cbb5')], ['--accent', d('#d9cbb5')],
  ].map(([k, v]) => `${k}:${hslTriplet(v)};`).join('');
  const pageVars = `--paper:${page};--c-f9f5e9:${page};--c-fbf7ec:${shade(page, 0.015)};`;
  return `@media screen{html[data-theme="dark"]{color-scheme:dark;--page-bg:${base};${vars}${pageVars}${tokens}}}`;
}

export function applyTheme(dark: boolean, page: string) {
  const root = document.documentElement;
  let el = document.getElementById('dark-theme') as HTMLStyleElement | null;
  if (!el) { el = document.createElement('style'); el.id = 'dark-theme'; document.head.appendChild(el); }
  el.textContent = darkCss(page);
  if (dark) root.setAttribute('data-theme', 'dark'); else root.removeAttribute('data-theme');
}

const PAGE_PROPS = ['--paper', '--c-f9f5e9', '--c-fbf7ec', '--page-bg'];

/** Light mode: the page is the color you picked, and the color behind it is chosen for you. */
export function applyLightPage(hex: string) {
  const root = document.documentElement.style;
  if (!isHex(hex) || hex.toLowerCase() === DEFAULT_BG) { PAGE_PROPS.forEach(p => root.removeProperty(p)); return; }
  const page = clampLight(hex);
  root.setProperty('--paper', page);
  root.setProperty('--c-f9f5e9', page);
  root.setProperty('--c-fbf7ec', shade(page, 0.01));
  root.setProperty('--page-bg', shade(page, -0.04));
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
  const [sizeRaw, setSize] = useRawField('s:size');
  const textSize: TextSize = TEXT_SIZES.some(t => t.id === sizeRaw) ? (sizeRaw as TextSize) : 'medium';
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
  return { textSize, setTextSize: setSize, theme, setTheme, darkBase, setDark, savedDark, setSavedDark, bg, setBg, savedBg, setSavedBg, accent, setAccent, name: nameRaw.trim() || DEFAULT_NAME, nameRaw, setName, saved, setSaved };
}

export function usePlannerName() {
  const [n] = useRawField('s:name');
  return n.trim() || DEFAULT_NAME;
}

/** Keeps the page colors in step with the chosen theme, accent and background. */
export function useIsDark() {
  const { theme } = useSettings();
  const [sys, setSys] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSys(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return theme === 'dark' || (theme === 'device' && sys);
}

export function useApplyAccent() {
  const { accent, bg, darkBase, textSize } = useSettings();
  const dark = useIsDark();
  useEffect(() => {
    const show = (isDark: boolean) => {
      applyTheme(isDark, darkBase);
      applyAccent(isDark ? accentForDark(accent) : accent);
      document.documentElement.style.setProperty('--accent-orig', accent);
      applyLightPage(isDark ? '' : bg);
    };
    const scale = TEXT_SIZES.find(t => t.id === textSize)!.scale;
    document.documentElement.style.setProperty('--text-scale', String(scale));
    show(dark);
    // Printing always uses the light pages with dark writing.
    const before = () => show(false);
    const after = () => show(dark);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, [dark, accent, bg, darkBase, textSize]);
}
