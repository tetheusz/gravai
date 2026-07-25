/**
 * Generates the GravAI CP2 presentation deck (gravai-deck.pptx).
 * Upload the output to Google Drive and open with Google Slides to share.
 *
 * Usage: node scripts/build-deck.mjs
 */
import PptxGenJS from "pptxgenjs";

const BG = "0B0F0E";
const PANEL = "121917";
const MINT = "34D399";
const TEXT = "E7ECEA";
const MUTED = "8BA39B";
const RED = "F87171";

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
pptx.layout = "WIDE";

const FONT = "Segoe UI";

function baseSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: BG };
  return slide;
}

function chip(slide, text, x, y, w) {
  slide.addText(text.toUpperCase(), {
    x,
    y,
    w,
    h: 0.32,
    fontFace: FONT,
    fontSize: 10,
    color: MINT,
    charSpacing: 3,
    bold: true,
  });
}

function footer(slide, n) {
  slide.addText(`GravAI — Verified data commerce on Arc · ${n}`, {
    x: 0.6,
    y: 7.05,
    w: 12,
    h: 0.3,
    fontFace: FONT,
    fontSize: 9,
    color: MUTED,
  });
}

// ─── 1. Title ───
{
  const s = baseSlide();
  s.addShape("rect", { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: MINT } });
  chip(s, "Encode × Circle · Programmable Money Hackathon · Agentic Economy Track", 0.9, 2.0, 11);
  s.addText("GravAI", {
    x: 0.85,
    y: 2.4,
    w: 11,
    h: 1.3,
    fontFace: FONT,
    fontSize: 66,
    bold: true,
    color: TEXT,
  });
  s.addText("The data marketplace built for machine buyers.\nAI agents purchase verified human demonstration data with USDC nanopayments on Arc.", {
    x: 0.9,
    y: 3.8,
    w: 10.5,
    h: 1.2,
    fontFace: FONT,
    fontSize: 20,
    color: MUTED,
    lineSpacing: 30,
  });
  s.addText("Matheus Procópio · github.com/tetheusz/gravai", {
    x: 0.9,
    y: 6.2,
    w: 10,
    h: 0.4,
    fontFace: FONT,
    fontSize: 14,
    color: TEXT,
  });
}

// ─── 2. Problem ───
{
  const s = baseSlide();
  chip(s, "Problem", 0.6, 0.55, 6);
  s.addText("The AI bottleneck is no longer models. It's data.", {
    x: 0.55,
    y: 0.95,
    w: 12,
    h: 0.9,
    fontFace: FONT,
    fontSize: 34,
    bold: true,
    color: TEXT,
  });
  const items = [
    ["Public text is exhausted", "Frontier labs now compete for proprietary human \u201ccomputer-use\u201d demonstrations: screen recordings, actions, and narrated intent."],
    ["Procurement doesn't scale", "Buying this data today is manual, trust-based and slow: contracts, invoices, spreadsheets, wire transfers."],
    ["Agents can't participate", "AI agents that need data on demand have no way to evaluate quality and pay for it autonomously."],
  ];
  items.forEach(([title, body], i) => {
    const x = 0.6 + i * 4.25;
    s.addShape("rect", { x, y: 2.3, w: 3.95, h: 3.6, fill: { color: PANEL }, line: { color: "233029", width: 1 } });
    s.addText(title, { x: x + 0.25, y: 2.6, w: 3.5, h: 0.8, fontFace: FONT, fontSize: 18, bold: true, color: MINT });
    s.addText(body, { x: x + 0.25, y: 3.4, w: 3.5, h: 2.3, fontFace: FONT, fontSize: 13, color: TEXT, lineSpacing: 20 });
  });
  footer(s, 2);
}

