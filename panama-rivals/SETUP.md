# Panamá Rivals — Setup

## 1. Supabase (shared backend — registrations/results sync across all devices)

1. Create a free project at https://supabase.com
2. In the SQL Editor, paste and run everything in `supabase/schema.sql`
3. Project Settings → API → copy the **Project URL** and **anon public key**
4. Create `.env.local` in the repo root:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

5. Rebuild & restart: `npm run build && npm start`

Without these keys the site still works, but data stays per-browser (localStorage).

## 2. Domain + hosting (Vercel — free)

1. Push this repo to GitHub
2. https://vercel.com → New Project → import the repo → add the two env vars above → Deploy
3. Buy a domain (suggestions below) at Namecheap/Cloudflare/Porkbun
4. Vercel → Project → Settings → Domains → Add your domain → follow the DNS instructions
   (usually an A record to `76.76.21.21` or a CNAME to `cname.vercel-dns.com`)

### Domain ideas (check availability)
- panamarivals.com / panamarivals.gg
- rivalspty.com / rivalspty.gg
- ligarlpty.com
- panamarl.com

## 3. Season 2 go-live checklist

1. Share `/register` link in Discord
2. In `/admin`: assign each registered team to a group (A/B = 5 teams, C/D = 4)
3. Click "Generar calendario de grupos"
4. DM each captain their match report link from the admin page
5. On tournament day: captains report → you approve → standings/stats update live

## ⚠️ Known limitation

Report tokens are derived from the match ID — anyone who reads the client code can
compute them. For a casual community league with admin approval as the real gate,
this is acceptable. If you need hard security, add Discord OAuth (Supabase Auth
supports it natively) and tie submissions to the captain's Discord identity.
