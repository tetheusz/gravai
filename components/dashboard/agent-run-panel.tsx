"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  FileSearch,
  Loader2,
  Lock,
  MousePointer2,
  Play,
  ShieldCheck,
  Target,
  Wallet,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GRAVAI_JOB } from "@/lib/gravai-job";
import { cn, shortenHash } from "@/lib/utils";

const EXPLORER_BASE = "https://testnet.arcscan.app";

type StepStatus = "idle" | "running" | "done" | "skipped" | "withheld" | "failed";

type Verdict = {
  approved: boolean;
  score: number;
  threshold: number;
  engine: "llm" | "heuristic";
  reasons: string[];
  rubricScores: Record<string, number>;
};

type ActionLogEntry = {
  t: number;
  type: string;
  target?: string;
  value?: string;
};

type SampleClip = {
  clipId: string;
  durationSec: number;
  objective: string;
  narrationExcerpt: string;
  actionLog: ActionLogEntry[];
  endState: {
    workbook: string;
    sheets: string[];
    keyResult: string;
  };
};

type FullDeliverySummary = {
  clips: number;
  durationSec: number;
  hash?: string;
  format?: string;
  clipSummaries: Array<{
    clipId: string;
    durationSec: number;
    objective: string;
  }>;
};

type StepState = {
  status: StepStatus;
  detail?: string;
  tx?: string;
  amount?: string;
};

type Scenario = "approve" | "strict";

const STEP_ORDER = ["balance", "deposit", "sample", "verify", "full"] as const;
type StepId = (typeof STEP_ORDER)[number];

const STEP_META: Record<StepId, { title: string; icon: React.ReactNode }> = {
  balance: { title: "Buyer agent wallet check", icon: <Wallet size={15} /> },
  deposit: { title: "Gateway top-up (USDC)", icon: <CircleDollarSign size={15} /> },
  sample: { title: "Nanopayment · sample preview", icon: <FileSearch size={15} /> },
  verify: { title: "Verifier agent scores sample", icon: <ShieldCheck size={15} /> },
  full: { title: "Gated settlement · full dataset", icon: <Lock size={15} /> },
};

const RUBRIC_LABELS: Record<string, string> = {
  narration: "Narration",
  actions: "Actions",
  completeness: "Completeness",
  quality: "Quality",
};

function initialSteps(): Record<StepId, StepState> {
  return {
    balance: { status: "idle" },
    deposit: { status: "idle" },
    sample: { status: "idle" },
    verify: { status: "idle" },
    full: { status: "idle" },
  };
}

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "running":
      return <Loader2 size={15} className="animate-spin text-primary" />;
    case "done":
      return <CheckCircle2 size={15} className="text-primary" />;
    case "withheld":
      return <XCircle size={15} className="text-destructive" />;
    case "failed":
      return <XCircle size={15} className="text-destructive" />;
    case "skipped":
      return <CheckCircle2 size={15} className="text-muted-foreground/60" />;
    default:
      return <span className="block size-[15px] rounded-full border border-border" />;
  }
}