// ─── 3. Solution ───
{
  const s = baseSlide();
  chip(s, "Solution", 0.6, 0.55, 6);
  s.addText("GravAI: agents buy data. A verifier decides if money moves.", {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.9,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: TEXT,
  });
  const rows = [
    ["1 · Brief", "A buyer agent holds a USDC wallet and needs data for a brief — e.g. \u201c6h of narrated Excel/FP&A workflows in pt-BR\u201d."],
    ["2 · Sample", "It pays a sub-cent nanopayment ($0.001) for a preview sample with a content hash for provenance."],
    ["3 · Verify", "A verifier agent (LLM + objective rubric) scores narration, actions, completeness and quality."],
    ["4 · Settle or withhold", "Approved → the buyer autonomously pays for the full dataset ($0.05). Rejected → payment withheld, reason logged."],
  ];
  rows.forEach(([title, body], i) => {
    const y = 2.15 + i * 1.15;
    s.addShape("rect", { x: 0.6, y, w: 0.07, h: 0.95, fill: { color: MINT } });
    s.addText(title, { x: 0.85, y, w: 2.6, h: 0.95, fontFace: FONT, fontSize: 16, bold: true, color: TEXT, valign: "middle" });
    s.addText(body, { x: 3.6, y, w: 9.1, h: 0.95, fontFace: FONT, fontSize: 14, color: MUTED, valign: "middle", lineSpacing: 19 });
  });
  footer(s, 3);
}

// ─── 4. Real autonomy ───
{
  const s = baseSlide();
  chip(s, "Why this is real agent autonomy", 0.6, 0.55, 8);
  s.addText("The economic outcome is driven by a real quality signal.", {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.9,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: TEXT,
  });
  s.addShape("rect", { x: 0.6, y: 2.3, w: 5.9, h: 3.9, fill: { color: PANEL }, line: { color: MINT, width: 1.5 } });
  s.addText("APPROVED", { x: 0.9, y: 2.6, w: 5.3, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: MINT });
  s.addText("Verifier score 0.95 ≥ threshold 0.70\n\n→ Buyer agent releases the $0.05 settlement\n→ Total spent: $0.051 USDC\n→ Delivery hash recorded for provenance", {
    x: 0.9, y: 3.1, w: 5.3, h: 2.9, fontFace: FONT, fontSize: 15, color: TEXT, lineSpacing: 24,
  });
  s.addShape("rect", { x: 6.85, y: 2.3, w: 5.9, h: 3.9, fill: { color: PANEL }, line: { color: RED, width: 1.5 } });
  s.addText("REJECTED", { x: 7.15, y: 2.6, w: 5.3, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: RED });
  s.addText("Verifier score 0.85 < strict threshold 0.95\n\n→ Full payment withheld on-chain\n→ Total spent: only $0.001 USDC\n→ Rejection reason logged for the seller", {
    x: 7.15, y: 3.1, w: 5.3, h: 2.9, fontFace: FONT, fontSize: 15, color: TEXT, lineSpacing: 24,
  });
  footer(s, 4);
}

// ─── 5. Why Arc ───
{
  const s = baseSlide();
  chip(s, "Why Arc + Circle", 0.6, 0.55, 6);
  s.addText("Machine payments only work if they cost less than the data.", {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.9,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: TEXT,
  });
  const items = [
    ["Sub-cent, gasless nanopayments", "Circle Gateway batching (x402 protocol) makes $0.001 per-sample payments economically viable — no gas per request."],
    ["USDC-native settlement", "No FX or banking rails friction for a cross-border data supply chain. Sellers withdraw Gateway balance to any payout wallet."],
    ["LATAM supply advantage", "First supply: pt-BR narrated business workflows. High-quality demonstrations at globally competitive cost."],
  ];
  items.forEach(([title, body], i) => {
    const x = 0.6 + i * 4.25;
    s.addShape("rect", { x, y: 2.3, w: 3.95, h: 3.6, fill: { color: PANEL }, line: { color: "233029", width: 1 } });
    s.addText(title, { x: x + 0.25, y: 2.6, w: 3.5, h: 1.0, fontFace: FONT, fontSize: 17, bold: true, color: MINT });
    s.addText(body, { x: x + 0.25, y: 3.6, w: 3.5, h: 2.1, fontFace: FONT, fontSize: 13, color: TEXT, lineSpacing: 20 });
  });
  footer(s, 5);
}

