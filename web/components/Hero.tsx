import Link from "next/link";
import { PlatformStats, PublicPolicy } from "@/lib/api";
import { Icon } from "./Icon";

export function Hero({ stats }: { stats: PlatformStats | null }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div className="absolute inset-0 hero-grid" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <p className="eyebrow">
              <span className="h-2 w-2 rounded-full bg-accent" /> RAQAMLI BOZOR
              · KAFIL XIZMATI
            </p>
            <h1 className="mt-6 max-w-[13ch] text-5xl font-extrabold leading-[1.06] sm:text-6xl lg:text-[68px]">
              Kelishuv sizdan.
              <br />
              <span className="text-accent">Kafillik bizdan.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted">
              Akkaunt sotib oling, soting yoki tayyor kelishuvni kod bilan
              oching. To‘lov, tekshirish va bitim holati — barchasi bir joyda.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#katalog" className="btn-accent">
                Katalogni ko‘rish <Icon name="arrow" />
              </a>
              <Link href="/kabinet/yangi" className="btn-ghost">
                <Icon name="plus" /> E’lon berish
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Icon name="shield" width={16} /> To‘lov kafilda
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="check" width={16} /> Web va Telegram’da
              </span>
            </div>
          </div>
          <div className="relative rounded-[28px] bg-[#0d2234] p-6 text-white shadow-xl sm:p-8">
            <div className="flex items-center justify-between border-b border-white/15 pb-5">
              <span className="text-sm font-semibold">
                Bitim qanday ishlaydi?
              </span>
              <Icon
                name="shield"
                className="text-cyan-300"
                width={26}
                height={26}
              />
            </div>
            <ol className="mt-7 space-y-7">
              {[
                [
                  "01",
                  "Tanlang va to‘lang",
                  "Katalogdagi e’lon yoki sotuvchi bergan kod orqali.",
                ],
                [
                  "02",
                  "Akkauntni tekshiring",
                  "To‘lovdan so‘ng ma’lumotlar sizga ochiladi.",
                ],
                [
                  "03",
                  "Bitimni yakunlang",
                  "Tasdiqlang yoki shartlar bo‘yicha qaytarish so‘rang.",
                ],
              ].map(([n, title, text]) => (
                <li key={n} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 font-mono text-sm text-cyan-200">
                    {n}
                  </span>
                  <div>
                    <h2 className="text-base font-semibold">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-7 rounded-xl bg-white/5 p-4 text-xs leading-5 text-slate-300">
              Tekshirish muddati va avtomatik yakunlash vaqti buyurtmangizda
              ko‘rsatiladi.
            </p>
          </div>
        </div>
        {stats && (
          <dl className="mt-12 grid grid-cols-2 gap-5 border-t border-line pt-7 sm:mt-16 sm:grid-cols-4">
            {[
              [stats.active, "Faol e’lon"],
              [stats.sold, "Sotilgan mahsulot"],
              [stats.sellers, "Sotuvchi"],
              [stats.commission + "%", "Platforma komissiyasi"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="tnum mt-1 text-2xl font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

export function RefundPolicy({ policy }: { policy: PublicPolicy | null }) {
  return (
    <section
      id="shartlar"
      className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[.85fr_1.15fr] lg:gap-16"
    >
      <div>
        <p className="eyebrow">SAVDODAN OLDIN</p>
        <h2 className="mt-3 text-3xl font-bold">
          Shartlar ochiq.
          <br />
          Qaror sizniki.
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted">
          Ma’lumotni ochishdan oldin qaytarish shartlarini ko‘ring. Yakuniy
          summa buyurtmadagi “Qaytarish” bo‘limida hisoblanadi.
        </p>
        <a
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent"
          href="https://t.me/bitimax_admin"
          target="_blank"
          rel="noopener noreferrer"
        >
          Yordam bilan bog‘lanish <Icon name="arrow" width={17} />
        </a>
      </div>
      <div className="surface divide-y divide-line overflow-hidden">
        {policy ? (
          <>
            <div className="p-5">
              <h3 className="font-semibold">Ma’lumot hali ochilmagan bo‘lsa</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Pul to‘liq qaytariladi. Ma’lumot {policy.unrevealedGraceHours}{" "}
                soat ochilmasa, tizim avtomatik qaytarishni bajaradi.
              </p>
            </div>
            <div className="p-5">
              <h3 className="font-semibold">Ma’lumotni ochgandan keyin</h3>
              <ul className="mt-3 space-y-3">
                {policy.refundTiers.map((t) => (
                  <li key={t.id} className="flex justify-between gap-4 text-sm">
                    <span className="text-muted">{t.label}</span>
                    <span className="shrink-0 font-semibold">
                      {t.allowed
                        ? `${100 - t.penaltyPercent}% qaytadi`
                        : "Nizo orqali"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-muted">
                Tekshirish uchun {policy.autoReleaseHours} soat. Tasdiqlasangiz
                yoki muddat tugasa, bitim avtomatik yakunlanadi. Ochiq nizo
                alohida ko‘rib chiqiladi.
              </p>
            </div>
          </>
        ) : (
          <div className="p-5 text-sm leading-7 text-muted">
            Amaldagi qaytarish foizlari va muddatlari buyurtmada ko‘rsatiladi.
            To‘lov qilishdan oldin ularni tekshiring yoki yordam xizmatiga
            murojaat qiling.
          </div>
        )}
        <details className="p-5">
          <summary className="cursor-pointer font-semibold">
            Saytda ham to‘liq savdo qila olamanmi?
          </summary>
          <p className="mt-3 text-sm leading-6 text-muted">
            Ha. Telegram orqali kirib, saytda e’lon berish, to‘lash, ma’lumotni
            ochish, bitimni tasdiqlash va hamyondan pul yechishni so‘rash
            mumkin.
          </p>
        </details>
        <details className="p-5">
          <summary className="cursor-pointer font-semibold">
            To‘lovdan keyin holat o‘zgarmasa-chi?
          </summary>
          <p className="mt-3 text-sm leading-6 text-muted">
            To‘lov sahifasida holatni yangilang. Natija tekshirilayotgan bo‘lsa,
            qayta pul yubormang. Buyurtma raqami bilan yordam xizmatiga yozing.
          </p>
        </details>
      </div>
    </section>
  );
}
