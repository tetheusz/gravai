/**
 * GravAI autonomous loop:
 * 1) Buyer pays for a cheap sample
 * 2) Verifier scores it against the job rubric (LLM when OPENAI_API_KEY is set)
 * 3) On approval, buyer pays for the full dataset; on reject, no full purchase
 */
import { GatewayClient } from "@circle-fin/x402-batching/client";
import {
  createWalletClient,
  createPublicClient,
  http,
  erc20Abi,
  parseUnits,
  parseEther,
} from "viem";
import { arcTestnet } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000" as const;
const ARC_TESTNET_RPC = "https://rpc.testnet.arc.network";
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT ?? "1";
const GAS_FUND_AMOUNT = parseEther("0.01");
const APPROVE_THRESHOLD = Number(process.env.VERIFY_THRESHOLD ?? "0.7");

const funderKey = process.env.BUYER_PRIVATE_KEY as `0x${string}` | undefined;
if (!funderKey) {
  console.error("Missing BUYER_PRIVATE_KEY. Run `npm run generate-wallets` first.");
  process.exit(1);
}

type SamplePayload = {
  kind: string;
  job: {
    title: string;
    language: string;
    brief: { task: string; successCriteria: string[] };
    rubric: Array<{ id: string; weight: number; description: string }>;
  };
  clip: {
    clipId: string;
    objective: string;
    narrationExcerpt: string;
    actionLog: unknown[];
    endState: unknown;
  };
  provenance: { contentHash: string };
};

type Verdict = {
  approved: boolean;
  score: number;
  reasons: string[];
  rubricScores: Record<string, number>;
};

