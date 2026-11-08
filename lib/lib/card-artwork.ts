export type CardArtworkIdentity = {
  bank?: string | null;
  name?: string | null;
  variant?: string | null;
  network?: string | null;
};

export type CardArtworkCatalogRow = {
  issuer_key: string;
  product_key: string;
  variant_key: string;
  network_key: string;
  image_url: string;
  source_page_url?: string | null;
};

export type BundledCardArtwork = {
  src: string;
  alt: string;
  provenance: "user-supplied-reference" | "official-issuer";
  note: string;
};

export function normalizeArtworkKeyPart(value?: string | null): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function cardArtworkKey(identity: CardArtworkIdentity): string {
  return [
    normalizeArtworkKeyPart(identity.bank),
    normalizeArtworkKeyPart(identity.name),
    normalizeArtworkKeyPart(identity.variant),
    normalizeArtworkKeyPart(identity.network),
  ].join("::");
}

export function catalogArtworkKey(row: CardArtworkCatalogRow): string {
  return [row.issuer_key, row.product_key, row.variant_key, row.network_key]
    .map(normalizeArtworkKeyPart)
    .join("::");
}

/**
 * Small set of bundled assets with known provenance. Do not add an image here
 * unless it is an isolated card face and is exact for issuer/product/network.
 * The Sapphiro base face was supplied by the user; network marks were added in
 * the variant-specific clear area at the user's explicit request.
 */
export function resolveBundledCardArtwork(
  identity: CardArtworkIdentity
): BundledCardArtwork | null {
  const issuer = normalizeArtworkKeyPart(identity.bank);
  const product = normalizeArtworkKeyPart(identity.name);
  const variant = normalizeArtworkKeyPart(identity.variant);
  const network = normalizeArtworkKeyPart(identity.network);

  if (!issuer.includes("icici")) return null;
  if (product !== "sapphiro") return null;
  if (!variant.includes("sapphiro")) return null;

  const variants: Record<string, string> = {
    mastercard: "/images/cards/icici-sapphiro-mastercard.png",
    "american express": "/images/cards/icici-sapphiro-amex.png",
    visa: "/images/cards/icici-sapphiro-visa.png",
    rupay: "/images/cards/icici-sapphiro-rupay.png",
  };
  const src = variants[network];
  if (!src) return null;

  return {
    src,
    alt: `ICICI Bank Sapphiro ${identity.network} card face, based on the card reference supplied by the user.`,
    provenance: "user-supplied-reference",
    note: "Network-specific Sapphiro reference supplied by the user. Verify against the physical card before treating it as issuer-published artwork.",
  };
}

export function exactCatalogArtwork(
  identity: CardArtworkIdentity,
  rows: CardArtworkCatalogRow[]
): CardArtworkCatalogRow | null {
  const key = cardArtworkKey(identity);
  return rows.find((row) => catalogArtworkKey(row) === key) ?? null;
}
