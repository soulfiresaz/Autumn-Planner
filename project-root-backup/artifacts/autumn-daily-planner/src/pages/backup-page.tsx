import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { lastBackup, makeBackup, readBackup, restorePhotos, type BackupFile } from '@/lib/backup';
import { todayISO } from '@/lib/dates';
import { usePlannerStore } from '@/lib/planner-store';
import { PlainPage } from './plain-page';

export default function BackupPage() {
  const { values, replaceAll } = usePlannerStore();
  const [msg, setMsg] = useState('');
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [saved, setSaved] = useState(lastBackup());
  const input = useRef<HTMLInputElement>(null);
  const count = Object.keys(values).length;

  const save = async () => {
    const blob = await makeBackup(values);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `autumn-planner-backup-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setSaved(lastBackup());
    setMsg('Your backup file was saved. Keep it somewhere safe, like your email or cloud drive.');
  };

  const choose = async (file?: File) => {
    if (!file) return;
    try { setPending(await readBackup(file)); setMsg(''); } catch (e) { setPending(null); setMsg(e instanceof Error ? e.message : 'That file could not be read.'); }
    if (input.current) input.current.value = '';
  };

  const restore = async () => {
    if (!pending) return;
    await restorePhotos(pending.photos).catch(() => undefined);
    replaceAll(pending.values);
    setMsg(`Restored ${Object.keys(pending.values).length} saved entries${Object.keys(pending.photos).length ? ' and your pictures' : ''}.`);
    setPending(null);
  };

  return (
    <PlainPage title="Backup & restore" subtitle="Your writing is saved on this device. A backup file keeps a safe copy, and lets you move everything to a new phone or computer." testid="backup-page">
      <div className="backup-grid">
        <section className="backup-card">
          <h2 className="group-title">Save a backup</h2>
          <p className="soft-hint">{count === 0 ? 'Nothing written yet.' : `${count} saved entries, plus any pictures.`} {saved ? `Last backup: ${new Date(saved).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.` : 'You haven’t made a backup yet.'}</p>
          <button type="button" className="chip-link is-accent" onClick={save} data-testid="backup-save"><Download size={15} /> <span>Save a backup file</span></button>
        </section>
        <section className="backup-card">
          <h2 className="group-title">Restore from a backup</h2>
          <p className="soft-hint">Choose a backup file you saved before. It replaces what is on this device now.</p>
          <input ref={input} type="file" accept=".json,application/json" hidden onChange={e => choose(e.target.files?.[0])} data-testid="backup-file" />
          <button type="button" className="chip-link" onClick={() => input.current?.click()} data-testid="backup-choose"><Upload size={15} /> <span>Choose a backup file</span></button>
          {pending && (
            <div className="confirm-box" role="alertdialog" aria-label="Confirm restore">
              <p>This backup has {Object.keys(pending.values).length} entries{pending.savedAt ? `, saved ${new Date(pending.savedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}` : ''}. Restoring replaces everything now on this device.</p>
              <div className="confirm-actions">
                <button type="button" className="chip-link is-accent" onClick={restore} data-testid="backup-confirm">Replace with this backup</button>
                <button type="button" className="chip-link" onClick={() => setPending(null)}>Cancel</button>
              </div>
            </div>
          )}
        </section>
      </div>
      {msg && <p className="backup-msg" role="status" data-testid="backup-msg">{msg}</p>}
    </PlainPage>
  );
}
