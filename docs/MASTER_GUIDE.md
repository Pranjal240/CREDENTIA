# CREDENTIA — MASTER EXECUTION GUIDE
## Complete From-Scratch Rebuild | Step-by-Step

---

> Use **Claude Opus 4.6** in Antigravity for ALL prompts below.
> Gemini is NOT needed — Opus 4.6 handles everything better.

---

## BEFORE YOU START — ONE MANUAL STEP

Open your terminal inside `credentia-web/` folder and run:
```
git rm -r --cached app components lib middleware.ts next.config.mjs next.config.js 2>/dev/null; git add -A; git commit -m "chore: wipe app for complete rebuild"; git push origin main
```
This clears the broken code. Keep: `.env.local`, `public/` folder (logos + owner photos), `package.json`.

---

## EXECUTION ORDER

```
STEP 1 → Run PROMPT_1_FOUNDATION.md    (Setup + Config)
STEP 2 → Manual: npm run build, fix errors, git push
STEP 3 → Run PROMPT_2_LANDING.md       (Landing Page)
STEP 4 → Manual: npm run build, git push
STEP 5 → Run PROMPT_3_AUTH.md          (Auth System)
STEP 6 → Manual: Supabase setup + git push
STEP 7 → Run PROMPT_4_STUDENT.md       (Student Dashboard)
STEP 8 → Manual: npm run build, git push
STEP 9 → Run PROMPT_5_DASHBOARDS.md    (Company+Uni+Admin)
STEP 10 → Run PROMPT_6_APIS.md         (All Backend APIs)
STEP 11 → Manual: Final build + push + Vercel redeploy
```

---

## DEMO CREDENTIALS (Keep Private — Save This)

| Role       | Email                          | Password          |
|------------|--------------------------------|-------------------|
| Admin      | pranjalmishra2409@gmail.com    | Google OAuth only |
| University | university@credentia-demo.in   | Demo@Univ2025     |
| Company    | company@credentia-demo.in      | Demo@Corp2025     |

These will be seeded into Supabase by Prompt 6.

---

## MANUAL STEPS BETWEEN PROMPTS

### After Prompt 1:
```bash
cd credentia-web
npm run build
# Fix any errors shown
git add -A
git commit -m "feat: foundation setup"
git push origin main
```

### After Prompt 3 (Auth):
1. Go to Supabase → Authentication → Providers → Google → Make sure it's ENABLED
2. Add these URLs to Supabase → Auth → URL Configuration:
   - Site URL: `https://credentiaonline.in`
   - Redirect URLs: `https://credentiaonline.in/auth/callback`
3. Go to Supabase → SQL Editor → Run this:
```sql
-- Run this in Supabase SQL Editor after Prompt 3
UPDATE profiles SET role = 'admin' WHERE email = 'pranjalmishra2409@gmail.com';
```
Then push code.

### After ALL Prompts:
1. Vercel → Settings → Environment Variables → Confirm ALL 14 vars exist
2. Vercel → Deployments → Redeploy latest
3. Wait 3 min → open credentiaonline.in

---

## ENV VARIABLES (Already in Vercel — Just Confirm)

```
NEXT_PUBLIC_SUPABASE_URL=https://pqxlkushbmlxjnlbjtbu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GROQ_API_KEY=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
CLOUDFLARE_ACCOUNT_ID=1ab2d845534b916e05b802c8772e7075
CLOUDFLARE_R2_ACCESS_KEY_ID=06809fe71a87c2cda889cf91a3af1fc4
CLOUDFLARE_R2_SECRET_ACCESS_KEY=291091ccbd686e1ccdd96843aa33995352c0ed98664d6ecf29e86020c724a669
CLOUDFLARE_R2_BUCKET_NAME=credentia-docs
CLOUDFLARE_R2_PUBLIC_URL=https://pub-a4d3ac5440a64a8bba8f80fc29addabe.r2.dev
NEXT_PUBLIC_APP_URL=https://credentiaonline.in
NEXTAUTH_SECRET=credentia_ultra_secure_secret_2025_xyz_abc
NEXTAUTH_URL=https://credentiaonline.in
RESEND_API_KEY=re_5tzgiumT_BAeLpuiXHP6aRty8YruPjMvx
```
