import { Icon } from "@/components/Icon";
import Image from "next/image";
import Link from "next/link";
import { Product, TRUST_LABEL, formatUzs, timeAgo } from "@/lib/api";

const TRUST_STYLE: Record<string, string> = {
  new: "text-faint",
  verified: "text-ok",
  trusted: "text-ok",
  partner: "text-accent",
};

export function ProductCard({ product }: { product: Product }) {
  const seller = product.seller;
  const thumbnail = product.images?.[0];

  return (
    <article className="surface group flex flex-col overflow-hidden p-5 transition duration-200 hover:border-accent/40 hover:shadow-[0_1px_0_rgb(var(--accent)/.25),0_12px_28px_-18px_rgb(var(--ink)/.35)]">
      <Link
        href={`/product/${product._id}`}
        className="-mx-5 -mt-5 mb-4 block aspect-[16/10] overflow-hidden bg-raised"
      >
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={product.title}
            width={400}
            height={300}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-faint">
            <div className="flex flex-col items-center gap-3">
              <span className="rounded-2xl border border-line bg-surface p-5 text-accent">
                <PlaceholderIcon />
              </span>
              <span className="text-xs font-medium tracking-wide">
                {product.category}
              </span>
            </div>
          </div>
        )}
      </Link>

      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-md bg-raised px-2 py-1 text-xs font-medium text-muted">
          {product.category}
        </span>
        <time
          className="shrink-0 text-xs text-faint"
          dateTime={product.createdAt}
        >
          {timeAgo(product.createdAt)}
        </time>
      </div>

      <Link href={`/product/${product._id}`} className="hover:text-accent">
        <h3 className="mb-2 text-[17px] font-semibold leading-snug text-ink">
          {product.title}
        </h3>
      </Link>

      <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
        {product.description}
      </p>

      {seller && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`font-medium ${TRUST_STYLE[seller.trustLevel] ?? "text-faint"}`}
          >
            {TRUST_LABEL[seller.trustLevel]}
          </span>
          {seller.rating !== null && (
            <>
              <span className="text-faint">·</span>
              <span className="tnum text-muted">
                <span className="sr-only">Sotuvchi bahosi: </span><Icon name="star" width={14} height={14} className="mr-1 inline-block align-text-bottom" />{seller.rating.toFixed(1)}{" "}
                <span className="text-faint">({seller.ratingCount})</span>
              </span>
            </>
          )}
          {seller.sold > 0 && (
            <>
              <span className="text-faint">·</span>
              <span className="tnum text-faint">{seller.sold} ta sotgan</span>
            </>
          )}
        </div>
      )}

      <div className="mt-auto border-t border-line pt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="tnum text-xl font-bold text-ink">
            {formatUzs(product.price)}
          </span>
          <span className="text-xs text-accent">Kafil orqali</span>
        </div>
        <Link
          href={`/product/${product._id}`}
          className="btn-ghost w-full text-sm group-hover:border-accent/40 group-hover:text-accent"
        >
          E’lonni ko‘rish <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function PlaceholderIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="8.5"
        cy="10"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m5 17 4.5-4.5a1.5 1.5 0 0 1 2 0L15 16l1.2-1.2a1.5 1.5 0 0 1 2 0L21 17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      className="surface flex flex-col gap-3 overflow-hidden p-5"
      aria-hidden="true"
    >
      <div className="skeleton -mx-5 -mt-5 mb-1 aspect-[16/10]" />
      <div className="flex justify-between">
        <div className="skeleton h-6 w-20" />
        <div className="skeleton h-4 w-16" />
      </div>
      <div className="skeleton h-5 w-4/5" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-2/3" />
      <div className="mt-3 flex items-center justify-between border-t border-line pt-4">
        <div className="skeleton h-6 w-28" />
        <div className="skeleton h-9 w-24" />
      </div>
    </div>
  );
}
