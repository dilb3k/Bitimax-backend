"use client";

import { useState } from "react";
import { api } from "@/lib/cabinet";
import { formatUzs } from "@/lib/api";
import {
  Badge,
  ErrorState,
  Loading,
  Notice,
  SubmitButton,
  formatDateTime,
  useAsync,
} from "../ui";

const PAYOUT_STATUS: Record<
  string,
  { label: string; tone: "ok" | "warn" | "accent" | "muted" }
> = {
  requested: { label: "Ko‘rib chiqilmoqda", tone: "accent" },
  approved: { label: "Tasdiqlangan", tone: "accent" },
  processing: { label: "Yuborilmoqda", tone: "accent" },
  paid: { label: "To‘langan", tone: "ok" },
  rejected: { label: "Rad etilgan", tone: "warn" },
  failed: { label: "Muvaffaqiyatsiz", tone: "warn" },
};

export function WalletView() {
  const { data, error, loading, reload } = useAsync(() => api.wallet());
  const [cardNumber, setCardNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    tone: "ok" | "warn";
    text: string;
  } | null>(null);
  const [editingCard, setEditingCard] = useState(false);

  if (loading) return <Loading />;
  if (error || !data)
    return <ErrorState message={error || "Yuklab bo‘lmadi"} onRetry={reload} />;

  async function saveCard(event: React.FormEvent) {
    event.preventDefault();
    setBusy("card");
    setNotice(null);
    try {
      await api.savePayoutCard(cardNumber, holder.trim());
      setCardNumber("");
      setHolder("");
      setEditingCard(false);
      setNotice({ tone: "ok", text: "Karta saqlandi." });
      await reload();
    } catch (err: any) {
      setNotice({
        tone: "warn",
        text: err?.message || "Kartani saqlab bo‘lmadi",
      });
    } finally {
      setBusy(null);
    }
  }

  async function requestPayout(event: React.FormEvent) {
    event.preventDefault();
    const requested = Number(amount);
    if (
      !Number.isSafeInteger(requested) ||
      requested < data!.minPayout ||
      requested > data!.balance
    ) {
      setNotice({
        tone: "warn",
        text: `Summa ${formatUzs(data!.minPayout)} va ${formatUzs(data!.balance)} oralig‘ida bo‘lishi kerak.`,
      });
      return;
    }
    setBusy("payout");
    setNotice(null);
    try {
      const payout = await api.requestPayout(
        parseInt(amount.replace(/\D/g, ""), 10) || 0,
      );
      setAmount("");
      setNotice({
        tone: "ok",
        text: `So‘rov qabul qilindi: ${formatUzs(payout.netAmount)} → ${payout.destinationMasked}. Natijani shu sahifada kuzatishingiz mumkin.`,
      });
      await reload();
    } catch (err: any) {
      setNotice({
        tone: "warn",
        text: err?.message || "So‘rovni yuborib bo‘lmadi",
      });
    } finally {
      setBusy(null);
    }
  }

  const canPayout = Boolean(data.card) && data.balance >= data.minPayout;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">MABLAG‘LAR</p>
        <h1 className="page-title mt-2">Hamyon</h1>
        <p className="mt-2 text-sm text-muted">
          Balans, to‘lovlar va pul yechish so‘rovlari.
        </p>
      </div>
      <div className="surface border-accent/20 bg-accent-soft/30 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-wider text-muted">
          Yechish mumkin bo‘lgan balans
        </p>
        <p className="tnum mt-1 text-3xl font-bold text-ink">
          {formatUzs(data.balance)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
          <div>
            <dt className="text-faint">Umumiy daromad</dt>
            <dd className="tnum mt-0.5 text-muted">
              {formatUzs(data.totalEarned)}
            </dd>
          </div>
          <div>
            <dt className="text-faint">Umumiy xarajat</dt>
            <dd className="tnum mt-0.5 text-muted">
              {formatUzs(data.totalSpent)}
            </dd>
          </div>
        </dl>
      </div>

      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      <div className="surface p-5 sm:p-6">
        <h2 className="font-semibold text-ink">💳 Pul yechish kartasi</h2>

        {data.card && !editingCard ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="tnum font-mono text-lg text-ink">
                {data.card.masked}
              </p>
              <p className="mt-0.5 text-xs text-faint">{data.card.holder}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingCard(true)}
              className="btn-ghost px-3 py-2 text-sm"
            >
              O‘zgartirish
            </button>
          </div>
        ) : (
          <form onSubmit={saveCard} className="mt-4 space-y-3">
            <label htmlFor="payout-card" className="block text-sm font-medium">
              Karta raqami
            </label>
            <input
              id="payout-card"
              autoComplete="cc-number"
              className="field tnum"
              inputMode="numeric"
              placeholder="8600 1234 5678 9012"
              value={cardNumber}
              onChange={(event) =>
                setCardNumber(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 16)
                    .replace(/(.{4})/g, "$1 ")
                    .trim(),
                )
              }
              required
            />
            <label
              htmlFor="payout-holder"
              className="block text-sm font-medium"
            >
              Karta egasi
            </label>
            <input
              id="payout-holder"
              autoComplete="cc-name"
              className="field"
              placeholder="Karta egasi (kartada yozilgani kabi)"
              value={holder}
              onChange={(event) => setHolder(event.target.value)}
              maxLength={80}
              required
            />
            <div className="flex gap-2.5">
              <SubmitButton
                busy={busy === "card"}
                type="submit"
                className="btn-accent"
              >
                Saqlash
              </SubmitButton>
              {data.card && (
                <button
                  type="button"
                  onClick={() => setEditingCard(false)}
                  className="btn-ghost"
                >
                  Bekor qilish
                </button>
              )}
            </div>
            <p className="text-xs leading-relaxed text-faint">
              Karta raqami shifrlangan holda saqlanadi. Ekranda va xabarlarda
              faqat birinchi va oxirgi to‘rtta raqami ko‘rsatiladi.
            </p>
          </form>
        )}
      </div>

      <div className="surface p-5 sm:p-6">
        <h2 className="font-semibold text-ink">💸 Pul yechish</h2>
        <p className="mt-1 text-xs text-faint">
          Minimal {formatUzs(data.minPayout)}
          {data.payoutFee > 0 &&
            ` · o‘tkazma haqi ${formatUzs(data.payoutFee)}`}
        </p>

        <form
          onSubmit={requestPayout}
          className="mt-4 flex flex-col gap-2.5 sm:flex-row"
        >
          <input
            className="field tnum"
            aria-label="Yechiladigan summa, so‘m"
            inputMode="numeric"
            placeholder={String(data.minPayout)}
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value.replace(/\D/g, ""))
            }
            disabled={!canPayout}
            required
          />
          <SubmitButton
            busy={busy === "payout"}
            type="submit"
            className="btn-accent shrink-0"
            disabled={!canPayout}
          >
            So‘rov yuborish
          </SubmitButton>
        </form>

        {amount && canPayout && (
          <p className="mt-3 text-sm text-muted">
            Kartaga tushadi:{" "}
            <strong className="tnum text-ink">
              {formatUzs(Math.max(0, Number(amount) - data.payoutFee))}
            </strong>
          </p>
        )}
        {!data.card && (
          <p className="mt-2 text-xs text-warn">Avval kartangizni saqlang.</p>
        )}
        {data.card && data.balance < data.minPayout && (
          <p className="mt-2 text-xs text-warn">
            Balans yetarli emas — minimal {formatUzs(data.minPayout)}.
          </p>
        )}
      </div>

      {data.payouts.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-faint">
            Yechish so‘rovlari
          </h2>
          <ul className="space-y-2">
            {data.payouts.map((payout) => {
              const meta = PAYOUT_STATUS[payout.status] || {
                label: payout.status,
                tone: "muted" as const,
              };
              return (
                <li
                  key={payout.id}
                  className="surface flex items-center justify-between gap-4 p-3.5"
                >
                  <div>
                    <p className="tnum font-medium text-ink">
                      {formatUzs(payout.netAmount)}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">
                      {payout.destinationMasked} ·{" "}
                      {formatDateTime(payout.requestedAt)}
                    </p>
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-faint">
          So‘nggi tranzaksiyalar
        </h2>
        {data.entries.length === 0 ? (
          <p className="surface p-5 text-sm text-muted">
            Hozircha tranzaksiyalar yo‘q.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.entries.map((entry) => (
              <li
                key={entry.id}
                className="surface flex items-center justify-between gap-4 p-3.5"
              >
                <div>
                  <p className="text-sm text-ink">{entry.label}</p>
                  <p className="mt-0.5 text-xs text-faint">
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
                <p
                  className={`tnum font-semibold ${entry.amount > 0 ? "text-ok" : "text-muted"}`}
                >
                  {entry.amount > 0 ? "+" : "−"}
                  {formatUzs(Math.abs(entry.amount))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
