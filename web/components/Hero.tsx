import Link from "next/link";
import { PlatformStats, PublicPolicy } from "@/lib/api";
import { Icon } from "./Icon";

export function Hero({ stats }: { stats: PlatformStats | null }) {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <p className="eyebrow"><Icon name="shield" width={18} /> BITMAX · KAFIL XIZMATI</p>
        <h1 className="mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">Akkaunt sotib oling yoki soting.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">Pul tekshirish vaqtida kafilda saqlanadi. Bitim tasdiqlanganda yoki tekshirish muddati tugaganda sotuvchiga o‘tadi.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#katalog" className="btn-accent"><Icon name="bag" /> Sotib olish</a>
          <Link href="/kabinet/yangi" className="btn-ghost"><Icon name="plus" /> E’lon berish</Link>
          <Link href="/kod" className="btn-ghost"><Icon name="code" /> Kodim bor</Link>
        </div>
        <details className="mt-5 max-w-2xl text-sm text-muted">
          <summary className="cursor-pointer py-2 font-medium text-ink">Savdo qanday ishlaydi?</summary>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            <li><strong className="block text-ink">1. Tanlang va to‘lang</strong>Katalogdan yoki sotuvchi bergan kod bilan.</li>
            <li><strong className="block text-ink">2. Akkauntni tekshiring</strong>To‘lovdan keyin login va parolni oching.</li>
            <li><strong className="block text-ink">3. Tasdiqlang</strong>Muammo bo‘lsa, muddat ichida qaytarishni so‘rang.</li>
          </ol>
          <p className="mt-3">Muddat va qaytarish shartlari buyurtmada ko‘rsatiladi.{stats && ` Platforma komissiyasi: ${stats.commission}%.`} <a href="#shartlar" className="text-accent underline">Shartlarni ko‘rish</a></p>
        </details>
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
          Pul qachon qaytariladi?
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
