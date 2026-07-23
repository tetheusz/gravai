/**
 * GravAI verifier agent: scores a purchased sample against the job rubric.
 * Prefers Gemini (GEMINI_API_KEY), then OpenAI (OPENAI_API_KEY), and falls
 * back to a deterministic rubric evaluator so demos never stall on provider
 * errors.
 */

export type SamplePayload = {
  kind: string;
  job: {
    title: string;
    language: string;
    brief: { task: string; successCriteria: readonly string[] };
    rubric: ReadonlyArray<{ id: string; weight: number; description: string }>;
  };
  clip: {
    clipId: string;
    objective: string;
    narrationExcerpt: string;
    actionLog: unknown[];
    endState: unknown;
  };
  provenance: { contentHash: string };
};

export type Verdict = {
  approved: boolean;
  score: number;
  threshold: number;
  engine: "llm" | "heuristic";
  reasons: string[];
  rubricScores: Record<string, number>;
};

export function verifyWithHeuristic(
  sample: SamplePayload,
  threshold: number,
): Verdict {
  const rubricScores: Record<string, number> = {};
  const reasons: string[] = [];

  const hasNarration =
    typeof sample.clip.narrationExcerpt === "string" &&
    sample.clip.narrationExcerpt.length > 40;
  rubricScores.narration = hasNarration ? 0.9 : 0.2;
  reasons.push(
    hasNarration
      ? "Narration excerpt present and substantive"
      : "Narration missing or too short",
  );

  const actions = Array.isArray(sample.clip.actionLog)
    ? sample.clip.actionLog.length
    : 0;
  rubricScores.actions = actions >= 3 ? 0.85 : 0.3;
  reasons.push(`Action log has ${actions} steps`);

  const endStateOk = !!sample.clip.endState;
  rubricScores.completeness = endStateOk ? 0.8 : 0.2;
  reasons.push(endStateOk ? "End state documented" : "Missing end state");

  const langOk = sample.job.language?.toLowerCase().startsWith("pt");
  rubricScores.quality = langOk && sample.provenance?.contentHash ? 0.85 : 0.4;
  reasons.push(
    langOk
      ? `Language ${sample.job.language}; provenance hash present`
      : "Language/provenance weak",
  );

  let score = 0;
  for (const r of sample.job.rubric) {
    score += (rubricScores[r.id] ?? 0.5) * r.weight;
  }
  score = Number(score.toFixed(3));

  return {
    approved: score >= threshold,
    score,
    threshold,
    engine: "heuristic",
    reasons,
    rubricScores,
  };
}

type LlmResult = {
  score?: number;
  reasons?: string[];
  rubricScores?: Record<string, number>;
};

const VERIFIER_INSTRUCTIONS = `You are GravAI's verifier agent. Score a human computer-use sample against the rubric.
Return ONLY JSON: {"score":number,"reasons":string[],"rubricScores":{id:number}}
score is 0..1 weighted by rubric weights. Keep reasons short (max 4 items).`;

function buildEvaluationInput(sample: SamplePayload): string {
  return JSON.stringify({
    brief: sample.job.brief,
    rubric: sample.job.rubric,
    clip: sample.clip,
    provenance: sample.provenance,
  });
}

function toVerdict(parsed: LlmResult, threshold: number): Verdict {
  const score = Number(parsed.score ?? 0);
  return {
    // Approval is always decided server-side against the requested threshold.
    approved: score >= threshold,
    score: Number(score.toFixed(3)),
    threshold,
    engine: "llm",
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
    rubricScores: parsed.rubricScores ?? {},
  };
}

async function verifyWithGemini(
  sample: SamplePayload,
  threshold: number,
  apiKey: string,
): Promise<Verdict | null> {
  const model = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: VERIFIER_INSTRUCTIONS }],
          },
          contents: [
            { role: "user", parts: [{ text: buildEvaluationInput(sample) }] },
          ],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (!res.ok) return null;

    const body = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const raw = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return toVerdict(JSON.parse(raw) as LlmResult, threshold);
  } catch {
    return null;
  }
}

async function verifyWithOpenAi(
  sample: SamplePayload,
  threshold: number,
  apiKey: string,
): Promise<Verdict | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: VERIFIER_INSTRUCTIONS },
          { role: "user", content: buildEvaluationInput(sample) },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return null;

    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = body.choices?.[0]?.message?.content ?? "{}";
    return toVerdict(JSON.parse(raw) as LlmResult, threshold);
  } catch {
    return null;
  }
}

export async function verifySample(
  sample: SamplePayload,
  threshold: number,
): Promise<Verdict> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const verdict = await verifyWithGemini(sample, threshold, geminiKey);
    if (verdict) return verdict;
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && !openAiKey.includes("your-openai")) {
    const verdict = await verifyWithOpenAi(sample, threshold, openAiKey);
    if (verdict) return verdict;
  }

  return verifyWithHeuristic(sample, threshold);
}