function TxLink({ tx }: { tx: string }) {
  if (tx.startsWith("0x")) {
    return (
      <a
        href={`${EXPLORER_BASE}/tx/${tx}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
      >
        {shortenHash(tx, 6)} <ExternalLink size={11} />
      </a>
    );
  }
  return <span className="font-mono text-xs text-muted-foreground">receipt {shortenHash(tx, 6)}</span>;
}

function formatAction(entry: ActionLogEntry): string {
  if (entry.value) return `${entry.type}: ${entry.value}`;
  if (entry.target) return `${entry.type}: ${entry.target}`;
  return entry.type;
}

function SampleClipViewer({
  clip,
  hash,
}: {
  clip: SampleClip;
  hash?: string;
}) {
  return (
    <div
      id="purchased-sample"
      className="mt-6 overflow-hidden rounded-lg border border-primary/30 bg-primary/5 scroll-mt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
            Purchased sample
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>{clip.clipId}</span>
          <span>·</span>
          <span>{clip.durationSec}s</span>
          {hash && (
            <>
              <span>·</span>
              <span title={hash}>{hash.slice(0, 22)}…</span>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-primary/20 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-start gap-2">
            <Target size={14} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Objective
              </p>
              <p className="mt-0.5 text-sm font-medium leading-5">{clip.objective}</p>
            </div>
          </div>

          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Narration (pt-BR)
          </p>
          <blockquote className="mt-1.5 border-l-2 border-primary/50 pl-3 text-sm leading-6 text-foreground/90 italic">
            “{clip.narrationExcerpt}”
          </blockquote>

          <div className="mt-4 rounded-md border border-border/80 bg-background/60 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              End state
            </p>
            <p className="mt-1 font-mono text-xs text-primary">{clip.endState.keyResult}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {clip.endState.workbook} · {clip.endState.sheets.join(" · ")}
            </p>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <MousePointer2 size={14} className="text-primary" />
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Action log · {clip.actionLog.length} steps
            </p>
          </div>
          <ol className="max-h-56 space-y-0 overflow-y-auto font-mono text-[11px]">
            {clip.actionLog.map((entry, i) => (
              <li
                key={`${entry.t}-${i}`}
                className="flex gap-3 border-b border-border/40 py-1.5 last:border-0"
              >
                <span className="w-10 shrink-0 text-muted-foreground tabular-nums">
                  {entry.t.toFixed(1)}s
                </span>
                <span className="min-w-0 truncate text-foreground/90">
                  {formatAction(entry)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function FullDeliveryViewer({ delivery }: { delivery: FullDeliverySummary }) {
  return (
    <div
      id="full-delivery"
      className="mt-4 overflow-hidden rounded-lg border border-primary/40 bg-background scroll-mt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-primary" />
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
            Full dataset unlocked
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span>{delivery.clips} clips</span>
          <span>·</span>
          <span>{Math.round(delivery.durationSec / 60)} min</span>
          <span>·</span>
          <span>{delivery.format ?? "computer-use-v1"}</span>
          {delivery.hash && (
            <>
              <span>·</span>
              <span title={delivery.hash}>{delivery.hash.slice(0, 22)}…</span>
            </>
          )}
        </div>
      </div>
      <ul className="divide-y divide-border/60">
        {delivery.clipSummaries.map((clip) => (
          <li
            key={clip.clipId}
            className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs text-primary">{clip.clipId}</p>
              <p className="mt-0.5 text-sm text-foreground/90">{clip.objective}</p>
            </div>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {clip.durationSec}s
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AgentRunPanel() {
  const [running, setRunning] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("approve");
  const [steps, setSteps] = useState<Record<StepId, StepState>>(initialSteps);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [sampleClip, setSampleClip] = useState<SampleClip | null>(null);
  const [sampleHash, setSampleHash] = useState<string | undefined>();
  const [fullDelivery, setFullDelivery] = useState<FullDeliverySummary | null>(null);
  const [runResult, setRunResult] = useState<{
    approved: boolean;
    totalSpent: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fundingWarning, setFundingWarning] = useState<string | null>(null);
  const startedRef = useRef(false);

  const refreshFunding = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/status");
      if (!res.ok) return;
      const data = (await res.json()) as {
        funded?: boolean;
        message?: string;
        gatewayAvailable?: string;
      };
      if (data.funded === false) {
        setFundingWarning(
          data.message ??
            `Buyer Gateway low (${data.gatewayAvailable ?? "?"} USDC). Top up before demo.`,
        );
      } else {
        setFundingWarning(null);
      }
    } catch {
      // ignore — run path still surfaces balance errors
    }
  }, []);

  useEffect(() => {
    void refreshFunding();
  }, [refreshFunding]);

  useEffect(() => {
    if (!sampleClip) return;
    document.getElementById("purchased-sample")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [sampleClip]);

  useEffect(() => {
    if (!fullDelivery) return;
    document.getElementById("full-delivery")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [fullDelivery]);

  const updateStep = useCallback((id: StepId, patch: Partial<StepState>) => {
    setSteps((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const handleEvent = useCallback(
    (event: Record<string, unknown>) => {
      if (event.type === "error") {
        setError(String(event.message ?? "Unknown error"));
        return;
      }
      if (event.type === "run" && event.status === "done") {
        setRunResult({
          approved: Boolean(event.approved),
          totalSpent: String(event.totalSpent ?? "0"),
        });
        return;
      }
      if (event.type !== "step") return;

      const id = event.id as StepId;
      const status = event.status as string;

      if (status === "start") {
        updateStep(id, { status: "running" });
        return;
      }
      if (status === "skip") {
        updateStep(id, { status: "skipped", detail: "Gateway balance sufficient — no deposit needed" });
        return;
      }
      if (status === "withheld") {
        updateStep(id, { status: "withheld", detail: String(event.reason ?? "") });
        return;
      }
      if (status !== "done") return;

      switch (id) {
        case "balance":
          updateStep(id, {
            status: "done",
            detail: `Gateway ${event.gatewayAvailable} USDC · wallet ${event.walletUsdc} USDC`,
          });
          break;
        case "deposit":
          updateStep(id, {
            status: "done",
            detail: `Available ${event.gatewayAvailable} USDC`,
            tx: event.tx ? String(event.tx) : undefined,
          });
          break;
        case "sample": {
          const clip = event.clip as SampleClip | undefined;
          if (clip?.clipId) setSampleClip(clip);
          if (event.hash) setSampleHash(String(event.hash));
          updateStep(id, {
            status: "done",
            amount: String(event.amount),
            detail: `Clip ${event.clipId} unlocked — preview below`,
            tx: event.tx ? String(event.tx) : undefined,
          });
          break;
        }
        case "verify": {
          const v = event.verdict as Verdict;
          setVerdict(v);
          updateStep(id, {
            status: "done",
            detail: `${v.engine === "llm" ? "LLM" : "Heuristic"} score ${v.score} · threshold ${v.threshold}`,
          });
          break;
        }
        case "full": {
          const summaries = Array.isArray(event.clipSummaries)
            ? (event.clipSummaries as FullDeliverySummary["clipSummaries"])
            : [];
          setFullDelivery({
            clips: Number(event.clips ?? summaries.length),
            durationSec: Number(event.durationSec ?? 0),
            hash: event.hash ? String(event.hash) : undefined,
            format: event.format ? String(event.format) : undefined,
            clipSummaries: summaries,
          });
          updateStep(id, {
            status: "done",
            amount: String(event.amount),
            detail: `${event.clips} clips unlocked — details below`,
            tx: event.tx ? String(event.tx) : undefined,
          });
          break;
        }
      }
    },
    [updateStep],
  );

  const runAgent = useCallback(async () => {
    if (startedRef.current) return;
    await refreshFunding();
    startedRef.current = true;
    setRunning(true);
    setSteps(initialSteps());
    setVerdict(null);
    setSampleClip(null);
    setSampleHash(undefined);
    setFullDelivery(null);
    setRunResult(null);
    setError(null);

    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      if (!res.ok || !res.body) {
        let message = `Agent run failed to start (${res.status})`;
        try {
          const payload = (await res.json()) as { error?: string };
          if (payload.error) message = payload.error;
        } catch {
          // keep status message
        }
        throw new Error(message);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            handleEvent(JSON.parse(line.slice(6)));
          } catch {
            // ignore malformed chunk
          }
        }
      }
      void refreshFunding();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
      startedRef.current = false;
    }
  }, [scenario, handleEvent, refreshFunding]);

  return (
    <section className="mb-8 border-b border-border/80 pb-8">
      {fundingWarning && (
        <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {fundingWarning}
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
            Live marketplace
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Run the autonomous purchase loop
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-border/80 text-xs">
            <button
              onClick={() => setScenario("approve")}
              disabled={running}
              className={cn(
                "px-3 py-1.5 transition-colors",
                scenario === "approve"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Standard gate
            </button>
            <button
              onClick={() => setScenario("strict")}
              disabled={running}
              className={cn(
                "border-l border-border/80 px-3 py-1.5 transition-colors",
                scenario === "strict"
                  ? "bg-destructive/15 text-destructive"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Strict gate (reject)
            </button>
          </div>
          <button
            onClick={runAgent}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {running ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Agents working…
              </>
            ) : (
              <>
                <Play size={15} /> Run buyer agent
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* ── Marketplace listing ── */}
        <div className="rounded-lg border border-border/80 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge variant="secondary" className="mb-2">
                {GRAVAI_JOB.domain} · {GRAVAI_JOB.language}
              </Badge>
              <h3 className="text-base font-semibold leading-snug">
                {GRAVAI_JOB.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Seller: {GRAVAI_JOB.seller.displayName} · {GRAVAI_JOB.seller.region}
              </p>
            </div>
            <Bot size={20} className="shrink-0 text-primary" />
          </div>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {GRAVAI_JOB.brief.task}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border/80 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Sample preview
              </p>
              <p className="mt-0.5 font-mono text-lg">
                ${GRAVAI_JOB.pricing.sampleUsdc}
              </p>
            </div>
            <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Full dataset
              </p>
              <p className="mt-0.5 font-mono text-lg text-primary">
                ${GRAVAI_JOB.pricing.fullUsdc}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Verification rubric
            </p>
            <ul className="mt-2 space-y-2">
              {GRAVAI_JOB.rubric.map((item) => {
                const score = verdict?.rubricScores?.[item.id];
                return (
                  <li key={item.id} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span>{RUBRIC_LABELS[item.id] ?? item.id}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {score !== undefined
                          ? `${Math.round(score * 100)}%`
                          : `w ${item.weight}`}
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          verdict && !verdict.approved
                            ? "bg-destructive/70"
                            : "bg-primary",
                        )}
                        style={{
                          width:
                            score !== undefined ? `${score * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* ── Live agent timeline ── */}
        <div className="rounded-lg border border-border/80 p-5">
          <ol className="space-y-4">
            {STEP_ORDER.map((id, index) => {
              const step = steps[id];
              const meta = STEP_META[id];
              const isLast = index === STEP_ORDER.length - 1;
              return (
                <li key={id} className="relative flex gap-3">
                  {!isLast && (
                    <span
                      className={cn(
                        "absolute left-[7px] top-6 h-[calc(100%-8px)] w-px",
                        step.status === "done" || step.status === "skipped"
                          ? "bg-primary/40"
                          : "bg-border",
                      )}
                    />
                  )}
                  <div className="relative z-10 mt-0.5 shrink-0 bg-background">
                    <StatusIcon status={step.status} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p
                        className={cn(
                          "flex items-center gap-2 text-sm font-medium",
                          step.status === "idle" && "text-muted-foreground",
                          step.status === "withheld" && "text-destructive",
                        )}
                      >
                        {meta.icon}
                        {meta.title}
                      </p>
                      <span className="flex items-center gap-2">
                        {step.amount && (
                          <span className="font-mono text-xs text-primary">
                            −{step.amount} USDC
                          </span>
                        )}
                        {step.tx && <TxLink tx={step.tx} />}
                      </span>
                    </div>
                    {step.detail && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {step.detail}
                      </p>
                    )}
                    {id === "verify" && verdict && (
                      <ul className="mt-2 space-y-1 border-l border-border/80 pl-3">
                        {verdict.reasons.slice(0, 4).map((reason, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-xs text-muted-foreground"
                          >
                            <ChevronRight size={11} className="mt-0.5 shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {error && (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {runResult && (
            <div
              className={cn(
                "mt-4 flex items-center justify-between rounded-md border px-3 py-2.5 text-sm",
                runResult.approved
                  ? "border-primary/40 bg-primary/10"
                  : "border-destructive/40 bg-destructive/10",
              )}
            >
              <span className="flex items-center gap-2 font-medium">
                {runResult.approved ? (
                  <>
                    <CheckCircle2 size={16} className="text-primary" />
                    Delivery verified — full payment settled
                  </>
                ) : (
                  <>
                    <XCircle size={16} className="text-destructive" />
                    Sample rejected — full payment withheld
                  </>
                )}
              </span>
              <span className="font-mono text-xs">
                Total spent: {runResult.totalSpent} USDC
              </span>
            </div>
          )}

          {!runResult && !running && !error && (
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              The buyer agent pays a $0.001 nanopayment for a sample, the
              verifier agent scores it against the rubric, and only an approved
              verdict releases the $0.05 full-dataset settlement — all on Arc
              testnet, live. Settlements appear in the ledger below in
              real&nbsp;time.
            </p>
          )}
        </div>
      </div>

      {sampleClip && <SampleClipViewer clip={sampleClip} hash={sampleHash} />}
      {fullDelivery && <FullDeliveryViewer delivery={fullDelivery} />}
    </section>
  );
}