async function withNonceRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = (err as Error).message ?? "";
      const isNonceError =
        msg.includes("replacement transaction underpriced") ||
        msg.includes("nonce too low") ||
        msg.includes("already known");
      if (!isNonceError || attempt === MAX_RETRIES - 1) throw err;
      const delay = 1000 + Math.random() * 2000;
      console.log(`  ${label}: nonce collision, retrying in ${Math.round(delay)}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

async function verifyWithHeuristic(sample: SamplePayload): Promise<Verdict> {
  const rubricScores: Record<string, number> = {};
  const reasons: string[] = [];

  const hasNarration =
    typeof sample.clip.narrationExcerpt === "string" &&
    sample.clip.narrationExcerpt.length > 40;
  rubricScores.narration = hasNarration ? 0.9 : 0.2;
  reasons.push(
    hasNarration
      ? "Narration excerpt present and substantive"
      : "Narration missing or too short",
  );

  const actions = Array.isArray(sample.clip.actionLog) ? sample.clip.actionLog.length : 0;
  rubricScores.actions = actions >= 3 ? 0.85 : 0.3;
  reasons.push(`Action log has ${actions} steps`);

  const endStateOk = !!sample.clip.endState;
  rubricScores.completeness = endStateOk ? 0.8 : 0.2;
  reasons.push(endStateOk ? "End state documented" : "Missing end state");

  const langOk = sample.job.language?.toLowerCase().startsWith("pt");
  rubricScores.quality = langOk && sample.provenance?.contentHash ? 0.85 : 0.4;
  reasons.push(
    langOk
      ? `Language ${sample.job.language}; hash ${sample.provenance.contentHash.slice(0, 18)}...`
      : "Language/provenance weak",
  );

  let score = 0;
  for (const r of sample.job.rubric) {
    score += (rubricScores[r.id] ?? 0.5) * r.weight;
  }

  return {
    approved: score >= APPROVE_THRESHOLD,
    score: Number(score.toFixed(3)),
    reasons,
    rubricScores,
  };
}

async function verifyWithLlm(sample: SamplePayload): Promise<Verdict> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes("your-openai")) {
    console.log("OPENAI_API_KEY not set — using heuristic verifier");
    return verifyWithHeuristic(sample);
  }

  const system = `You are GravAI's verifier agent. Score a human computer-use sample against the rubric.
Return ONLY JSON: {"approved":boolean,"score":number,"reasons":string[],"rubricScores":{id:number}}
score is 0..1 weighted by rubric weights. Approve if score >= ${APPROVE_THRESHOLD}.`;

  const user = JSON.stringify({
    brief: sample.job.brief,
    rubric: sample.job.rubric,
    clip: sample.clip,
    provenance: sample.provenance,
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`LLM verify failed (${res.status}): ${text.slice(0, 200)}`);
    console.log("Falling back to heuristic verifier");
    return verifyWithHeuristic(sample);
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = body.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Verdict;
  return {
    approved: Boolean(parsed.approved),
    score: Number(parsed.score ?? 0),
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
    rubricScores: parsed.rubricScores ?? {},
  };
}

// --- Bootstrap ephemeral buyer wallet ---
const ephemeralKey = generatePrivateKey();
const ephemeralAccount = privateKeyToAccount(ephemeralKey);
const funderAccount = privateKeyToAccount(funderKey);

console.log("=== GravAI autonomous purchase loop ===");
console.log(`Ephemeral buyer: ${ephemeralAccount.address}`);
console.log(`Funder:          ${funderAccount.address}`);

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_TESTNET_RPC),
});
const funderWallet = createWalletClient({
  account: funderAccount,
  chain: arcTestnet,
  transport: http(ARC_TESTNET_RPC),
});

const usdcAmount = parseUnits(DEPOSIT_AMOUNT, 6);

console.log("Funding ephemeral wallet...");
const gasTxHash = await withNonceRetry(
  () =>
    funderWallet.sendTransaction({
      to: ephemeralAccount.address,
      value: GAS_FUND_AMOUNT,
    }),
  "Gas tx",
);
await publicClient.waitForTransactionReceipt({ hash: gasTxHash });
console.log(`  Gas funded (${gasTxHash.slice(0, 10)}...)`);

const usdcTxHash = await withNonceRetry(
  () =>
    funderWallet.writeContract({
      address: ARC_TESTNET_USDC,
      abi: erc20Abi,
      functionName: "transfer",
      args: [ephemeralAccount.address, usdcAmount],
    }),
  "USDC tx",
);
await publicClient.waitForTransactionReceipt({ hash: usdcTxHash });
console.log(`  USDC transferred (${usdcTxHash.slice(0, 10)}...)`);

const gateway = new GatewayClient({
  chain: "arcTestnet",
  privateKey: ephemeralKey,
});

console.log(`Depositing ${DEPOSIT_AMOUNT} USDC into Gateway...`);
const deposit = await gateway.deposit(DEPOSIT_AMOUNT);
console.log(`Deposit TX: ${deposit.depositTxHash}`);

for (let i = 0; i < 24; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  const bal = await gateway.getBalances();
  if (bal.gateway.available > 0n) {
    console.log(`Gateway available: ${bal.gateway.formattedAvailable}`);
    break;
  }
  if (i === 23) {
    console.error("Gateway deposit never became available");
    process.exit(1);
  }
}

// Step 1 — buy sample
console.log("\n[1/3] Paying for sample preview...");
const samplePay = await gateway.pay(`${BASE_URL}/api/premium/sample`, {
  method: "GET",
});
console.log(
  `  Sample paid: ${samplePay.formattedAmount} USDC (tx ${samplePay.transaction})`,
);
const sample = samplePay.data as SamplePayload;
console.log(`  Job: ${sample.job?.title}`);
console.log(`  Hash: ${sample.provenance?.contentHash}`);

// Step 2 — verify
console.log("\n[2/3] Verifier agent scoring sample...");
const verdict = await verifyWithLlm(sample);
console.log(`  Score: ${verdict.score} (threshold ${APPROVE_THRESHOLD})`);
console.log(`  Approved: ${verdict.approved}`);
for (const reason of verdict.reasons) console.log(`  - ${reason}`);

// Step 3 — gated full purchase
if (!verdict.approved) {
  console.log("\n[3/3] REJECTED — withholding full-dataset payment.");
  console.log("Autonomous loop complete (no full purchase).");
  process.exit(0);
}

console.log("\n[3/3] APPROVED — paying for full dataset...");
const fullPay = await gateway.pay(`${BASE_URL}/api/premium/dataset-full`, {
  method: "GET",
});
console.log(
  `  Full dataset paid: ${fullPay.formattedAmount} USDC (tx ${fullPay.transaction})`,
);
const full = fullPay.data as {
  provenance?: { contentHash?: string };
  dataset?: { clips?: unknown[]; totalDurationSec?: number };
};
console.log(`  Clips: ${full.dataset?.clips?.length ?? "?"}`);
console.log(`  Duration: ${full.dataset?.totalDurationSec ?? "?"}s`);
console.log(`  Hash: ${full.provenance?.contentHash}`);
console.log("\nAutonomous loop complete.");
process.exit(0);
