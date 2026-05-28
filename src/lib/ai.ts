import type { Analysis } from "../types";

const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const LOVABLE_MODEL = "google/gemini-3-flash-preview";
const OPENAI_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `You are an elite technical recruiter and ATS (Applicant Tracking System) expert.
You critique resumes against job descriptions with the rigor of a hiring manager at a top tech company.

Evaluate, with concrete reasoning:
- ATS compatibility (parseability, formatting, section structure, keyword density)
- Resume clarity and conciseness
- Keyword optimization vs the target job description
- Missing skills and missing keywords
- Strengths (what genuinely impresses)
- Weaknesses (what would cost the candidate an interview)
- Bullet point quality and action-verb strength
- Formatting suggestions
- Overall job-description match

Tone: professional, direct, recruiter-like. No fluff. No hedging. Every point must be specific
and actionable. Never invent facts about the candidate that aren't in the resume.

Return ONLY valid JSON matching this exact TypeScript shape — no markdown, no commentary:

{
  "overall": number,           // 0-100 overall resume score for this role
  "ats": number,               // 0-100 ATS compatibility score
  "skillMatch": number,        // 0-100 percentage of JD skills matched
  "strengths": string[],       // 3-5 concrete strengths
  "weaknesses": string[],      // 3-5 concrete weaknesses with WHY they matter
  "missingKeywords": string[], // up to 12 high-signal keywords from the JD missing from the resume
  "improvedBullets": [         // 3 rewrites of weak bullets from the resume
    { "before": string, "after": string }
  ]
}`;

function buildUserPrompt(resume: string, jd: string) {
  return `Analyze the following resume against the job description.

=== RESUME ===
${resume.trim()}

=== JOB DESCRIPTION ===
${jd.trim()}

Return the JSON object only.`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Model did not return valid JSON.");
  }
}

function coerceAnalysis(raw: any): Analysis {
  const clamp = (n: unknown) =>
    Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String).filter(Boolean) : [];
  const bullets = Array.isArray(raw?.improvedBullets)
    ? raw.improvedBullets
        .map((b: any) => ({
          before: String(b?.before ?? "").trim(),
          after: String(b?.after ?? "").trim(),
        }))
        .filter((b: { before: string; after: string }) => b.before && b.after)
    : [];
  return {
    overall: clamp(raw?.overall),
    ats: clamp(raw?.ats),
    skillMatch: clamp(raw?.skillMatch),
    strengths: arr(raw?.strengths).slice(0, 5),
    weaknesses: arr(raw?.weaknesses).slice(0, 5),
    missingKeywords: arr(raw?.missingKeywords).slice(0, 12),
    improvedBullets: bullets.slice(0, 3),
  };
}

export async function analyzeWithAI(
  resume: string,
  jd: string,
  apiKey: string,
  model?: string,
): Promise<Analysis> {
  const isOpenAI = /^sk-/.test(apiKey) && !/^sk-lov/i.test(apiKey);
  const url = isOpenAI ? OPENAI_URL : LOVABLE_URL;
  const chosenModel = model ?? (isOpenAI ? OPENAI_MODEL : LOVABLE_MODEL);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isOpenAI) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else {
    headers["Lovable-API-Key"] = apiKey;
    headers["X-Lovable-AIG-SDK"] = "ratemyresumeai-web";
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
      model: chosenModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(resume, jd) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      }),
    });
  } catch (e: any) {
    throw new Error(
      `Network error reaching ${isOpenAI ? "OpenAI" : "Lovable AI"}. ` +
      `Check the key type, network, or browser extensions blocking the request.`,
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Invalid API key.");
    if (res.status === 402) throw new Error("AI credits exhausted on this key.");
    if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
    throw new Error(`AI request failed (${res.status}): ${body.slice(0, 160)}`);
  }

  const data = await res.json();
  const content: string =
    data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? "";
  if (!content) throw new Error("Empty AI response.");
  return coerceAnalysis(extractJson(content));
}