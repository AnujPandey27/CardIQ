-- CardIQ Discover + affiliate eligibility foundation.
-- Additive migration: creates new affiliate tables and policies only.
-- No DROP POLICY, DROP TABLE, TRUNCATE, DELETE or UPDATE statements.

create table if not exists public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  network_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paused', 'rejected', 'expired')),
  approval_reference text,
  terms_url text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domains text[] not null default '{}',
  category text,
  status text not null default 'inactive' check (status in ('active', 'inactive', 'paused')),
  relationship_status text not null default 'pending' check (relationship_status in ('pending', 'approved', 'rejected', 'expired')),
  affiliate_program_id uuid references public.affiliate_programs(id) on delete restrict,
  approved_at timestamptz,
  terms_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_merchants_domains_nonempty check (cardinality(domains) > 0)
);

create table if not exists public.affiliate_products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.affiliate_merchants(id) on delete restrict,
  title text not null,
  description text,
  category text not null,
  product_url text not null,
  image_url text,
  price numeric(14,2),
  currency_code text not null default 'INR',
  availability_status text not null default 'unknown' check (availability_status in ('available', 'unavailable', 'unknown')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  source_name text,
  source_url text,
  verified_at timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_products_price_nonnegative check (price is null or price >= 0)
);

create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.affiliate_products(id) on delete cascade,
  affiliate_program_id uuid not null references public.affiliate_programs(id) on delete restrict,
  original_url text not null,
  affiliate_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paused', 'rejected', 'expired')),
  verified_at timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliate_links_https_urls check (original_url ~ '^https://' and affiliate_url ~ '^https://'),
  constraint affiliate_links_product_program_unique unique (product_id, affiliate_program_id)
);

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  affiliate_link_id uuid not null references public.affiliate_links(id) on delete restrict,
  product_id uuid not null references public.affiliate_products(id) on delete restrict,
  merchant_id uuid not null references public.affiliate_merchants(id) on delete restrict,
  clicked_at timestamptz not null default now()
);

create index if not exists affiliate_merchants_eligibility_idx
  on public.affiliate_merchants(status, relationship_status);
create index if not exists affiliate_products_merchant_status_idx
  on public.affiliate_products(merchant_id, status, availability_status);
create index if not exists affiliate_links_product_status_idx
  on public.affiliate_links(product_id, status, valid_until);
create index if not exists affiliate_clicks_user_clicked_idx
  on public.affiliate_clicks(user_id, clicked_at desc);

alter table public.affiliate_programs enable row level security;
alter table public.affiliate_merchants enable row level security;
alter table public.affiliate_products enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.affiliate_clicks enable row level security;

-- Policies are created only when absent. This avoids DROP POLICY and prevents
-- replacing any existing policy. These names are unique to the new affiliate tables.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_programs' AND policyname='Authenticated users can view approved affiliate programs') THEN
    CREATE POLICY "Authenticated users can view approved affiliate programs"
      ON public.affiliate_programs FOR SELECT TO authenticated
      USING (status = 'approved');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_merchants' AND policyname='Authenticated users can view approved affiliate merchants') THEN
    CREATE POLICY "Authenticated users can view approved affiliate merchants"
      ON public.affiliate_merchants FOR SELECT TO authenticated
      USING (status = 'active' AND relationship_status = 'approved');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_products' AND policyname='Authenticated users can view active affiliate products') THEN
    CREATE POLICY "Authenticated users can view active affiliate products"
      ON public.affiliate_products FOR SELECT TO authenticated
      USING (
        status = 'active'
        AND availability_status = 'available'
        AND EXISTS (
          SELECT 1 FROM public.affiliate_merchants m
          WHERE m.id = merchant_id
            AND m.status = 'active'
            AND m.relationship_status = 'approved'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_links' AND policyname='Authenticated users can view approved affiliate links') THEN
    CREATE POLICY "Authenticated users can view approved affiliate links"
      ON public.affiliate_links FOR SELECT TO authenticated
      USING (
        status = 'approved'
        AND (valid_until IS NULL OR valid_until >= now())
        AND EXISTS (
          SELECT 1
          FROM public.affiliate_products p
          JOIN public.affiliate_merchants m ON m.id = p.merchant_id
          JOIN public.affiliate_programs ap ON ap.id = affiliate_links.affiliate_program_id
          WHERE p.id = product_id
            AND p.status = 'active'
            AND p.availability_status = 'available'
            AND m.status = 'active'
            AND m.relationship_status = 'approved'
            AND ap.status = 'approved'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_clicks' AND policyname='Users can record their own eligible affiliate clicks') THEN
    CREATE POLICY "Users can record their own eligible affiliate clicks"
      ON public.affiliate_clicks FOR INSERT TO authenticated
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.affiliate_links l
          JOIN public.affiliate_products p ON p.id = l.product_id
          JOIN public.affiliate_merchants m ON m.id = p.merchant_id
          JOIN public.affiliate_programs ap ON ap.id = l.affiliate_program_id
          WHERE l.id = affiliate_link_id
            AND p.id = product_id
            AND m.id = merchant_id
            AND l.status = 'approved'
            AND (l.valid_until IS NULL OR l.valid_until >= now())
            AND p.status = 'active'
            AND p.availability_status = 'available'
            AND m.status = 'active'
            AND m.relationship_status = 'approved'
            AND ap.status = 'approved'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='affiliate_clicks' AND policyname='Users can view their own affiliate clicks') THEN
    CREATE POLICY "Users can view their own affiliate clicks"
      ON public.affiliate_clicks FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Deliberately no authenticated INSERT/UPDATE/DELETE policies for programs,
-- merchants, products or affiliate links. Only trusted server/admin operations
-- should manage approvals and affiliate destinations.
