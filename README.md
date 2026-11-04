# CardIQ

Existing CardIQ Next.js application with Supabase integration.

## Local development

```bash
npm install
npm run dev
```

Configure the existing Supabase environment variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never commit `.env.local`, service-role keys, affiliate credentials or other secrets.

## Discover / affiliate foundation

See [AFFILIATE_DISCOVER_SETUP.md](./AFFILIATE_DISCOVER_SETUP.md) for feature scope, current Supabase state, catalogue approval rules, security boundaries and validation notes.
