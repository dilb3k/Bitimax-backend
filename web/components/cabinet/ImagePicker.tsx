'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { api } from '@/lib/cabinet';
import { Notice, Spinner } from '../ui';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Photo picker for a listing. Files are sent to our own upload endpoint, which type-checks
 * them and forwards them to Cloudinary under the platform's signature — the browser never
 * gets an upload credential of its own, so a stolen page cannot push arbitrary files into
 * the account.
 *
 * The size and type checks here are pure courtesy to the user (instant feedback instead of a
 * round trip); the real ones run on the server, which is the only place they count.
 */
export function ImagePicker({
  images,
  onChange,
  max,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  max: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    const room = max - images.length;
    if (room <= 0) {
      setError(`Ko‘pi bilan ${max} ta rasm`);
      return;
    }

    setBusy(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, room)) {
        if (!ACCEPTED.includes(file.type)) {
          setError('Faqat JPG, PNG yoki WEBP');
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`“${file.name}” 5 MB dan katta`);
          continue;
        }
        uploaded.push(await api.uploadImage(file));
      }
      if (uploaded.length) onChange([...images, ...uploaded]);
    } catch (err: any) {
      setError(err?.message || 'Rasm yuklanmadi');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {images.map((url, index) => (
          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-line">
            <Image src={url} alt={`Rasm ${index + 1}`} width={80} height={80} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((item) => item !== url))}
              aria-label={`${index + 1}-rasmni o‘chirish`}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-white"
            >
              ×
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-xs text-muted transition hover:border-accent/50 hover:text-ink disabled:opacity-50"
          >
            {busy ? <Spinner size={16} /> : <span className="text-lg leading-none">+</span>}
            {busy ? 'Yuklanmoqda' : 'Rasm'}
          </button>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <p className="mt-2 text-xs text-faint">
        Ixtiyoriy, {max} tagacha. JPG, PNG yoki WEBP, har biri 5 MB gacha.
      </p>

      {error && (
        <div className="mt-2">
          <Notice tone="warn">{error}</Notice>
        </div>
      )}
    </div>
  );
}
