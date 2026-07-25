import { NextRequest, NextResponse } from "next/server";
import { GatewayClient } from "@circle-fin/x402-batching/client";
import { requireDemoSession } from "@/lib/demo-guard";

/** Minimum Gateway USDC (atomic 6 decimals) to cover sample + full + buffer. */
const MIN_GATEWAY_BALANCE = BigInt(100_000); // 0.10 USDC

export async function GET(req: NextRequest) {
  const unauthorized = requireDemoSession(req);
  if (unauthorized) return unauthorized;

  const buyerKey = process.env.BUYER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!buyerKey) {
    return NextResponse.json(
      { error: "BUYER_PRIVATE_KEY is not configured", funded: false },
      { status: 500 },
    );
  }

  try {
    const gateway = new GatewayClient({
      chain: "arcTestnet",
      privateKey: buyerKey,
    });
    const balances = await gateway.getBalances();
    const available = balances.gateway.available;
    const funded = available >= MIN_GATEWAY_BALANCE;
    return NextResponse.json({
      funded,
      gatewayAvailable: balances.gateway.formattedAvailable,
      walletUsdc: balances.wallet.formatted,
      minRequired: "0.10",
      message: funded
        ? "Buyer Gateway balance is sufficient for a full purchase loop."
        : `Buyer Gateway balance is low (${balances.gateway.formattedAvailable} USDC). Deposit at least 0.10 USDC before demo.`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        funded: false,
        error: (err as Error).message,
        message: "Could not read buyer Gateway balance.",
      },
      { status: 502 },
    );
  }
}
