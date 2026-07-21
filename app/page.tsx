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

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Orbit,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { login } from "./actions";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
    };
  }
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function Home() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);

  async function connectWallet() {
    setWalletError(null);
    if (!window.ethereum) {
      setWalletError("Instale uma carteira EVM, como MetaMask, para conectar.");
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts[0]) setWallet(accounts[0]);
    } catch {
      setWalletError("A conexão foi cancelada ou não pôde ser concluída.");
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleLogin(formData: FormData) {
    setLoginPending(true);
    setLoginError(null);
    const result = await login(formData);
    if (result?.error) {
      setLoginError(result.error);
      setLoginPending(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080d16] text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[680px] overflow-hidden">
        <div className="landing-orb landing-orb-one" />
        <div className="landing-orb landing-orb-two" />
        <div className="landing-grid absolute inset-0 opacity-40" />
      </div>

      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#b7ff5a] text-[#07110b] shadow-[0_0_30px_rgba(183,255,90,0.25)]">
            <Orbit size={22} strokeWidth={2.4} />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-tight">GravAI</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.19em] text-slate-500">
              data commerce
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <a
            href="#how-it-works"
            className="hidden text-sm text-slate-400 transition-colors hover:text-white sm:block"
          >
            Como funciona
          </a>
          <button
            onClick={() => setShowLogin(true)}
            className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:text-white sm:block"
          >
            Operador
          </button>
          <button
            onClick={connectWallet}
            className="inline-flex items-center gap-2 rounded-full bg-[#b7ff5a] px-4 py-2.5 text-sm font-semibold text-[#07110b] transition hover:scale-[1.02] hover:bg-[#c7ff7c] active:scale-[0.98]"
          >
            <Wallet size={16} />
            {isConnecting
              ? "Conectando…"
              : wallet
                ? shortAddress(wallet)
                : "Conectar carteira"}
          </button>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-12 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:px-8 lg:pb-32 lg:pt-24">
        <div className="landing-reveal">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b7ff5a]/20 bg-[#b7ff5a]/[0.07] px-3 py-1.5 text-xs font-medium text-[#ceff91]">
            <span className="size-1.5 animate-pulse rounded-full bg-[#b7ff5a]" />
            Built on Arc · USDC-native
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
            Dados humanos.
            <br />
            Comprados por <span className="text-[#b7ff5a]">agentes.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
            GravAI permite que agentes descubram, verifiquem e comprem
            demonstrações humanas para treinamento — com pagamento em USDC
            liberado somente após uma avaliação de qualidade.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Ver o fluxo autônomo <ArrowRight size={17} />
            </a>
            <a
              href="https://github.com/tetheusz/gravai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Explorar o código <ExternalLink size={15} />
            </a>
          </div>
          {walletError && (
            <p className="mt-4 text-sm text-[#ff9b9b]">{walletError}</p>
          )}

          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#b7ff5a]" />
              Proveniência SHA-256
            </span>
            <span className="inline-flex items-center gap-2">
              <CircleDollarSign size={16} className="text-[#b7ff5a]" />
              Nanopayments x402
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles size={16} className="text-[#b7ff5a]" />
              Verificação por agente
            </span>
          </div>
        </div>

        <div className="landing-reveal landing-reveal-delayed relative mx-auto w-full max-w-[560px]">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-[#b7ff5a]/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111925]/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#b7ff5a]" />
                <span className="text-xs font-medium text-slate-300">Autonomous purchase</span>
              </div>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.13em] text-slate-500">
                ARC TESTNET
              </span>
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#0b111b] p-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.13em] text-slate-500">Data brief</p>
                  <p className="mt-2 text-lg font-medium text-white">
                    Excel/FP&amp;A · pt-BR
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Narrated computer-use demonstration
                  </p>
                </div>
                <span className="rounded-xl bg-[#b7ff5a] px-3 py-2 font-mono text-sm font-semibold text-[#07110b]">
                  0.051 USDC
                </span>
              </div>

              <div className="mt-7 space-y-3">
                <FlowStep
                  index="01"
                  title="Preview adquirido"
                  detail="Sample · 0.001 USDC"
                  complete
                />
                <FlowStep
                  index="02"
                  title="Verificador aprova"
                  detail="Score 0.853 · rubric matched"
                  complete
                />
                <FlowStep
                  index="03"
                  title="Dataset liberado"
                  detail="Full delivery · 0.05 USDC"
                  active
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock3 size={14} className="text-[#b7ff5a]" />
                Settlement receipt
              </div>
              <span className="font-mono text-xs text-slate-300">f691…21df</span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="relative border-y border-white/[0.08] bg-white/[0.025]"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#b7ff5a]">
              Payment follows proof
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              A qualidade decide se o dinheiro se move.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <ProcessCard
              number="01"
              title="Sample"
              text="O agente comprador paga uma amostra barata e recebe ações, narração e hash de proveniência."
            />
            <ProcessCard
              number="02"
              title="Verify"
              text="O verificador aplica a rubrica de qualidade: contexto, ações, completude e utilidade."
            />
            <ProcessCard
              number="03"
              title="Settle"
              text="Aprovado? O agente compra o dataset completo. Reprovado? O pagamento não acontece."
            />
          </div>
        </div>
      </section>

      <section className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 px-6 py-16 sm:flex-row sm:items-end lg:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#b7ff5a]">
            Agentic data economy
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-white">
            Transforme trabalho humano em dados verificáveis para agentes.
          </h2>
        </div>
        <button
          onClick={connectWallet}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#b7ff5a]/30 bg-[#b7ff5a]/10 px-5 py-3 text-sm font-semibold text-[#d5ff9e] transition hover:bg-[#b7ff5a]/20"
        >
          <Wallet size={16} />
          {wallet ? `Carteira: ${shortAddress(wallet)}` : "Conectar carteira"}
        </button>
      </section>

      <footer className="border-t border-white/[0.08] px-6 py-6 text-xs text-slate-600 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>GravAI · Arc testnet prototype</span>
          <a
            href="https://testnet.arcscan.app"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-slate-300"
          >
            Arcscan
          </a>
        </div>
      </footer>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070d]/80 p-5 backdrop-blur-sm">
          <div className="landing-reveal relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#111925] p-6 shadow-2xl">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute right-5 top-5 text-slate-500 transition hover:text-white"
              aria-label="Fechar login"
            >
              <X size={18} />
            </button>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#b7ff5a]">
              Operator access
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Abrir dashboard
            </h2>
            <form action={handleLogin} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="admin@example.com"
                  className="w-full rounded-xl border border-white/10 bg-[#080d16] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#b7ff5a]/60"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-400">Senha</span>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••"
                  className="w-full rounded-xl border border-white/10 bg-[#080d16] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-[#b7ff5a]/60"
                />
              </label>
              {loginError && <p className="text-sm text-[#ff9b9b]">{loginError}</p>}
              <button
                type="submit"
                disabled={loginPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#b7ff5a] px-4 py-3 text-sm font-semibold text-[#07110b] transition hover:bg-[#c7ff7c] disabled:opacity-60"
              >
                {loginPending ? "Entrando…" : "Entrar"} <ChevronRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function FlowStep({
  index,
  title,
  detail,
  complete = false,
  active = false,
}: {
  index: string;
  title: string;
  detail: string;
  complete?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs ${
          complete || active
            ? "border-[#b7ff5a]/60 bg-[#b7ff5a]/10 text-[#cfff92]"
            : "border-white/10 text-slate-500"
        }`}
      >
        {complete ? <Check size={14} /> : index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
      {active && <span className="size-2 rounded-full bg-[#b7ff5a] shadow-[0_0_12px_#b7ff5a]" />}
    </div>
  );
}

function ProcessCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article className="border-t border-white/10 pt-5 transition-transform duration-300 hover:-translate-y-1">
      <span className="font-mono text-xs text-[#b7ff5a]">{number}</span>
      <h3 className="mt-5 text-xl font-medium text-white">{title}</h3>
      <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">{text}</p>
    </article>
  );
}
