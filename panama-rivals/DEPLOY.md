# Deploy to Vercel (5 minutes, free)

## Step 1 — Push this repo to GitHub

```bash
# On github.com: New repository → name it "panama-rivals" → Public or Private → Create
# Then from this folder:
git remote add origin https://github.com/YOUR_USERNAME/panama-rivals.git
git push -u origin master
```

## Step 2 — Deploy on Vercel

1. Go to https://vercel.com → sign up with GitHub
2. **Add New → Project** → import `panama-rivals`
3. Vercel auto-detects Next.js — don't change any build settings
4. **Environment Variables** — add both (from your Supabase project):
   - `NEXT_PUBLIC_SUPABASE_URL` = your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
5. Click **Deploy** — takes ~1 minute

## Step 3 — Your free domain

Vercel gives you `panama-rivals.vercel.app` automatically.

To change the name (e.g. to `panamarivals.vercel.app`):
Project → Settings → Domains → edit the Vercel domain. Free, instant.

## Every time you push to GitHub after this → auto-deploys. That's it.
