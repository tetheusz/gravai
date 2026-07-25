/**
 * GravAI verifier smoke test — proves the quality gate without network calls.
 * Standard threshold (0.7) approves the fixture; strict (0.95) withholds.
 *
 * Usage: npm run test:verifier
 */
import { verifyWithHeuristic, type SamplePayload } from "../lib/verifier.ts";

const fixture: SamplePayload = {
  kind: "sample",
  job: {
    title: "Excel/FP&A narrated demonstration (pt-BR)",
    language: "pt-BR",
    brief: {
      task: "6h of narrated Excel/FP&A workflows for computer-use agent training",
      successCriteria: [
        "Screen recording with mouse/keyboard actions",
        "Think-aloud narration in Portuguese",
        "Clear task objective and completion state",
      ],
    },
    rubric: [
      { id: "narration", weight: 0.3, description: "Narration" },
      { id: "actions", weight: 0.3, description: "Actions" },
      { id: "completeness", weight: 0.25, description: "Completeness" },
      { id: "quality", weight: 0.15, description: "Quality" },
    ],
  },
  clip: {
    clipId: "clip_01_cashflow_13w",
    objective: "Build a 13-week cash flow forecast",
    narrationExcerpt:
      "Vou montar o fluxo de caixa de 13 semanas. Começo pelos saldos bancários da semana zero, depois projeto recebíveis e contas a pagar. Cada linha precisa bater com o extrato.",
    actionLog: [
      { t: 2.1, type: "click" },
      { t: 8.4, type: "type" },
      { t: 22.0, type: "formula" },
      { t: 95.2, type: "pivot" },
      { t: 168.0, type: "save" },
    ],
    endState: { workbook: "cashflow_13w.xlsx" },
  },
  provenance: {
    contentHash: "sha256:c49835b1b1f549b448139ba6acdaaa834d768935b587be261d0c359c85f0d2f8",
  },
};

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const standard = verifyWithHeuristic(fixture, 0.7);
assert(standard.approved === true, `Expected standard gate to approve, got score ${standard.score}`);
assert(standard.score >= 0.7, `Expected score >= 0.7, got ${standard.score}`);

const strict = verifyWithHeuristic(fixture, 0.95);
assert(strict.approved === false, `Expected strict gate to reject, got score ${strict.score}`);
assert(strict.score < 0.95, `Expected score < 0.95, got ${strict.score}`);

const weak: SamplePayload = {
  ...fixture,
  clip: {
    ...fixture.clip,
    narrationExcerpt: "ok",
    actionLog: [],
    endState: null as unknown as SamplePayload["clip"]["endState"],
  },
};
const weakVerdict = verifyWithHeuristic(weak, 0.7);
assert(weakVerdict.approved === false, "Weak sample should fail standard gate");

console.log("test:verifier OK");
console.log(`  standard: approved=${standard.approved} score=${standard.score}`);
console.log(`  strict:   approved=${strict.approved} score=${strict.score}`);
console.log(`  weak:     approved=${weakVerdict.approved} score=${weakVerdict.score}`);
