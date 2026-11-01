import type { Values } from '@/lib/planner-store';
import { allPhotos, replaceAllPhotos } from '@/lib/photos';

const LAST_BACKUP_KEY = 'autumn-planner-last-backup';
export type BackupFile = { app: 'autumn-planner'; version: 3; savedAt: string; values: Values; photos: Record<string, string> };

export function lastBackup(): string | null {
  try { return localStorage.getItem(LAST_BACKUP_KEY); } catch { return null; }
}

export async function makeBackup(values: Values): Promise<Blob> {
  const file: BackupFile = { app: 'autumn-planner', version: 3, savedAt: new Date().toISOString(), values, photos: await allPhotos().catch(() => ({})) };
  try { localStorage.setItem(LAST_BACKUP_KEY, file.savedAt); } catch { /* fine */ }
  return new Blob([JSON.stringify(file)], { type: 'application/json' });
}

export async function readBackup(file: File): Promise<BackupFile> {
  let data: unknown;
  try { data = JSON.parse(await file.text()); } catch { throw new Error('That file is not a planner backup.'); }
  const f = data as Partial<BackupFile>;
  if (!f || f.app !== 'autumn-planner' || typeof f.values !== 'object' || f.values === null) throw new Error('That file is not a planner backup.');
  const values: Values = {};
  for (const [k, v] of Object.entries(f.values)) if (typeof v === 'string' || v === true) values[k] = v;
  const photos: Record<string, string> = {};
  for (const [k, v] of Object.entries(f.photos ?? {})) if (typeof v === 'string' && v.startsWith('data:image/')) photos[k] = v;
  return { app: 'autumn-planner', version: 3, savedAt: String(f.savedAt ?? ''), values, photos };
}

export const restorePhotos = replaceAllPhotos;