// ─── 6. Live demo ───
{
  const s = baseSlide();
  chip(s, "Live demo", 0.6, 0.55, 6);
  s.addText("One click. Two agents. Real USDC on Arc testnet.", {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.9,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: TEXT,
  });
  s.addText([
    { text: "Dashboard · \u201cRun buyer agent\u201d\n", options: { bold: true, color: MINT, fontSize: 17 } },
    { text: "A live timeline streams every step: wallet check, Gateway top-up, sample nanopayment, LLM verdict with rubric scores, and the gated settlement — with tx receipts.\n\n", options: { color: TEXT, fontSize: 14 } },
    { text: "Strict-gate scenario\n", options: { bold: true, color: RED, fontSize: 17 } },
    { text: "Raising the threshold makes the verifier reject the sample and withhold the payment — proving the gate controls the money.\n\n", options: { color: TEXT, fontSize: 14 } },
    { text: "Realtime settlement ledger\n", options: { bold: true, color: MINT, fontSize: 17 } },
    { text: "Every settlement lands in the ledger seconds after the click (Supabase realtime). Sellers withdraw earnings to a payout wallet.", options: { color: TEXT, fontSize: 14 } },
  ], { x: 0.6, y: 2.15, w: 12.1, h: 4.4, fontFace: FONT, lineSpacing: 20 });
  footer(s, 6);
}

// ─── 7. What's built ───
{
  const s = baseSlide();
  chip(s, "Built during the hackathon", 0.6, 0.55, 6);
  s.addText("Working end-to-end today", {
    x: 0.55,
    y: 0.95,
    w: 12,
    h: 0.9,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: TEXT,
  });
  const left = [
    "Gated purchase loop: $0.001 sample → verify → $0.05 full dataset",
    "Verifier agent: Gemini LLM + objective rubric, deterministic fallback",
    "x402 nanopayments via Circle Gateway batching on Arc testnet",
    "SHA-256 content hash / manifest on every delivery (provenance)",
  ];
  const right = [
    "Live dashboard: agent run streamed step-by-step (SSE) + realtime ledger",
    "Marketplace listing with rubric, pricing and seller reputation v1",
    "Seller payouts: Gateway balance → payout wallet withdrawals",
    "Animated landing page with EVM wallet connect",
  ];
  [left, right].forEach((col, c) => {
    col.forEach((item, i) => {
      const x = 0.6 + c * 6.3;
      const y = 2.2 + i * 1.05;
      s.addShape("rect", { x, y: y + 0.12, w: 0.18, h: 0.18, fill: { color: MINT } });
      s.addText(item, { x: x + 0.4, y, w: 5.7, h: 1.0, fontFace: FONT, fontSize: 14, color: TEXT, lineSpacing: 19 });
    });
  });
  footer(s, 7);
}

// ─── 8. Market ───
{
  const s = baseSlide();
  chip(s, "Market & model", 0.6, 0.55, 6);
  s.addText("Training data is a fast-growing, underserved market", {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.9,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: TEXT,
  });
  const stats = [
    ["~$3.8B", "AI data collection & labeling market (2024), growing >20% CAGR"],
    ["$250M+/yr", "what single frontier labs already spend on human data"],
    ["Take rate", "GravAI monetizes per-transaction fees on verified settlements"],
  ];
  stats.forEach(([big, small], i) => {
    const x = 0.6 + i * 4.25;
    s.addShape("rect", { x, y: 2.3, w: 3.95, h: 2.6, fill: { color: PANEL }, line: { color: "233029", width: 1 } });
    s.addText(big, { x: x + 0.25, y: 2.55, w: 3.5, h: 0.8, fontFace: FONT, fontSize: 30, bold: true, color: MINT });
    s.addText(small, { x: x + 0.25, y: 3.4, w: 3.5, h: 1.3, fontFace: FONT, fontSize: 13, color: TEXT, lineSpacing: 19 });
  });
  s.addText("Wedge: pt-BR / LATAM business workflows (Excel, ERP, fintech ops) — high demand, low supply, and USDC solves the cross-border payout problem from day one.", {
    x: 0.6, y: 5.3, w: 12.1, h: 0.9, fontFace: FONT, fontSize: 15, color: MUTED, lineSpacing: 22,
  });
  footer(s, 8);
}

