import Link from "next/link";
import { Icon } from "./Icon";
export function DealCode() {
  return (
    <section id="qanday" className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <div className="grid gap-7 rounded-3xl border border-accent/20 bg-accent-soft/40 p-6 sm:p-9 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-start gap-4">
          <span className="hidden rounded-2xl bg-surface p-4 text-accent sm:block">
            <Icon name="code" width={28} height={28} />
          </span>
          <div>
            <p className="eyebrow">SHAXSIY KELISHUV</p>
            <h2 className="mt-2 text-2xl font-bold">
              Xaridor bilan kelishib bo‘ldingizmi?
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
              Kafil bitim yarating va kodni xaridorga yuboring. Bitim katalogga
              chiqmaydi, to‘lov va tekshirish shu yerda davom etadi.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 md:flex-col">
          <Link href="/kabinet/bitim" className="btn-accent">
            Bitim yaratish <Icon name="plus" width={18} />
          </Link>
          <Link href="/kod" className="btn-ghost">
            Menda kod bor <Icon name="arrow" width={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
