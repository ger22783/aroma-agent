import { buildGenerationPromptContext, SYSTEM_PROMPT } from './prompt';
import type { SelectionPlan } from './materialSelector';
import type { ChatMessage, FormulaResponse } from './types';

type LlmGenerateResponse = {
  mode: 'llm';
  replyText: string;
  formula: FormulaResponse;
};

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

    try {
      return JSON.parse(stripped);
    } catch {
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      const candidate = jsonMatch ? jsonMatch[0] : stripped;
      return JSON.parse(candidate);
    }
  }
}

export async function generateWithLLM(
  messages: ChatMessage[],
  plan?: SelectionPlan
): Promise<LlmGenerateResponse | null> {
  const apiKey = getEnv('OPENAI_API_KEY');
  const baseUrl = normalizeBaseUrl(getEnv('OPENAI_BASE_URL') || 'https://api.openai.com/v1');
  const model = getEnv('OPENAI_MODEL') || 'gpt-4.1-mini';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const context = buildGenerationPromptContext(plan);

  if (!apiKey) {
    throw new Error('运行环境缺少 OPENAI_API_KEY');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_tokens: 3200,
        temperature: 0.55,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(context ? [{ role: 'system' as const, content: context }] : []),
          ...messages.map((message) => ({
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: message.content
          }))
        ]
      })
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('LLM 请求超过 8 秒，已切换到本地规则。');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`LLM 请求失败: ${response.status} ${rawText}`);
  }

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`LLM 返回了非 JSON 内容: ${rawText.slice(0, 300)}`);
  }

  const choice = data?.choices?.[0];
  if (choice?.finish_reason === 'length') {
    throw new Error('LLM 输出被截断，请重试或缩短请求。');
  }

  const rawContent = choice?.message?.content || choice?.message?.reasoning_content || '';
  if (!rawContent) {
    throw new Error(`LLM 返回内容为空: ${rawText.slice(0, 300)}`);
  }

  let parsed: any;
  try {
    parsed = extractJsonObject(rawContent);
  } catch {
    throw new Error(`LLM 返回非 JSON: ${String(rawContent).slice(0, 300)}`);
  }

  return {
    mode: 'llm',
    replyText: String(parsed.replyText || ''),
    formula: parsed.formula
  };
}