// ─── 9. Roadmap ───
{
  const s = baseSlide();
  chip(s, "Roadmap", 0.6, 0.55, 6);
  s.addText("From demo to marketplace", {
    x: 0.55,
    y: 0.95,
    w: 12,
    h: 0.9,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: TEXT,
  });
  const phases = [
    ["Now (hackathon)", "Gated autonomous purchase loop live on Arc testnet with real verifier"],
    ["Next 3 months", "Real recording uploads + IPFS storage · verifier fine-tuned per domain · seller onboarding in Brazil"],
    ["6-12 months", "On-chain job records (ERC-1155) & escrow · portable seller reputation · multi-buyer / multi-seller marketplace on Arc mainnet"],
  ];
  phases.forEach(([title, body], i) => {
    const y = 2.3 + i * 1.35;
    s.addShape("rect", { x: 0.6, y, w: 0.07, h: 1.1, fill: { color: MINT } });
    s.addText(title, { x: 0.85, y, w: 3.2, h: 1.1, fontFace: FONT, fontSize: 16, bold: true, color: TEXT, valign: "middle" });
    s.addText(body, { x: 4.2, y, w: 8.5, h: 1.1, fontFace: FONT, fontSize: 14, color: MUTED, valign: "middle", lineSpacing: 20 });
  });
  footer(s, 9);
}

// ─── 10. Links for judging ───
{
  const s = baseSlide();
  chip(s, "Final submission links", 0.6, 0.55, 8);
  s.addText("Everything a judge needs — public, no private logins.", {
    x: 0.55,
    y: 0.95,
    w: 12.2,
    h: 0.8,
    fontFace: FONT,
    fontSize: 30,
    bold: true,
    color: TEXT,
  });
  const links = [
    ["Repo", "https://github.com/tetheusz/gravai"],
    ["Live app", "Deploy on Vercel → paste production URL in Encode + README"],
    ["Deck", "Upload gravai-deck.pptx to Google Slides · anyone with the link"],
    ["Video", "≤3 min · Standard approve + Strict withhold · YouTube/Loom"],
  ];
  links.forEach(([title, body], i) => {
    const y = 2.1 + i * 1.05;
    s.addShape("rect", { x: 0.6, y, w: 0.07, h: 0.85, fill: { color: MINT } });
    s.addText(title, {
      x: 0.85,
      y,
      w: 2.4,
      h: 0.85,
      fontFace: FONT,
      fontSize: 16,
      bold: true,
      color: TEXT,
      valign: "middle",
    });
    s.addText(body, {
      x: 3.4,
      y,
      w: 9.3,
      h: 0.85,
      fontFace: FONT,
      fontSize: 14,
      color: MUTED,
      valign: "middle",
    });
  });
  footer(s, 10);
}

// ─── 11. Close ───
{
  const s = baseSlide();
  s.addShape("rect", { x: 0, y: 0, w: 0.12, h: 7.5, fill: { color: MINT } });
  s.addText("Agents are becoming the biggest\nbuyers of human data.", {
    x: 0.9,
    y: 2.2,
    w: 11.5,
    h: 1.8,
    fontFace: FONT,
    fontSize: 40,
    bold: true,
    color: TEXT,
    lineSpacing: 48,
  });
  s.addText("GravAI gives them a marketplace where quality — not trust — moves the money.", {
    x: 0.9,
    y: 4.1,
    w: 10.5,
    h: 0.6,
    fontFace: FONT,
    fontSize: 20,
    color: MINT,
  });
  s.addText(
    "Prototype fixtures + real USDC nanopayments on Arc testnet\nMatheus Procópio · github.com/tetheusz/gravai · Agentic Economy",
    {
      x: 0.9,
      y: 5.4,
      w: 11,
      h: 0.9,
      fontFace: FONT,
      fontSize: 14,
      color: MUTED,
      lineSpacing: 22,
    },
  );
}

await pptx.writeFile({ fileName: "gravai-deck.pptx" });
console.log("Deck written to gravai-deck.pptx");
