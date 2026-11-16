import { GoogleGenerativeAI } from "@google/generative-ai"
import { GEMINI_MODEL, generateGeminiJson } from "@/lib/ai/gemini"
import type { AnalyticsPayload, ExecutiveSummary } from "./types"
import { buildAnalyticsBrief, buildRuleBasedSummary } from "./summary"

const ANALYTICS_SYSTEM_INSTRUCTION = `You are a production analyst for an operations plant.
Your task is to write an Executive Summary for the official production report.

ABSOLUTE RULES:
- Use ONLY the exact numbers provided in the data. DO NOT invent, estimate, or modify any numbers.
- Write in formal, concise, and professional English.
- Be clear and concise. Every sentence must deliver operational value, no filler.
- If certain information is missing in the data, do not mention it.
- State operational implications, not merely repeating numbers.
- In "kadarIkutKategori" / category rates, NEVER report a rate for a category where "bolehDibanding" is false (unit mismatch).
- Form completion percentage is the rate of forms completed by operators, NOT product quality or compliance rate.

Reply ONLY with valid JSON in this structure:
{
  "headline": "one concise sentence summarizing this period",
  "overview": ["3 to 4 sentences providing an overview"],
  "findings": ["3 to 5 key findings"],
  "risks": ["2 to 4 operational risks or issues"],
  "recommendations": ["3 to 4 actionable recommendations"]
}`

async function generateAnalyticsWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === "your-gemini-api-key") throw new Error("Gemini API key is not configured")

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json" },
    systemInstruction: ANALYTICS_SYSTEM_INSTRUCTION,
  })

  return generateGeminiJson<Record<string, unknown>>(async () => {
    const result = await model.generateContent(prompt)
    return result.response.text()
  })
}

/**
 * Executive summary for the generated PDF report.
 * Gemini generates the summary, while the deterministic rule-based summary keeps
 * report generation available when AI is unavailable.
 */
export async function generateExecutiveSummary(data: AnalyticsPayload, useAi: boolean): Promise<ExecutiveSummary> {
  const fallback = buildRuleBasedSummary(data)
  if (!useAi) return fallback

  const brief = buildAnalyticsBrief(data)
  const prompt = `Berikut data pengeluaran sebenar dalam format JSON. Hasilkan Executive Summary.\n\n${JSON.stringify(brief)}`
  let parsed: Record<string, unknown> | undefined

  try {
    parsed = await generateAnalyticsWithGemini(prompt)
  } catch (error) {
    console.error("Executive summary AI generation failed, using rule-based fallback:", error instanceof Error ? error.message : error)
    return fallback
  }

  const asList = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter(item => typeof item === "string" && item.trim() !== "") : []

  const summary: ExecutiveSummary = {
    headline: typeof parsed.headline === "string" && parsed.headline.trim() ? parsed.headline : fallback.headline,
    overview: asList(parsed.overview),
    findings: asList(parsed.findings),
    risks: asList(parsed.risks),
    recommendations: asList(parsed.recommendations),
    source: "ai",
  }

  if (summary.overview.length === 0 && summary.findings.length === 0) return fallback
  if (summary.risks.length === 0) summary.risks = fallback.risks
  if (summary.recommendations.length === 0) summary.recommendations = fallback.recommendations

  return summary
}
