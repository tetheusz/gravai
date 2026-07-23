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

"use client";

import { useCallback, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  CircleCheck,
  Loader2,
} from "lucide-react";
import { shortenHash } from "@/lib/utils";
import { usePaymentEvents } from "@/hooks/use-transactions";
import { useWithdrawals } from "@/hooks/use-withdrawals";
import { AgentRunPanel } from "@/components/dashboard/agent-run-panel";

type SortDirection = "default" | "asc" | "desc";
type SortField = "amount" | "date";

const EXPLORER_BASE = "https://testnet.arcscan.app";

function nextSortDirection(current: SortDirection): SortDirection {
  if (current === "default") return "asc";
  if (current === "asc") return "desc";
  return "default";
}

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc") return <ArrowUp size={14} />;
  if (direction === "desc") return <ArrowDown size={14} />;
  return <ArrowUpDown size={14} className="text-muted-foreground/50" />;
}

function parseAmount(amount: string): number {
  return parseFloat(amount.replace(/,/g, ""));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CopyableCell({
  value,
  label,
  href,
}: {
  value: string;
  label?: string;
  href?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <span className="inline-flex items-center gap-1.5">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-primary"
        >
          {label ?? value}
        </a>
      ) : (
        <span>{label ?? value}</span>
      )}
      <Tooltip open={copied || undefined}>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
          >
            <Copy size={12} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copied!" : "Copy"}</TooltipContent>
      </Tooltip>
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "confirmed"
      ? "default"
      : status === "failed"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function DeliveryStageBadge({ endpoint }: { endpoint: string }) {
  if (endpoint.endsWith("/sample") || endpoint.endsWith("/dataset")) {
    return (
      <Badge variant="secondary" className="font-normal">
        Sample preview
      </Badge>
    );
  }
  if (endpoint.endsWith("/dataset-full")) {
    return (
      <Badge className="font-normal">
        Full dataset
      </Badge>
    );
  }
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{endpoint}</code>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function Dashboard() {
  const { events, loading: loadingPayments } = usePaymentEvents();
  const { withdrawals, loading: loadingWithdrawals } = useWithdrawals();
  const [activeTab, setActiveTab] = useState("payments");
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("default");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const marketplaceStats = useMemo(() => {
    const samplePurchases = events.filter((event) =>
      event.endpoint.endsWith("/sample"),
    );
    const fullPurchases = events.filter((event) =>
      event.endpoint.endsWith("/dataset-full"),
    );
    const totalSettled = events.reduce(
      (total, event) => total + parseAmount(event.amount_usdc),
      0,
    );
    const uniqueBuyers = new Set(events.map((event) => event.payer.toLowerCase())).size;
    const approvalRate =
      samplePurchases.length === 0
        ? 0
        : Math.min(100, Math.round((fullPurchases.length / samplePurchases.length) * 100));

    return { approvalRate, fullPurchases, samplePurchases, totalSettled, uniqueBuyers };
  }, [events]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      const next = nextSortDirection(sortDirection);
      setSortDirection(next);
      if (next === "default") setSortField(null);
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  }

  // ── Payments filtering & sorting ──
  const filteredPayments = useMemo(() => {
    let result = events;

    if (filter) {
      const query = filter.toLowerCase();
      result = result.filter(
        (ev) =>
          (ev.gateway_tx ?? "").toLowerCase().includes(query) ||
          ev.payer.toLowerCase().includes(query) ||
          ev.endpoint.toLowerCase().includes(query),
      );
    }

    if (sortField && sortDirection !== "default") {
      result = [...result].sort((a, b) => {
        let cmp: number;
        if (sortField === "amount") {
          cmp = parseAmount(a.amount_usdc) - parseAmount(b.amount_usdc);
        } else {
          cmp = a.created_at.localeCompare(b.created_at);
        }
        return sortDirection === "desc" ? -cmp : cmp;
      });
    }

    return result;
  }, [events, filter, sortField, sortDirection]);

  // ── Withdrawals filtering & sorting ──
  const filteredWithdrawals = useMemo(() => {
    let result = withdrawals;

    if (filter) {
      const query = filter.toLowerCase();
      result = result.filter(
        (w) =>
          (w.tx_hash ?? "").toLowerCase().includes(query) ||
          w.destination_address.toLowerCase().includes(query) ||
          w.destination_chain.toLowerCase().includes(query) ||
          w.status.toLowerCase().includes(query),
      );
    }

    if (sortField && sortDirection !== "default") {
      result = [...result].sort((a, b) => {
        let cmp: number;
        if (sortField === "amount") {
          cmp = parseAmount(a.amount_usdc) - parseAmount(b.amount_usdc);
        } else {
          cmp = a.created_at.localeCompare(b.created_at);
        }
        return sortDirection === "desc" ? -cmp : cmp;
      });
    }

    return result;
  }, [withdrawals, filter, sortField, sortDirection]);

  const activeData = activeTab === "payments" ? filteredPayments : filteredWithdrawals;
  const loading = activeTab === "payments" ? loadingPayments : loadingWithdrawals;
  const totalPages = Math.max(1, Math.ceil(activeData.length / pageSize));

  // Clamp page if data shrinks (e.g. realtime delete)
  const clampedPage = Math.min(page, totalPages);

  const paginatedPayments = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, clampedPage, pageSize]);

  const paginatedWithdrawals = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return filteredWithdrawals.slice(start, start + pageSize);
  }, [filteredWithdrawals, clampedPage, pageSize]);

  return (
    <div className="mx-auto max-w-7xl">
      <section className="mb-8 grid gap-6 border-b border-border/80 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Arc testnet · live settlement
          </div>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Verified human data, purchased by agents.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Monitor the GravAI loop: preview purchase, automated verification,
            and gated USDC settlement for the full delivery.
          </p>
        </div>
        <a
          href="https://testnet.arcscan.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          Open Arcscan <ExternalLink size={14} />
        </a>
      </section>

      <div className="mb-6 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
        <span className="font-medium text-foreground">Judge tip:</span> Run{" "}
        <span className="text-foreground">Standard gate</span> to see approval +
        full settlement, then <span className="text-foreground">Strict gate</span>{" "}
        to watch the verifier withhold payment. Settlements land in the ledger
        below in real time.
      </div>

      <AgentRunPanel />

      <section className="mb-8 grid divide-y divide-border/80 border-y border-border/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        <div className="py-4 sm:px-5 sm:first:pl-0">
          <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">USDC settled</p>
          <p className="mt-1 font-mono text-2xl tracking-tight">${marketplaceStats.totalSettled.toFixed(3)}</p>
        </div>
        <div className="py-4 sm:px-5">
          <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Verified deliveries</p>
          <p className="mt-1 flex items-center gap-2 font-mono text-2xl tracking-tight">
            {marketplaceStats.fullPurchases.length}
            <CircleCheck size={18} className="text-primary" />
          </p>
        </div>
        <div className="py-4 sm:px-5">
          <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Buyer agents</p>
          <p className="mt-1 font-mono text-2xl tracking-tight">{marketplaceStats.uniqueBuyers}</p>
        </div>
        <div className="py-4 sm:px-5 sm:last:pr-0">
          <p className="text-xs uppercase tracking-[0.13em] text-muted-foreground">Seller reputation</p>
          <p className="mt-1 flex items-center gap-2 font-mono text-2xl tracking-tight">
            {marketplaceStats.approvalRate}%
            <ShieldCheck size={18} className="text-primary" />
          </p>
        </div>
      </section>

      <section className="mb-8 grid gap-5 border-b border-border/80 pb-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="border-l-2 border-primary pl-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Active verification policy</p>
          <p className="mt-2 text-sm font-medium">Excel/FP&amp;A narrated computer-use dataset · pt-BR</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            A buyer pays for a low-cost sample. The verifier must score narration,
            actions, completeness, and provenance above threshold before the full
            dataset can be purchased.
          </p>
        </div>
        <div className="flex items-start gap-3 border-l border-border/80 pl-4">
          <Sparkles size={17} className="mt-0.5 text-primary" />
          <div>
            <p className="text-sm font-medium">Reputation v1</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {marketplaceStats.fullPurchases.length} approved full{" "}
              {marketplaceStats.fullPurchases.length === 1 ? "delivery" : "deliveries"} from{" "}
              {marketplaceStats.samplePurchases.length} paid{" "}
              {marketplaceStats.samplePurchases.length === 1 ? "preview" : "previews"}.
            </p>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3 mb-4">
        <Input
          placeholder={
            activeTab === "payments"
              ? "Filter by receipt, buyer, or delivery..."
              : "Filter by tx hash, address, chain, or status..."
          }
          className="max-w-xs"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
        />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
          >
            <SelectTrigger size="sm" className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setFilter("");
          setPage(1);
          setSortField(null);
          setSortDirection("default");
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="payments">Settlements</TabsTrigger>
          <TabsTrigger value="withdrawals">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement receipt</TableHead>
                  <TableHead>Buyer agent</TableHead>
                  <TableHead>Delivery stage</TableHead>
                  <TableHead className="text-right">
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                      onClick={() => handleSort("amount")}
                    >
                      Amount (USDC)
                      <SortIcon
                        direction={sortField === "amount" ? sortDirection : "default"}
                      />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => handleSort("date")}
                    >
                      Date
                      <SortIcon direction={sortField === "date" ? sortDirection : "default"} />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPayments ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      <Loader2 size={16} className="animate-spin inline mr-2" />
                      Loading payments...
                    </TableCell>
                  </TableRow>
                ) : paginatedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-28 text-center text-muted-foreground"
                    >
                      <p>No settlements yet.</p>
                      <p className="mt-1 text-xs">
                        Click <span className="text-foreground">Run buyer agent</span> above
                        to create the first live purchase on Arc testnet.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPayments.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="font-mono text-xs">
                        {ev.gateway_tx ? (
                          <CopyableCell
                            value={ev.gateway_tx}
                            label={shortenHash(ev.gateway_tx, 6)}
                            href={
                              ev.gateway_tx.startsWith("0x")
                                ? `${EXPLORER_BASE}/tx/${ev.gateway_tx}`
                                : undefined
                            }
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <CopyableCell
                          value={ev.payer}
                          label={shortenHash(ev.payer)}
                          href={`${EXPLORER_BASE}/address/${ev.payer}`}
                        />
                      </TableCell>
                      <TableCell className="text-xs">
                        <DeliveryStageBadge endpoint={ev.endpoint} />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${ev.amount_usdc}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(ev.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="withdrawals">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors ml-auto"
                      onClick={() => handleSort("amount")}
                    >
                      Amount (USDC)
                      <SortIcon
                        direction={sortField === "amount" ? sortDirection : "default"}
                      />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      onClick={() => handleSort("date")}
                    >
                      Date
                      <SortIcon direction={sortField === "date" ? sortDirection : "default"} />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingWithdrawals ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      <Loader2 size={16} className="animate-spin inline mr-2" />
                      Loading withdrawals...
                    </TableCell>
                  </TableRow>
                ) : paginatedWithdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No withdrawals found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedWithdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono text-xs">
                        {w.tx_hash ? (
                          <CopyableCell
                            value={w.tx_hash}
                            label={shortenHash(w.tx_hash, 6)}
                            href={
                              w.tx_hash.startsWith("0x")
                                ? `${EXPLORER_BASE}/tx/${w.tx_hash}`
                                : undefined
                            }
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <CopyableCell
                          value={w.destination_address}
                          label={shortenHash(w.destination_address)}
                          href={`${EXPLORER_BASE}/address/${w.destination_address}`}
                        />
                      </TableCell>
                      <TableCell className="text-xs">
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {w.destination_chain}
                        </code>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={w.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${w.amount_usdc}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(w.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Shared pagination controls */}
      {!loading && activeData.length > 0 && (
        <div className="flex items-center justify-between border-x border-b rounded-b-lg px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            {activeData.length} {activeTab === "payments" ? "settlement" : "payout"}{activeData.length !== 1 ? "s" : ""} total
          </span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Page {clampedPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={clampedPage <= 1}
              className="inline-flex items-center justify-center rounded-md border h-8 w-8 disabled:opacity-30 hover:bg-muted transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={clampedPage >= totalPages}
              className="inline-flex items-center justify-center rounded-md border h-8 w-8 disabled:opacity-30 hover:bg-muted transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
