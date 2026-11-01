import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { deletePhoto, getPhoto, putPhoto, shrinkImage } from '@/lib/photos';
import { useRawToggle } from '@/lib/planner-store';

/** One picture for the day, kept on this device (and included in backups). */
export function PhotoOfDay({ date }: { date: string }) {
  const [has, setHas] = useRawToggle(`d:${date}:photo`);
  const [src, setSrc] = useState<string | undefined>();
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    if (!has) { setSrc(undefined); return; }
    getPhoto(date).then(p => { if (alive) setSrc(p); }).catch(() => { if (alive) setSrc(undefined); });
    return () => { alive = false; };
  }, [date, has]);

  const pick = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      const data = await shrinkImage(file);
      await putPhoto(date, data);
      setSrc(data);
      setHas(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That picture could not be saved.');
    }
    if (input.current) input.current.value = '';
  };

  const remove = async () => {
    await deletePhoto(date).catch(() => undefined);
    setSrc(undefined);
    setHas(false);
  };

  return (
    <div className="photo-box">
      {src ? (
        <img src={src} alt={`Picture of the day, ${date}`} className="photo-img" data-testid="photo-img" />
      ) : (
        <button type="button" className="photo-empty print-empty" onClick={() => input.current?.click()} data-testid="photo-add">
          <ImagePlus size={22} strokeWidth={1.4} />
          <span>Add a picture of your day</span>
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={e => pick(e.target.files?.[0])} data-testid="photo-input" />
      {src && (
        <div className="photo-actions print-hide">
          <button type="button" className="mini-btn" onClick={() => input.current?.click()}>Change</button>
          <button type="button" className="mini-btn" onClick={remove} aria-label="Remove picture"><Trash2 size={13} /> Remove</button>
        </div>
      )}
      {error && <div className="move-error" role="alert">{error}</div>}
    </div>
  );
}
