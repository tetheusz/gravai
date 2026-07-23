/**
 * Client-safe marketplace listing definition (no Node-only imports).
 * Used by the seller API, the verifier, and the dashboard UI.
 */
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
  pricing: {
    sampleUsdc: "0.001",
    fullUsdc: "0.05",
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

export type GravaiJob = typeof GRAVAI_JOB;
