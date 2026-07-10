export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type NoteItem = {
  name: string;
  percentage: number;
};

export type BoothStep = {
  material: string;
  noteRole: 'top' | 'heart' | 'base';
  percentage: number;
  distance: string;
  waitSeconds: number;
  instruction: string;
};

export type FormulaResponse = {
  fragrancePositioning: {
    style: string;
    keywords: string[];
    suitableScenarios: string[];
  };
  formula: {
    topNotes: NoteItem[];
    heartNotes: NoteItem[];
    baseNotes: NoteItem[];
  };
  blendingSuggestion: {
    recommendedConcentration: string;
    targetVolumeMl?: number;
    fragranceConcentrateMl?: number;
    alcoholMl?: number;
    solventMl?: number;
    maceration?: string;
  };
  boothSteps: BoothStep[];
  finalEffect: {
    opening: string;
    heart: string;
    drydown: string;
    sillage: string;
    longevity: string;
  };
  adjustments?: {
    fresher: string;
    softer: string;
    longerLasting: string;
  };
  safetyNote: string;
  rawText?: string;
};

export type GenerateResponse = {
  mode: 'llm' | 'fallback';
  sessionId: string;
  replyText: string;
  formula: FormulaResponse;
};

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function sanitizeNotes(value: unknown): NoteItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item: any) => ({
    name: toStringValue(item?.name),
    percentage: toNumber(item?.percentage)
  })).filter((item) => item.name);
}

function sanitizeBoothSteps(value: unknown): BoothStep[] {
  if (!Array.isArray(value)) return [];
  return value.map((item: any) => ({
    material: toStringValue(item?.material),
    noteRole: item?.noteRole === 'heart' || item?.noteRole === 'base' ? item.noteRole : 'top',
    percentage: toNumber(item?.percentage),
    distance: toStringValue(item?.distance),
    waitSeconds: toNumber(item?.waitSeconds),
    instruction: toStringValue(item?.instruction)
  })).filter((item) => item.material);
}

export function sanitizeFormula(raw: any): FormulaResponse {
  const pos = raw?.fragrancePositioning || {};
  const formula = raw?.formula || {};
  const blend = raw?.blendingSuggestion || {};
  const effect = raw?.finalEffect || {};
  const adjustments = raw?.adjustments;

  return {
    fragrancePositioning: {
      style: toStringValue(pos.style),
      keywords: toStringArray(pos.keywords),
      suitableScenarios: toStringArray(pos.suitableScenarios)
    },
    formula: {
      topNotes: sanitizeNotes(formula.topNotes),
      heartNotes: sanitizeNotes(formula.heartNotes),
      baseNotes: sanitizeNotes(formula.baseNotes)
    },
    blendingSuggestion: {
      recommendedConcentration: toStringValue(blend.recommendedConcentration),
      targetVolumeMl: toNumber(blend.targetVolumeMl) || undefined,
      fragranceConcentrateMl: toNumber(blend.fragranceConcentrateMl) || undefined,
      alcoholMl: toNumber(blend.alcoholMl) || undefined,
      solventMl: toNumber(blend.solventMl) || undefined,
      maceration: toStringValue(blend.maceration) || undefined
    },
    boothSteps: sanitizeBoothSteps(raw?.boothSteps),
    finalEffect: {
      opening: toStringValue(effect.opening),
      heart: toStringValue(effect.heart),
      drydown: toStringValue(effect.drydown),
      sillage: toStringValue(effect.sillage),
      longevity: toStringValue(effect.longevity)
    },
    adjustments: adjustments ? {
      fresher: toStringValue(adjustments.fresher),
      softer: toStringValue(adjustments.softer),
      longerLasting: toStringValue(adjustments.longerLasting)
    } : undefined,
    safetyNote: toStringValue(raw?.safetyNote),
    rawText: toStringValue(raw?.rawText) || undefined
  };
}
