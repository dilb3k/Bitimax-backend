'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, logout } from '@/lib/cabinet';
import { ErrorState, Loading, Notice, SubmitButton, useAsync } from '../ui';

const TRUST_LABEL: Record<string, string> = {
  new: 'Yangi sotuvchi',
  verified: 'Tasdiqlangan',
  trusted: 'Ishonchli',
  partner: 'Hamkor',
};

const NOTIFICATIONS: { key: 'newOrder' | 'paymentConfirm' | 'refundUpdate' | 'promo'; label: string }[] = [
  { key: 'newOrder', label: 'Yangi buyurtma' },
  { key: 'paymentConfirm', label: 'To‘lov tasdig‘i' },
  { key: 'refundUpdate', label: 'Qaytarish holati' },
  { key: 'promo', label: 'Yangiliklar va takliflar' },
];

export function SettingsView() {
  const router = useRouter();
  const { data, error, loading, reload, setData } = useAsync(() => api.profile());
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error || 'Yuklab bo‘lmadi'} onRetry={reload} />;

  const { user, policy } = data;

  async function patch(key: string, body: Record<string, unknown>) {
    setBusy(key);
    setNotice(null);
    try {
      const result = await api.updateSettings(body);
      setData({ user: result.user, policy });
      setNotice('Saqlandi.');
    } catch (err: any) {
      setNotice(err?.message || 'Saqlab bo‘lmadi');
    } finally {
      setBusy(null);
    }
  }

  async function signOutEverywhere() {
    setBusy('logout');
    try { await logout(); router.replace('/'); router.refresh(); }
    catch { setNotice('Chiqib bo‘lmadi. Qayta urinib ko‘ring.'); setBusy(null); }
  }

  return (
    <div className="space-y-6">
      <div><p className="eyebrow">PROFIL</p><h1 className="page-title mt-2">Sozlamalar</h1><p className="mt-2 text-sm text-muted">Hisobingiz va Telegram bildirishnomalarini boshqaring.</p></div>
      <div className="surface p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft font-display text-lg font-bold text-ink">
            {(user.firstName || user.username || 'B').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{user.firstName || user.username || 'Foydalanuvchi'}</p>
            <p className="text-sm text-muted">
              {user.role === 'buyer' ? 'Xaridor' : user.role === 'seller' ? 'Sotuvchi' : user.role} ·{' '}
              {TRUST_LABEL[user.trustLevel] || user.trustLevel}
            </p>
          </div>
        </div>

        {user.rating !== null && (
          <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
            Reyting: <span className="tnum text-ink">{user.rating.toFixed(1)}</span>{' '}
            <span className="text-faint">({user.sellerStats.ratingCount} baho)</span> · Sotilgan:{' '}
            <span className="tnum text-ink">{user.sellerStats.sold}</span>
          </p>
        )}
      </div>

      {notice && <Notice tone="info">{notice}</Notice>}

      {user.role === 'buyer' && (
        <div className="surface p-5 sm:p-6">
          <h2 className="font-semibold text-ink">Sotuvchi bo‘lish</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Akkaunt sotish yoki kafil bitim yaratish uchun sotuvchi rejimini yoqing. Komissiya{' '}
            {policy.commission}% — faqat muvaffaqiyatli bitimdan.
          </p>
          <SubmitButton
            busy={busy === 'role'}
            onClick={() => patch('role', { becomeSeller: true })}
            className="btn-accent mt-4"
          >
            Sotuvchi rejimini yoqish
          </SubmitButton>
        </div>
      )}

      <div className="surface p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Bildirishnomalar</h2>
        <p className="mt-1 text-xs text-faint">Botga yuboriladigan xabarlar.</p>
        <ul className="mt-4 space-y-2.5">
          {NOTIFICATIONS.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted">{item.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={user.notificationSettings[item.key]}
                aria-label={item.label}
                disabled={busy !== null}
                onClick={() =>
                  patch(item.key, {
                    notificationSettings: { [item.key]: !user.notificationSettings[item.key] },
                  })
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
                  user.notificationSettings[item.key] ? 'bg-accent' : 'bg-line'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface transition-all ${
                    user.notificationSettings[item.key] ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="surface p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Telegram bot tili</h2>
        <div className="mt-3 flex gap-2">
          {(['uz', 'ru'] as const).map((code) => (
            <button
              key={code}
              type="button"
              disabled={busy !== null}
              onClick={() => patch('language', { language: code })}
              className={`chip ${user.language === code ? 'chip-on' : ''}`}
            >
              {code === 'uz' ? "O‘zbekcha" : 'Русский'}
            </button>
          ))}
        </div>
      </div>

      <div className="surface p-5 sm:p-6">
        <h2 className="font-semibold text-ink">Xavfsizlik</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          “Hamma qurilmadan chiqish” barcha brauzerlardagi sessiyalarni bekor qiladi. Kirish
          har safar botdagi tasdiq bilan tiklanadi. Faqat o‘zingiz boshlagan kirish so‘rovini tasdiqlang.
        </p>
        <SubmitButton busy={busy === 'logout'} onClick={signOutEverywhere} className="btn-ghost mt-4">
          Hamma qurilmadan chiqish
        </SubmitButton>
      </div>

      <div className="surface p-5 text-sm sm:p-6">
        <h2 className="font-semibold text-ink">Qaytarish shartlari</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{policy.refundPolicy}</p>
        <a
          href={policy.supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex text-accent hover:underline"
        >
          Qo‘llab-quvvatlash →
        </a>
      </div>
    </div>
  );
}
