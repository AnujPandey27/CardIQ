"use client";

import { useEffect, useState } from "react";
import {
  resolveBundledCardArtwork,
  type CardArtworkIdentity,
} from "@/lib/card-artwork";

type CardArtworkProps = CardArtworkIdentity & {
  imageUrl?: string | null;
  imageAlt?: string | null;
  sourcePageUrl?: string | null;
  className?: string;
  compact?: boolean;
};

function NetworkMark({ network }: { network?: string | null }) {
  const normalized = (network ?? "").trim().toLowerCase();

  if (normalized.includes("master")) {
    return (
      <span className="inline-flex items-center gap-1.5" aria-label="Mastercard">
        <span className="relative inline-flex h-5 w-8 items-center">
          <span className="absolute left-0 h-5 w-5 rounded-full bg-[#EB001B]" />
          <span className="absolute left-3 h-5 w-5 rounded-full bg-[#F79E1B]/95" />
        </span>
        <span className="text-[9px] font-semibold tracking-tight text-white">mastercard</span>
      </span>
    );
  }

  if (normalized.includes("american") || normalized.includes("amex")) {
    return (
      <span className="inline-flex h-7 w-9 flex-col items-center justify-center rounded-[3px] bg-[#0877C9] px-1 text-[6px] font-extrabold leading-[7px] tracking-tight text-white" aria-label="American Express">
        <span>AMERICAN</span>
        <span>EXPRESS</span>
      </span>
    );
  }

  if (normalized.includes("visa")) {
    return <span className="text-[17px] font-black italic tracking-tight text-white" aria-label="Visa">VISA</span>;
  }

  if (normalized.includes("rupay")) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[15px] font-extrabold italic tracking-tight text-white" aria-label="RuPay">
        RuPay<span className="ml-0.5 inline-flex flex-col gap-[2px]"><i className="h-[4px] w-[9px] skew-x-[-28deg] bg-[#F59E0B]"/><i className="h-[4px] w-[9px] skew-x-[-28deg] bg-[#16A34A]"/></span>
      </span>
    );
  }

  if (normalized.includes("diners")) {
    return (
      <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-tight text-white" aria-label="Diners Club">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white text-[10px]">D</span>
        DINERS CLUB
      </span>
    );
  }

  return <span className="text-[9px] font-semibold text-white">{network || "NETWORK"}</span>;
}

export default function CardArtwork({
  bank,
  name,
  variant,
  network,
  imageUrl,
  imageAlt,
  sourcePageUrl,
  className = "",
  compact = false,
}: CardArtworkProps) {
  const bundled = resolveBundledCardArtwork({ bank, name, variant, network });
  const src = imageUrl || bundled?.src || null;
  const alt = imageAlt || bundled?.alt || `${bank || "Issuer"} ${name || "credit card"} ${network || ""} card face`;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const size = compact ? "w-[116px]" : "w-[148px] sm:w-[164px]";

  if (src && !failed) {
    return (
      <div className={`relative aspect-[1.586/1] ${size} shrink-0 overflow-hidden rounded-[12px] border border-black/10 bg-[#111827] shadow-[0_8px_24px_rgba(0,0,0,0.14)] ${className}`} title={sourcePageUrl || bundled?.note || "Card face"}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  // One deliberately consistent, neutral fallback: issuer + network only.
  // It is not presented as a photograph or fabricated physical card design.
  return (
    <div
      className={`relative flex aspect-[1.586/1] ${size} shrink-0 flex-col justify-between overflow-hidden rounded-[12px] border border-white/10 bg-[#202630] p-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.14)] ${className}`}
      role="img"
      aria-label={`${bank || "Issuer"} card placeholder, ${network || "network not specified"}`}
      title="Exact card-face image not yet verified. Showing the standard issuer/network placeholder."
    >
      <span className="max-w-[78%] truncate text-[10px] font-semibold tracking-[0.02em] text-white/90 sm:text-[11px]">
        {bank || "ISSUER"}
      </span>
      <div className="flex items-end justify-end">
        <NetworkMark network={network} />
      </div>
    </div>
  );
}
