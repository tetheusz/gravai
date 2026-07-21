import { NextRequest, NextResponse } from "next/server";
import { withGateway } from "@/lib/x402";
import { buildFullDelivery } from "@/lib/gravai-data";

/**
 * GravAI full dataset — paid only after the verifier agent approves the sample.
 */
const handler = async (_req: NextRequest) => {
  return NextResponse.json(buildFullDelivery());
};

export const GET = withGateway(handler, "$0.05", "/api/premium/dataset-full");
