import { NextRequest, NextResponse } from 'next/server';
import { prepareGeneration, completeGeneration } from '@/lib/accounts/generation';
import { personalizeIntent, profileContext } from '@/lib/accounts/personalization';
import { failure } from '@/lib/accounts/http';
import { buildFormulaExplanation, isExplanationQuestion } from '@/lib/explain';
import { generateFallback } from '@/lib/generator';
import { analyzeIntentWithLLM } from '@/lib/intentLlm';
import { selectMaterials } from '@/lib/materialSelector';

import { sanitizeFormula } from '@/lib/types';
import { assertUsableFormula } from '@/lib/validation';




export async function POST(req: NextRequest) {
  try {
    const ctx = await prepareGeneration(req, 'booth');
    const { body, message, sessionId } = ctx;
    const lang = body.lang === 'en' ? 'en' : 'zh';
    const currentFormula = ctx.previous?.payload.formula ? sanitizeFormula(ctx.previous.payload.formula) : null;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }


    if (currentFormula && isExplanationQuestion(message)) {
      const response = {
        mode: 'fallback' as const,
        sessionId,
        replyText: buildFormulaExplanation(message, currentFormula, lang),
        formula: currentFormula
      };


      return await completeGeneration(ctx, response);
    }

    const intent = personalizeIntent(await analyzeIntentWithLLM(message, profileContext(ctx.answers)), ctx.answers);
    const selectionPlan = selectMaterials(intent);

    if (!currentFormula && isExplanationQuestion(message)) {
      const fallback = await generateFallback(message, selectionPlan, lang);
      const response = {
        mode: 'fallback' as const,
        sessionId,
        replyText: '这个问题更像是在追问上一版配方的原因。你可以先生成一张试香卡，或者告诉我你想问哪一种原料；有了具体配方后，我会解释每个原料为什么被加入，而不会擅自改配方。',
        formula: sanitizeFormula(fallback.formula)
      };


      return await completeGeneration(ctx, response);
    }

    const fallback = await generateFallback(message, selectionPlan, lang);
    const formula = sanitizeFormula(fallback.formula);
    assertUsableFormula(formula);
    const response = {
      mode: 'fallback' as const,
      sessionId,
      replyText: fallback.replyText,
      formula
    };


    return await completeGeneration(ctx, response);
  } catch (error) {
    return failure(error);
  }
}
