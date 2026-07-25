# Deploy GravAI to Vercel (public judge URL)

## One-time setup

```bash
npx vercel login
npx vercel link
```

## Environment variables (Production)

Copy from `.env.local` into Vercel → Project → Settings → Environment Variables:

| Name | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret |
| `SELLER_ADDRESS` | Public-ish |
| `SELLER_PRIVATE_KEY` | Secret |
| `BUYER_ADDRESS` | Public-ish |
| `BUYER_PRIVATE_KEY` | Secret |
| `GEMINI_API_KEY` | Secret |
| `GEMINI_MODEL` | `gemini-flash-lite-latest` |

CLI helper (PowerShell, from repo root):

```powershell
Get-Content .env.local | Where-Object { $_ -match '^(NEXT_PUBLIC_|SUPABASE_|SELLER_|BUYER_|GEMINI_)' -and $_ -notmatch '^\s*#' } | ForEach-Object {
  $name, $value = $_ -split '=', 2
  Write-Host "vercel env add $name production"
}
```

Or paste values via the Vercel dashboard.

## Deploy

```bash
git push -u origin HEAD
npx vercel --prod
```

## After deploy

1. Paste the production URL into `README.md` Live URL section and `docs/CP3-SUBMISSION.md`
2. Smoke: Operator → Enter as demo → Standard gate → Strict gate
3. Confirm buyer Gateway ≥ 0.10 USDC (dashboard funding alert)
4. Top up via Circle faucet if needed: https://faucet.circle.com/

## GitHub integration (recommended)

Connect the `tetheusz/gravai` repo in Vercel so every push to `master` deploys automatically.
