/**
 * Copyright 2026 Circle Internet Group, Inc.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextRequest, NextResponse } from "next/server";
import { withGateway } from "@/lib/x402";
import { buildSampleDelivery } from "@/lib/gravai-data";

/**
 * Legacy path kept for demo compatibility — same payload as /api/premium/sample.
 * Prefer /sample (preview) + /dataset-full (gated purchase).
 */
const handler = async (_req: NextRequest) => {
  return NextResponse.json(buildSampleDelivery());
};

export const GET = withGateway(handler, "$0.01", "/api/premium/dataset");
