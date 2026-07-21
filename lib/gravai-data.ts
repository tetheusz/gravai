import { createHash } from "node:crypto";

/** Demo delivery: Excel/FP&A computer-use sample (pt-BR). Replace with real upload later. */
export const GRAVAI_JOB = {
  id: "job_excel_fpa_ptbr_v1",
  title: "Excel/FP&A narrated demonstration (pt-BR)",
  domain: "excel-fpa",
  language: "pt-BR",
  seller: {
    id: "seller_demo_01",
    displayName: "GravAI Pilot Seller",
    region: "BR",
  },
  brief: {
    task: "6h of narrated Excel/FP&A workflows for computer-use agent training",
    tools: ["Excel", "Power Query", "Pivot Tables"],
    successCriteria: [
      "Screen recording with mouse/keyboard actions",
      "Think-aloud narration in Portuguese",
      "Clear task objective and completion state",
    ],
  },
  rubric: [
    {
      id: "narration",
      weight: 0.3,
      description: "Narration is continuous, in pt-BR, and explains intent",
    },
    {
      id: "actions",
      weight: 0.3,
      description: "Mouse/keyboard actions match the narrated steps",
    },
    {
      id: "completeness",
      weight: 0.25,
      description: "Task reaches a verifiable end state (formula/result present)",
    },
    {
      id: "quality",
      weight: 0.15,
      description: "Recording is usable (readable UI, no long idle gaps)",
    },
  ],
} as const;

const SAMPLE_CLIP = {
  clipId: "clip_01_cashflow_13w",
  durationSec: 180,
  objective: "Build a 13-week cash flow forecast from bank balances and AP/AR",
  narrationExcerpt:
    "Vou montar o fluxo de caixa de 13 semanas. Começo pelos saldos bancários da semana zero, depois projeto recebíveis e contas a pagar. Cada linha precisa bater com o extrato.",
  actionLog: [
    { t: 2.1, type: "click", target: "Sheet1!A1" },
    { t: 8.4, type: "type", value: "Semana 0" },
    { t: 22.0, type: "formula", value: "=B2-B3+B4" },
    { t: 95.2, type: "pivot", target: "Insert > PivotTable" },
    { t: 168.0, type: "save", target: "cashflow_13w.xlsx" },
  ],
  endState: {
    workbook: "cashflow_13w.xlsx",
    sheets: ["Inputs", "Forecast", "Dashboard"],
    keyResult: "Ending cash week 13 = R$ 184.200",
  },
} as const;

const FULL_DATASET = {
  ...SAMPLE_CLIP,
  clips: [
    SAMPLE_CLIP,
    {
      clipId: "clip_02_budget_scenarios",
      durationSec: 240,
      objective: "Annual budget with base/upside/downside scenarios",
      narrationExcerpt:
        "Agora crio três cenários no orçamento anual. Uso uma tabela de premissas e o gerenciador de cenários do Excel.",
      actionLog: [
        { t: 5.0, type: "click", target: "Premissas!B2" },
        { t: 40.0, type: "scenario", value: "base" },
        { t: 110.0, type: "scenario", value: "downside" },
      ],
      endState: {
        workbook: "budget_2026.xlsx",
        sheets: ["Premissas", "P&L", "Cenários"],
        keyResult: "EBITDA base = R$ 2.4M",
      },
    },
    {
      clipId: "clip_03_aging_ap",
      durationSec: 150,
      objective: "Accounts payable aging report with conditional formatting",
      narrationExcerpt:
        "Monto o aging de contas a pagar em 0-30, 31-60, 61-90 e 90+. Destaco atrasos críticos em vermelho.",
      actionLog: [
        { t: 12.0, type: "formula", value: '=IF(TODAY()-E2>90,"90+","")' },
        { t: 80.0, type: "format", value: "conditional red >90" },
      ],
      endState: {
        workbook: "ap_aging.xlsx",
        sheets: ["Aging"],
        keyResult: "90+ bucket = R$ 42.800",
      },
    },
  ],
  totalDurationSec: 570,
  format: "computer-use-v1",
} as const;

function sha256(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildSampleDelivery() {
  const content = {
    kind: "sample" as const,
    job: GRAVAI_JOB,
    clip: SAMPLE_CLIP,
    generatedAt: new Date().toISOString(),
  };
  const contentHash = sha256({ job: GRAVAI_JOB, clip: SAMPLE_CLIP });
  return {
    ...content,
    provenance: {
      contentHash: `sha256:${contentHash}`,
      scheme: "sha256-json-canonical-demo",
      note: "Hash of job+clip payload for on-chain / off-chain provenance",
    },
  };
}

export function buildFullDelivery() {
  const content = {
    kind: "dataset-full" as const,
    job: GRAVAI_JOB,
    dataset: FULL_DATASET,
    generatedAt: new Date().toISOString(),
  };
  const contentHash = sha256({ job: GRAVAI_JOB, dataset: FULL_DATASET });
  return {
    ...content,
    provenance: {
      contentHash: `sha256:${contentHash}`,
      scheme: "sha256-json-canonical-demo",
      note: "Hash of job+full dataset payload for provenance",
    },
  };
}
