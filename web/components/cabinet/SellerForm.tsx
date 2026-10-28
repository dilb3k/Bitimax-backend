'use client';

import { Icon } from "@/components/Icon";
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/cabinet';
import { formatUzs } from '@/lib/api';
import { CopyButton, ErrorState, Loading, Notice, SubmitButton, useAsync } from '../ui';
import { ImagePicker } from './ImagePicker';

type Mode = 'listing' | 'deal';

interface DealResult {
  dealCode: string;
  title: string;
  price: number;
  sellerPayout: number;
  shareText: string;
}

/**
 * The seller flows the bot runs as multi-step wizards, as one reviewable form.
 *
 * A chat wizard asks one question at a time because that is all a chat can do; a page can show
 * the whole thing at once, with the commission maths updating as the price is typed. The two
 * paths differ only in what they ask for: a catalog listing has to convince a stranger
 * (description, category, photos), a private deal only has to be correct.
 */
export function SellerForm({ mode }: { mode: Mode }) {
  const { data, error: loadError, loading, reload } = useAsync(() => api.profile());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listingDone, setListingDone] = useState(false);
  const [listingCode, setListingCode] = useState('');
  const [deal, setDeal] = useState<DealResult | null>(null);

  if (loading) return <Loading />;
  if (loadError || !data) return <ErrorState message={loadError || 'Yuklab bo‘lmadi'} onRetry={reload} />;

  const policy = data.policy;
  const priceValue = Number(price) || 0;
  const commission = Math.round((priceValue * policy.commission) / 100);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const credentials = {
        login: login.trim(),
        password,
        recoveryCode: recoveryCode.trim() || undefined,
        images,
      };

      if (mode === 'deal') {
        const created = await api.createDeal({ title: title.trim(), price: priceValue, ...credentials });
        setDeal(created);
      } else {
        const created = await api.createListing({
          title: title.trim(),
          description: description.trim(),
          price: priceValue,
          category,
          ...credentials,
        });
        setListingCode(created.listingCode);
        setListingDone(true);
      }
      // The plaintext password has no reason to stay in component state once it is stored.
      setPassword('');
      setLogin('');
      setRecoveryCode('');
    } catch (err: any) {
      setError(err?.message || 'Saqlab bo‘lmadi');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setDeal(null); setListingDone(false); setTitle(''); setDescription(''); setPrice('');
    setCategory(''); setLogin(''); setPassword(''); setRecoveryCode(''); setImages([]); setShowPassword(false); setError(null);
  }

  if (deal) {
    return (
      <div className="surface p-6 sm:p-8">
        <h2 className="text-xl font-bold text-ink"><Icon name="check" className="mr-2 inline-block align-text-bottom text-ok" /> Bitim tayyor</h2>
        <p className="mt-1 text-sm text-muted">{deal.title}</p>

        <div className="mt-5 rounded-lg border border-line bg-raised p-4 text-center">
          <p className="text-xs text-faint">Xaridorga shu kodni yuboring</p>
          <p className="tnum mt-1.5 font-mono text-3xl font-bold tracking-[0.12em] text-ink">
            {deal.dealCode}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <CopyButton value={deal.dealCode} label="Kodni nusxalash" />
            <CopyButton value={deal.shareText} label="Matnni nusxalash" />
          </div>
        </div>

        <dl className="mt-5 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-faint">Summa</dt>
            <dd className="tnum text-muted">{formatUzs(deal.price)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-faint">Siz olasiz</dt>
            <dd className="tnum font-semibold text-ink">{formatUzs(deal.sellerPayout)}</dd>
          </div>
        </dl>

        <p className="mt-5 text-xs leading-relaxed text-faint">
          Xaridor kodni saytdagi “Kod bilan sotib olish” sahifasiga yoki botga kiritadi. Kod 7 kun
          amal qiladi va katalogda ko‘rinmaydi.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/kabinet/sotuv" className="btn-accent text-sm">
            E’lonlarim
          </Link>
          <button type="button" onClick={reset} className="btn-ghost text-sm">Yana bitim yaratish</button>
        </div>
      </div>
    );
  }

  if (listingDone) {
    return (
      <div className="surface p-6 text-center sm:p-8">
        <p className="text-3xl" aria-hidden="true">
          <Icon name="check" width={32} height={32} className="mx-auto text-accent" />
        </p>
        <h2 className="mt-3 text-xl font-bold text-ink">E’lon katalogda</h2>
        <div className="mt-4 flex items-center justify-center gap-3"><span className="font-mono text-2xl">#{listingCode}</span><CopyButton value={listingCode} label="ID’ni nusxalash" /></div>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Xaridor e’lonni katalogdan yoki shu ID orqali botdan topadi.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/kabinet/sotuv" className="btn-accent text-sm">
            E’lonlarim
          </Link>
          <button type="button" onClick={reset} className="btn-ghost text-sm">Yana e’lon berish</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="surface space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">1. Mahsulot haqida</h2>
        <Field label="Nomi" hint={mode === 'deal' ? '3–120 belgi' : '5–120 belgi'}>
          <input
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Instagram @mynick, 12k obunachi"
            minLength={mode === 'deal' ? 3 : 5}
            maxLength={120}
            required
          />
        </Field>

        {mode === 'listing' && (
          <Field label="Tavsif" hint="Kamida 20 belgi — obunachilar, yosh, geografiya, nima uchun sotilyapti">
            <textarea
              className="field min-h-[120px] resize-y"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={20}
              maxLength={4000}
              required
            />
          </Field>
        )}

        <Field label="Narx (so‘m)">
          <input
            className="field tnum"
            type="number"
            min={1000}
            max={1000000000}
            step={1}
            inputMode="numeric"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="250000"
            required
          />
          {priceValue >= 1000 && (
            <p className="mt-2 text-xs text-muted">
              Siz olasiz: <strong className="tnum text-ink">{formatUzs(priceValue - commission)}</strong>{' '}
              <span className="text-faint">
                (komissiya {policy.commission}% — {formatUzs(commission)})
              </span>
            </p>
          )}
        </Field>

        {mode === 'listing' && (
          <Field label="Kategoriya">
            <select
              className="field"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            >
              <option value="" disabled>
                Tanlang…
              </option>
              {policy.categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Rasmlar">
          <ImagePicker images={images} onChange={setImages} max={policy.maxImages} />
        </Field>
      </div>

      <div className="surface space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="font-semibold text-ink"><Icon name="key" className="mr-2 inline-block align-text-bottom" /> 2. Akkaunt ma’lumotlari</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Shifrlangan holda saqlanadi va faqat to‘lov tasdiqlangandan keyin xaridorga ochiladi.
            Moderator ham ularni ko‘rmaydi.
          </p>
        </div>

        <Field label="Login (email yoki username)">
          <input
            className="field"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            autoComplete="off"
            maxLength={200}
            required
          />
        </Field>

        <Field label="Parol">
          <div className="flex gap-2">
            <input
              className="field"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              maxLength={200}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="btn-ghost shrink-0 px-3 py-2 text-sm"
            >
              {showPassword ? 'Yashirish' : 'Ko‘rsatish'}
            </button>
          </div>
        </Field>

        <Field label="Tiklash kodi / qo‘shimcha" hint="Ixtiyoriy">
          <input
            className="field"
            value={recoveryCode}
            onChange={(event) => setRecoveryCode(event.target.value)}
            autoComplete="off"
            maxLength={300}
          />
        </Field>
      </div>

      {error && <Notice tone="warn">{error}</Notice>}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <SubmitButton busy={busy} type="submit" className="btn-accent flex-1">
          {mode === 'deal' ? 'Kodni yaratish' : 'E’lonni yuborish'}
        </SubmitButton>
        <Link href="/kabinet/sotuv" className="btn-ghost flex-1 justify-center">
          Bekor qilish
        </Link>
      </div>

      <p className="text-xs leading-relaxed text-faint">
        {mode === 'deal'
          ? 'Bitim katalogda ko‘rinmaydi — uni faqat kod bilan ochish mumkin. Komissiya ' +
            `${policy.commission}% faqat muvaffaqiyatli bitimdan ushlanadi.`
          : 'Soxta akkaunt = bloklash va barcha e’lonlar arxivi. Platformadan tashqaridagi ' +
            'kelishuvlarga tizim javob bermaydi.'}
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {hint && <span className="mb-1.5 block text-xs text-faint">{hint}</span>}
      {children}
    </label>
  );
}
