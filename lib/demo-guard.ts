import { NextRequest, NextResponse } from "next/server";

const AGENT_COOLDOWN_MS = 15_000;
const WITHDRAW_COOLDOWN_MS = 10_000;

const lastActionAt = new Map<string, number>();
const activeAgentRuns = new Set<string>();

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "local";
}

/** Demo cookie set by login / loginAsDemo. */
export function requireDemoSession(req: NextRequest): NextResponse | null {
  if (req.cookies.get("session")?.value !== "authenticated") {
    return NextResponse.json(
      { error: "Sign in as demo operator to run this action." },
      { status: 401 },
    );
  }
  return null;
}

function checkCooldown(
  bucket: string,
  cooldownMs: number,
): NextResponse | null {
  const now = Date.now();
  const last = lastActionAt.get(bucket) ?? 0;
  const wait = cooldownMs - (now - last);
  if (wait > 0) {
    return NextResponse.json(
      {
        error: `Please wait ${Math.ceil(wait / 1000)}s before trying again.`,
        retryAfterSec: Math.ceil(wait / 1000),
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(wait / 1000)) },
      },
    );
  }
  lastActionAt.set(bucket, now);
  return null;
}

/**
 * Session + cooldown + single-flight guard for the autonomous purchase loop.
 * Returns an error response or a release() callback that must run when the
 * SSE stream finishes.
 */
export function beginAgentRun(
  req: NextRequest,
): { error: NextResponse } | { release: () => void } {
  const unauthorized = requireDemoSession(req);
  if (unauthorized) return { error: unauthorized };

  const key = clientKey(req);
  if (activeAgentRuns.has(key)) {
    return {
      error: NextResponse.json(
        { error: "An agent run is already in progress. Wait for it to finish." },
        { status: 409 },
      ),
    };
  }

  const rateLimited = checkCooldown(`agent:${key}`, AGENT_COOLDOWN_MS);
  if (rateLimited) return { error: rateLimited };

  activeAgentRuns.add(key);
  return {
    release: () => {
      activeAgentRuns.delete(key);
    },
  };
}

export function guardWithdraw(req: NextRequest): NextResponse | null {
  const unauthorized = requireDemoSession(req);
  if (unauthorized) return unauthorized;
  return checkCooldown(`withdraw:${clientKey(req)}`, WITHDRAW_COOLDOWN_MS);
}
