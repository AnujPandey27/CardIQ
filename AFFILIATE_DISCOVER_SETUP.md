# CardIQ Discover and Affiliate Foundation

This package extends the existing Next.js application. It does not replace or alter the existing card, profile, spend, transaction or reward features.

## Included in this source package

- `/discover` page, linked from the existing navigation and dashboard Explore actions.
- HTTPS product URL intake with credential rejection and merchant-domain matching.
- Exact product matching against the approved catalogue. Product-identifying query parameters are preserved; common tracking parameters are ignored.
- Catalogue visibility only when the merchant is active and approved, the product is active and available, and an approved unexpired affiliate link exists.
- Affiliate click-event logging to `affiliate_clicks` for the signed-in user.
- A clear, concise commission disclosure.
- Additive SQL migration definition for the five affiliate tables and RLS policies.

## Current Supabase state

The owner manually created the following five tables in Supabase SQL Editor and verified their RLS configuration and seven policies on 4 November 2026:

- `affiliate_programs`
- `affiliate_merchants`
- `affiliate_products`
- `affiliate_links`
- `affiliate_clicks`

**Do not run the migration again against this already-configured project.** The SQL file under `supabase/migrations/` is retained as the source definition for a clean environment. The manually-created schema is not automatically recorded in Supabase CLI migration history. Do not run `supabase db push` until migration history is reconciled deliberately.

## Catalogue approval rules

No merchant or product is pre-seeded or assumed to be approved. The catalogue intentionally starts empty. A product is shown only when:

- its affiliate programme is approved;
- its merchant is active and the CardIQ relationship is approved;
- the product is active and marked available; and
- a product-specific affiliate link is approved and not expired.

Do not mark a programme or merchant approved until CardIQ has actually been accepted into that affiliate programme and the relevant terms have been reviewed. The client has no insert/update/delete policies for programme, merchant, product or affiliate-link approval data. Manage these records only through a trusted admin/server-side process.

## Important implementation boundary

This is the first Discover and eligibility foundation, not a complete affiliate-network integration. It does not apply to affiliate programmes, generate network deep links, scrape merchant catalogues, retrieve live prices/stock, import conversion reports or calculate commissions. Those require approved programme access, provider-specific APIs/feed formats and credentials stored server-side.

Click events are recorded, but conversion and commission reconciliation is not implemented yet.

The Buy action opens the approved HTTPS affiliate destination in a new browser tab. Merchant websites and mobile operating systems may still invoke their own app through universal-link behaviour. A website cannot guarantee that every device remains in-browser; app hand-off can only be avoided where the merchant/network provides a web-only destination or setting.

## Validation performed

- All 22 TypeScript/TSX files passed a TypeScript transpilation syntax check with zero syntax diagnostics.
- A full Next.js production build has **not** been verified. `npm install` timed out in the build environment, so dependencies were unavailable for `next build` and a full type check.
- The live Supabase migration was performed by the owner in the Supabase dashboard and verified separately.
- No Vercel deployment was performed.

## Environment variables

The existing app continues to use its existing browser Supabase configuration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not put a Supabase service-role key or affiliate network secret in a `NEXT_PUBLIC_` variable or browser code.
