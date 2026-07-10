import { NextRequest, NextResponse } from 'next/server';
import { buildFormulaExplanation, isExplanationQuestion } from '@/lib/explain';
import { generateFallback } from '@/lib/generator';
import { analyzeIntentWithLLM } from '@/lib/intentLlm';
import { generateWithLLM } from '@/lib/llm';
import { selectMaterials } from '@/lib/materialSelector';
import { appendBoothRecord, createSessionId } from '@/lib/records';
import { sanitizeFormula } from '@/lib/types';
import { assertUsableFormula } from '@/lib/validation';
import type { ChatMessage } from '@/lib/types';

function normalizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item: any) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
    .map((item: any) => ({ role: item.role, content: item.content }));
}

async function recordGeneration(input: {
  sessionId: string;
  userInput: string;
  history: ChatMessage[];
  mode: 'llm' | 'fallback';
  replyText: string;
  formula: any;
}) {
  await appendBoothRecord({
    type: 'generation',
    sessionId: input.sessionId,
    userInput: input.userInput,
    history: input.history,
    mode: input.mode,
    replyText: input.replyText,
    formula: input.formula
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body?.message || '').trim();
    const sessionId = String(body?.sessionId || createSessionId());
    const currentFormula = body?.currentFormula ? sanitizeFormula(body.currentFormula) : null;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const messages: ChatMessage[] = [
      ...normalizeHistory(body?.history),
      { role: 'user', content: message }
    ];

    if (currentFormula && isExplanationQuestion(message)) {
      const response = {
        mode: 'fallback' as const,
        sessionId,
        replyText: buildFormulaExplanation(message, currentFormula),
        formula: currentFormula
      };

      await recordGeneration({
        sessionId,
        userInput: message,
        history: messages,
        mode: response.mode,
        replyText: response.replyText,
        formula: response.formula
      });

      return NextResponse.json(response);
    }

    const intent = await analyzeIntentWithLLM(message);
    const selectionPlan = selectMaterials(intent);

    if (!currentFormula && isExplanationQuestion(message)) {
      const fallback = await generateFallback(message, selectionPlan);
      const response = {
        mode: 'fallback' as const,
        sessionId,
        replyText: '这个问题更像是在追问上一版配方的原因。你可以先生成一张试香卡，或者告诉我你想问哪一种原料；有了具体配方后，我会解释每个原料为什么被加入，而不会擅自改配方。',
        formula: sanitizeFormula(fallback.formula)
      };

      await recordGeneration({
        sessionId,
        userInput: message,
        history: messages,
        mode: response.mode,
        replyText: response.replyText,
        formula: response.formula
      });

      return NextResponse.json(response);
    }

    try {
      const llmResult = await generateWithLLM(messages, selectionPlan);
      if (llmResult) {
        const formula = sanitizeFormula(llmResult.formula);
        assertUsableFormula(formula);
        const response = { ...llmResult, sessionId, formula };

        await recordGeneration({
          sessionId,
          userInput: message,
          history: messages,
          mode: response.mode,
          replyText: response.replyText,
          formula: response.formula
        });

        return NextResponse.json(response);
      }
    } catch (llmError) {
      const fallback = await generateFallback(message, selectionPlan);
      const formula = sanitizeFormula(fallback.formula);
      assertUsableFormula(formula);
      const response = {
        mode: 'fallback' as const,
        sessionId,
        replyText: fallback.replyText,
        formula,
        debug: llmError instanceof Error ? llmError.message : 'Unknown LLM error'
      };

      await recordGeneration({
        sessionId,
        userInput: message,
        history: messages,
        mode: response.mode,
        replyText: response.replyText,
        formula: response.formula
      });

      return NextResponse.json(response);
    }

    const fallback = await generateFallback(message, selectionPlan);
    const formula = sanitizeFormula(fallback.formula);
    assertUsableFormula(formula);
    const response = {
      mode: 'fallback' as const,
      sessionId,
      replyText: fallback.replyText,
      formula
    };

    await recordGeneration({
      sessionId,
      userInput: message,
      history: messages,
      mode: response.mode,
      replyText: response.replyText,
      formula: response.formula
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'failed to generate response'
    }, { status: 500 });
  }
}
