# SHOE MAFIA

Premium footwear e-commerce platform for SHOE MAFIA, Bilaspur. Built with Next.js 15, Supabase, Razorpay, and Resend.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- [Razorpay](https://razorpay.com) account (for online payments)
- [Resend](https://resend.com) account (for transactional emails)
- [Vercel](https://vercel.com) account (for deployment)

## 1. Supabase Project Setup

**Project:** `cbymnvxiamygixvbooak`  
**URL:** `https://cbymnvxiamygixvbooak.supabase.co`

Credentials are configured in `.env.local`. For CLI:

```bash
supabase login
supabase init
supabase link --project-ref cbymnvxiamygixvbooak
```

Go to **Project Settings → API** and verify:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Secret key → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Run Migration SQL

1. Open **SQL Editor** in your Supabase dashboard.
2. Paste and run the contents of `supabase/migrations/001_initial_schema.sql`.
3. Run `supabase/migrations/002_cart_items.sql` for customer cart support.
4. Run `supabase/migrations/003_storage_buckets.sql` for storage buckets and policies.
5. This creates all tables, indexes, RLS policies, triggers, and default seed data.

## 3. Create Storage Buckets

**Option A — npm script (recommended):**
```bash
npm run setup:storage
```

**Option B — while logged into admin**, visit:
```
POST /api/admin/setup-storage
```

**Option C — SQL Editor:** run `supabase/migrations/003_storage_buckets.sql`

| Bucket     | Public | Purpose                          |
|------------|--------|----------------------------------|
| `products` | Yes    | Product images and barcode PNGs  |
| `invoices` | No     | Generated invoice PDFs           |
| `imports`  | No     | Busy accounting import files     |
| `backups`  | No     | Database backup exports          |

Buckets are also auto-created on first upload (product image, PDF import, etc.).

## 4. Environment Variables

**Local development:**
```bash
cp .env.example .env.local
```

**Vercel deployment:** See **[VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md)** — import `vercel.env` in one click and admin portal works immediately.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `ADMIN_USERNAME` | Admin panel login username |
| `ADMIN_PASSWORD` | Admin panel login password |
| `ADMIN_SESSION_SECRET` | Random secret for admin session tokens |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Key ID (public) |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret (server only) |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Sender email (must be verified in Resend) |
| `ADMIN_EMAIL` | Admin notification recipient |
| `NEXT_PUBLIC_APP_URL` | App URL (`http://localhost:3000` locally) |
| `CRON_SECRET` | Secret for Vercel cron job authorization |

## 5. Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### PWA Icons

Add your app icons to `public/icons/`:

- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

These are referenced in `public/manifest.json`.

## 6. Enable Google OAuth in Supabase

1. Go to **Authentication → Providers → Google** in Supabase.
2. Enable Google provider.
3. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/):
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Paste Client ID and Client Secret into Supabase.
5. Add your site URL to **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (or production URL)
   - Redirect URLs: `http://localhost:3000/**`, `https://your-domain.com/**`

## 7. Configure Razorpay Keys

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. Go to **Settings → API Keys** and generate test/live keys.
3. Set in `.env.local`:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` = Key ID
   - `RAZORPAY_KEY_SECRET` = Key Secret
4. For production, complete KYC and switch to live mode keys.

### Payment API Flow

1. **Create order** — `POST /api/payments/razorpay/create-order` with `{ orderId }`
2. **Client checkout** — Use Razorpay Checkout with returned `razorpayOrderId` and `keyId`
3. **Verify payment** — `POST /api/payments/razorpay/verify` with payment response fields
4. **COD** — `POST /api/payments/cod` with `{ orderId }` for cash on delivery

## 8. Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in [vercel.com/new](https://vercel.com/new).
3. Add all environment variables from `.env.local` in Vercel project settings.
4. Set `CRON_SECRET` — Vercel automatically sends it as `Authorization: Bearer <CRON_SECRET>` to cron routes.
5. Deploy.

The `vercel.json` configures a daily cron at 2:00 AM UTC to archive invoices older than 1 year via `/api/cron/archive-invoices`.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/payments/razorpay/create-order` | POST | Create Razorpay payment order |
| `/api/payments/razorpay/verify` | POST | Verify payment signature |
| `/api/payments/cod` | POST | Confirm cash on delivery order |
| `/api/invoices/[id]/pdf` | GET | Generate invoice PDF (admin) |
| `/api/barcodes/[productId]` | GET | Generate barcode PNG |
| `/api/exports/inventory?format=csv\|xlsx\|pdf` | GET | Export inventory (admin) |
| `/api/contact` | POST | Contact form submission |
| `/api/cron/archive-invoices` | GET | Archive old invoices (cron) |

## Email Notifications

Configured in `src/lib/email.ts` via Resend:

- Order confirmed
- Order shipped
- Order delivered
- Password reset
- Admin new order alert
- Low stock alerts

## SEO & PWA

- `src/app/robots.ts` — Dynamic robots.txt
- `src/app/sitemap.ts` — Dynamic sitemap from products and categories
- `src/components/seo/json-ld.tsx` — Schema.org structured data
- `public/manifest.json` — PWA manifest
- `next-pwa` — Service worker (disabled in development)

## Admin Panel

Access at `/admin` using credentials from `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

## License

Private — SHOE MAFIA © 2026
