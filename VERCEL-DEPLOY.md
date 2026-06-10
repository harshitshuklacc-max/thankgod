# Deploy SHOE MAFIA to Vercel

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Migrate to Neon PostgreSQL"
git remote add origin <your-github-repo>
git push -u origin main
```

## 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Add environment variables (see below)
5. Deploy

## 3. Required Environment Variables

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `CUSTOMER_SESSION_SECRET` | Random 32+ char secret |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_SESSION_SECRET` | Random 32+ char secret |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_STORE_NAME` | `SHOE MAFIA` |
| `NEXT_PUBLIC_STORE_PHONE` | `07587555558` |

## 4. Initialize Database

Run once locally (or from CI) with your Neon `DATABASE_URL`:

```bash
npm install
npm run db:migrate
```

## 5. Optional

- **Razorpay**: `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- **Email**: `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`
- **Cron**: `CRON_SECRET` (for invoice archiving)

## 6. Admin Access

- Store: `https://your-domain.vercel.app`
- Admin: `https://your-domain.vercel.app/admin/login`
