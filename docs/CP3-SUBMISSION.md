# GravAI — CP3 final submission checklist

Submit on **8 August** (buffer before 9 Aug AoE). Track: **Agentic Economy only**.

## Public links (fill before submit)

| Asset | URL |
| --- | --- |
| Code | https://github.com/tetheusz/gravai |
| Live app | _paste Vercel URL_ |
| Presentation | _paste Google Slides share link (anyone with link)_ |
| Demo video | _paste YouTube/Loom_ |

## Form copy (paste-ready)

**Project name:** GravAI

**Team:** Matheus Procópio

**Track:** Agentic Economy

**Short description:**

> GravAI is a data marketplace for machine buyers on Arc. A buyer agent pays a sub-cent USDC nanopayment for a human computer-use sample; a verifier agent (LLM + rubric) scores it; only approval releases the larger nanopayment for the full dataset. Rejection withholds payment on-chain. Settlement uses Circle Gateway x402 nanopayments on Arc testnet — quality, not a scripted transfer, moves the money.

## Pre-flight (same day)

- [ ] Live URL: Enter as demo works
- [ ] Standard gate settles full dataset
- [ ] Strict gate withholds payment
- [ ] Buyer Gateway balance ≥ 0.10 USDC
- [ ] Repo README clone URL is `tetheusz/gravai`
- [ ] Slides + video links open without login
- [ ] `npm run test:verifier` passes locally

## Demo Day (20 Aug)

- Same 3-minute script as the video
- Keep a funded backup buyer key ready
- Fallback: play the hosted video if the network fails
