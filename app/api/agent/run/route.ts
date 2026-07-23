import { NextRequest } from "next/server";
import { GatewayClient } from "@circle-fin/x402-batching/client";
import { verifySample, type SamplePayload } from "@/lib/verifier";

/**
 * Runs the GravAI autonomous purchase loop server-side and streams every
 * step to the dashboard as Server-Sent Events, so the product demo is live:
 * buyer pays for a sample, verifier scores it, and the full-dataset payment
 * is released or withheld based on the verdict.
 */

const MIN_GATEWAY_BALANCE = 100_000n; // 0.10 USDC in atomic units
const DEPOSIT_AMOUNT = "0.5";

type SendEvent = (event: Record<string, unknown>) => void;

async function runLoop(send: SendEvent, origin: string, threshold: number) {
  const buyerKey = process.env.BUYER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!buyerKey) {
    throw new Error("BUYER_PRIVATE_KEY is not configured on the server");
  }

  const gateway = new GatewayClient({
    chain: "arcTestnet",
    privateKey: buyerKey,
  });

  // Step 1 — check buyer funds
  send({ type: "step", id: "balance", status: "start" });
  let balances = await gateway.getBalances();
  send({
    type: "step",
    id: "balance",
    status: "done",
    gatewayAvailable: balances.gateway.formattedAvailable,
    walletUsdc: balances.wallet.formatted,
  });

  // Step 2 — top up the Gateway balance if it cannot cover sample + full
  if (balances.gateway.available < MIN_GATEWAY_BALANCE) {
    send({ type: "step", id: "deposit", status: "start", amount: DEPOSIT_AMOUNT });
    const deposit = await gateway.deposit(DEPOSIT_AMOUNT);
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      balances = await gateway.getBalances();
      if (balances.gateway.available >= MIN_GATEWAY_BALANCE) break;
    }
    if (balances.gateway.available < MIN_GATEWAY_BALANCE) {
      throw new Error("Gateway deposit did not become available in time");
    }
    send({
      type: "step",
      id: "deposit",
      status: "done",
      tx: deposit.depositTxHash,
      gatewayAvailable: balances.gateway.formattedAvailable,
    });
  } else {
    send({ type: "step", id: "deposit", status: "skip" });
  }

  // Step 3 — nanopayment for the cheap sample preview
  send({ type: "step", id: "sample", status: "start" });
  const samplePay = await gateway.pay(`${origin}/api/premium/sample`, {
    method: "GET",
  });
  const sample = samplePay.data as SamplePayload;
  send({
    type: "step",
    id: "sample",
    status: "done",
    amount: samplePay.formattedAmount,
    tx: samplePay.transaction,
    jobTitle: sample.job?.title,
    clipId: sample.clip?.clipId,
    hash: sample.provenance?.contentHash,
    // Full clip payload so the dashboard can show what the agent bought
    clip: sample.clip,
  });

  // Step 4 — verifier agent scores the sample against the rubric
  send({ type: "step", id: "verify", status: "start" });
  const verdict = await verifySample(sample, threshold);
  send({ type: "step", id: "verify", status: "done", verdict });

  // Step 5 — gated full purchase: money only moves on approval
  if (!verdict.approved) {
    send({
      type: "step",
      id: "full",
      status: "withheld",
      reason: `Score ${verdict.score} below threshold ${threshold} — payment withheld`,
    });
    send({
      type: "run",
      status: "done",
      approved: false,
      totalSpent: samplePay.formattedAmount,
    });
    return;
  }

  send({ type: "step", id: "full", status: "start" });
  const fullPay = await gateway.pay(`${origin}/api/premium/dataset-full`, {
    method: "GET",
  });
  const full = fullPay.data as {
    provenance?: { contentHash?: string };
    dataset?: {
      clips?: Array<{
        clipId?: string;
        durationSec?: number;
        objective?: string;
      }>;
      totalDurationSec?: number;
      format?: string;
    };
  };
  const clipSummaries = (full.dataset?.clips ?? []).map((clip) => ({
    clipId: clip.clipId ?? "unknown",
    durationSec: clip.durationSec ?? 0,
    objective: clip.objective ?? "",
  }));
  send({
    type: "step",
    id: "full",
    status: "done",
    amount: fullPay.formattedAmount,
    tx: fullPay.transaction,
    clips: clipSummaries.length,
    durationSec: full.dataset?.totalDurationSec ?? 0,
    hash: full.provenance?.contentHash,
    format: full.dataset?.format ?? "computer-use-v1",
    clipSummaries,
  });
  send({
    type: "run",
    status: "done",
    approved: true,
    totalSpent: (
      Number(samplePay.formattedAmount) + Number(fullPay.formattedAmount)
    ).toFixed(3),
  });
}

export async function POST(req: NextRequest) {
  let scenario = "approve";
  try {
    const body = (await req.json()) as { scenario?: string };
    if (body.scenario === "strict") scenario = "strict";
  } catch {
    // no body — default scenario
  }
  const threshold = scenario === "strict" ? 0.95 : 0.7;
  const origin = req.nextUrl.origin;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send: SendEvent = (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      send({ type: "run", status: "start", scenario, threshold });
      try {
        await runLoop(send, origin, threshold);
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
