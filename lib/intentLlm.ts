import type { ScentFacets } from '@/data/ingredients';
import { analyzeIntent, type IntentProfile } from './intent';

type RawIntent = {
  desiredFacets?: Partial<Record<keyof ScentFacets, unknown>>;
  scenarios?: unknown;
  moods?: unknown;
  dislikes?: unknown;
  constraints?: unknown;
  explanationLike?: unknown;
};

const facetKeys: Array<keyof ScentFacets> = ['fresh', 'sweet', 'floral', 'woody', 'watery', 'warm'];

function getEnv(name: string) {
  return process.env[name]?.trim();
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

function extractJsonObject(content: string) {
  const text = content.trim();
  try {
    return JSON.parse(text);
  } catch {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const stripped = fenceMatch ? fenceMatch[1].trim() : text;
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : stripped);
  }
}

function clampFacet(value: unknown) {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(5, Math.round(number)));
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 6);
}

function normalizeIntent(raw: RawIntent, input: string, fallback: IntentProfile): IntentProfile {
  const desiredFacets = facetKeys.reduce((result, key) => {
    result[key] = clampFacet(raw.desiredFacets?.[key]);
    return result;
  }, {} as ScentFacets);

  if (Object.values(desiredFacets).every((value) => value === 0)) {
    desiredFacets.fresh = fallback.desiredFacets.fresh;
    desiredFacets.sweet = fallback.desiredFacets.sweet;
    desiredFacets.floral = fallback.desiredFacets.floral;
    desiredFacets.woody = fallback.desiredFacets.woody;
    desiredFacets.watery = fallback.desiredFacets.watery;
    desiredFacets.warm = fallback.desiredFacets.warm;
  }

  return {
    rawText: input,
    desiredFacets,
    scenarios: stringArray(raw.scenarios).length ? stringArray(raw.scenarios) : fallback.scenarios,
    moods: stringArray(raw.moods).length ? stringArray(raw.moods) : fallback.moods,
    dislikes: stringArray(raw.dislikes).length ? stringArray(raw.dislikes) : fallback.dislikes,
    constraints: stringArray(raw.constraints).length ? stringArray(raw.constraints) : fallback.constraints,
    explanationLike: typeof raw.explanationLike === 'boolean' ? raw.explanationLike : fallback.explanationLike
  };
}

export async function analyzeIntentWithLLM(input: string): Promise<IntentProfile> {
  const fallback = analyzeIntent(input);
  const apiKey = getEnv('OPENAI_API_KEY');
  if (!apiKey) return fallback;

  const baseUrl = normalizeBaseUrl(getEnv('OPENAI_BASE_URL') || 'https://api.openai.com/v1');
  const model = getEnv('OPENAI_MODEL') || 'gpt-4.1-mini';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        temperature: 0.1,
        thinking: { type: 'disabled' },
        reasoning_effort: 'none',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              '你是香水路演 Agent 的需求理解模块，只负责把用户自然语言解析成 JSON，不生成配方。',
              'facets 取值 0-5：fresh 清爽干净，sweet 甜感美食，floral 花香，woody 木质烟熏，watery 水感海风雨后，warm 温暖咖啡香草。',
              '要识别反向需求，例如“不甜”“不要奶茶感”“不要寺庙感”“别太浓”“不要玫瑰”。',
              'scenarios、moods、dislikes、constraints 用简短中文词组。不要编造原料名。',
              '只输出 JSON，结构为 {"desiredFacets":{"fresh":0,"sweet":0,"floral":0,"woody":0,"watery":0,"warm":0},"scenarios":[],"moods":[],"dislikes":[],"constraints":[],"explanationLike":false}'
            ].join('\n')
          },
          { role: 'user', content: input }
        ]
      })
    });

    if (!response.ok) return fallback;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    if (!content) return fallback;
    return normalizeIntent(extractJsonObject(content), input, fallback);
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}
