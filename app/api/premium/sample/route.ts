import { NextRequest, NextResponse } from "next/server";
import { withGateway } from "@/lib/x402";
import { buildSampleDelivery } from "@/lib/gravai-data";

/**
 * GravAI preview sample — cheap nanopayment so the verifier can score quality
 * before the buyer agent spends on the full dataset.
 */
const handler = async (_req: NextRequest) => {
  return NextResponse.json(buildSampleDelivery());
};

export const GET = withGateway(handler, "$0.001", "/api/premium/sample");
