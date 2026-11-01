import { useEffect } from 'react';
import { useRawField } from '@/lib/planner-store';

export const DEFAULT_ACCENT = '#a85839';
export const DEFAULT_NAME = 'My Planner';
export const MAX_SAVED = 12;

export const PRESETS = ['#a85839', '#b8862b', '#687454', '#2f6f73', '#3d5a99', '#6b4c9a', '#a8466f', '#c2492e', '#5a4a3c'];

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
  const accent = isHex(accentRaw) ? accentRaw.toLowerCase() : DEFAULT_ACCENT;
  const saved = savedRaw.split(',').filter(isHex);
  const setSaved = (list: string[]) => setSavedRaw(list.join(','));
  return { accent, setAccent, name: nameRaw.trim() || DEFAULT_NAME, nameRaw, setName, saved, setSaved };
}

export function usePlannerName() {
  const [n] = useRawField('s:name');
  return n.trim() || DEFAULT_NAME;
}

/** Keeps the page colors in step with the chosen accent. */
export function useApplyAccent() {
  const { accent } = useSettings();
  useEffect(() => { applyAccent(accent); }, [accent]);
}
