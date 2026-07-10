import { boothMaterials, type BoothMaterial, type NoteRole } from '@/data/ingredients';
import { analyzeIntent } from './intent';
import { selectMaterials, type SelectionPlan } from './materialSelector';
import type { BoothStep, FormulaResponse, NoteItem } from './types';

function distance(percentage: number): string {
  if (percentage >= 40) return '2-3cm';
  if (percentage >= 30) return '4-5cm';
  if (percentage >= 20) return '6-7cm';
  return '8-9cm';
}

function step(material: string, noteRole: BoothStep['noteRole'], percentage: number): BoothStep {
  const sprayDistance = distance(percentage);
  return {
    material,
    noteRole,
    percentage,
    distance: sprayDistance,
    waitSeconds: 10,
    instruction: `喷 1 下，距离 ${sprayDistance}，等待 10 秒`
  };
}

function notesToSteps(topNotes: NoteItem[], heartNotes: NoteItem[], baseNotes: NoteItem[]): BoothStep[] {
  return [
    ...topNotes.map((item) => step(item.name, 'top', item.percentage)),
    ...heartNotes.map((item) => step(item.name, 'heart', item.percentage)),
    ...baseNotes.map((item) => step(item.name, 'base', item.percentage))
  ];
}

function pickMaterial(plan: SelectionPlan, role: NoteRole, fallbackId: string, used: Set<string>) {
  const roleCandidates = role === 'top' ? plan.top : role === 'heart' ? plan.heart : plan.base;
  const candidate = roleCandidates.find((item) => !used.has(item.material.nameZh));
  const material = candidate?.material || boothMaterials.find((item) => item.id === fallbackId) || boothMaterials[0];
  used.add(material.nameZh);
  return material;
}

function clampUsage(material: BoothMaterial, desired: number) {
  const [min, max] = material.usageRange;
  return Math.max(min, Math.min(max, desired));
}

function buildNotes(plan: SelectionPlan) {
  const used = new Set<string>();
  const wantsSweet = plan.intent.desiredFacets.sweet >= 4 && !plan.intent.dislikes.includes('甜腻');
  const wantsWoody = plan.intent.desiredFacets.woody >= 4;
  const wantsWatery = plan.intent.desiredFacets.watery >= 4;

  const topA = pickMaterial(plan, 'top', wantsWatery ? 'sea-breeze-bell' : 'green-tea', used);
  const topB = pickMaterial(plan, 'top', 'japanese-citrus', used);
  const heartA = pickMaterial(plan, 'heart', wantsSweet ? 'osmanthus-oolong' : 'jasmine-floral-ring', used);
  const heartB = pickMaterial(plan, 'heart', wantsWatery ? 'watery-berry' : 'osmanthus-oolong', used);
  const baseA = pickMaterial(plan, 'base', wantsSweet ? 'french-vanilla' : wantsWoody ? 'smoky-agarwood' : 'desert-rose', used);

  let topNotes: NoteItem[] = [
    { name: topA.nameZh, percentage: clampUsage(topA, 22) },
    { name: topB.nameZh, percentage: clampUsage(topB, 18) }
  ];
  let heartNotes: NoteItem[] = [
    { name: heartA.nameZh, percentage: clampUsage(heartA, 28) }
  ];
  let baseNotes: NoteItem[] = [
    { name: baseA.nameZh, percentage: clampUsage(baseA, 24) }
  ];

  if (heartB.nameZh !== heartA.nameZh && topNotes.length + heartNotes.length + baseNotes.length < 5) {
    heartNotes.push({ name: heartB.nameZh, percentage: clampUsage(heartB, 8) });
  }

  const all = [...topNotes, ...heartNotes, ...baseNotes];
  const total = all.reduce((sum, item) => sum + item.percentage, 0);
  const delta = 100 - total;
  const target = heartNotes[0] || baseNotes[0] || topNotes[0];
  target.percentage += delta;

  topNotes = topNotes.filter((item) => item.percentage > 0);
  heartNotes = heartNotes.filter((item) => item.percentage > 0);
  baseNotes = baseNotes.filter((item) => item.percentage > 0);

  return { topNotes, heartNotes, baseNotes };
}

function roleText(materialName: string) {
  return boothMaterials.find((item) => item.nameZh === materialName)?.professionalRole || '负责补足香气结构。';
}

function buildFormula(plan: SelectionPlan): FormulaResponse {
  const notes = buildNotes(plan);
  const allNotes = [...notes.topNotes, ...notes.heartNotes, ...notes.baseNotes];
  const topNames = notes.topNotes.map((item) => item.name).join('和');
  const heartNames = notes.heartNotes.map((item) => item.name).join('和');
  const baseNames = notes.baseNotes.map((item) => item.name).join('和');
  const style = plan.intent.moods.includes('浪漫')
    ? '克制花香记忆款'
    : plan.intent.desiredFacets.watery >= 4
      ? '清透水感试香'
      : plan.intent.desiredFacets.warm >= 4
        ? '温暖沉稳氛围香'
        : '清爽花茶日常香';
  const keywords = [
    ...(plan.intent.moods.length ? plan.intent.moods.slice(0, 2) : ['清爽', '易接受']),
    ...(plan.intent.constraints.includes('低门槛') ? ['低门槛'] : ['有层次'])
  ].slice(0, 3);
  const scenarios = plan.intent.scenarios.length ? plan.intent.scenarios : ['路演体验', '日常试香'];

  return {
    fragrancePositioning: {
      style,
      keywords,
      suitableScenarios: scenarios
    },
    formula: notes,
    blendingSuggestion: {
      recommendedConcentration: `按前调、中调、后调顺序喷在同一张试香纸上，每种原料 1 下，每步等待 10 秒，最后自然晾干 2-3 分钟再评价。`
    },
    boothSteps: notesToSteps(notes.topNotes, notes.heartNotes, notes.baseNotes),
    finalEffect: {
      opening: `${topNames || '前调'}先给出第一印象，让香气开场更明亮、更容易接近。`,
      heart: `${heartNames || '中调'}负责主体性格，让香气从单一气味变成有主题的体验。`,
      drydown: `${baseNames || '后调'}负责收尾和稳定度，让试香纸晾干后仍有记忆点。`,
      sillage: allNotes.some((item) => item.percentage >= 35) ? '中等，适合展台近距离闻香' : '轻到中等，适合第一次体验',
      longevity: '体验卡约 3-6 小时，现场建议以晾干 2-3 分钟后的效果为准'
    },
    adjustments: {
      fresher: '想更清爽，下一轮提高绿茶、柑橘或海风类前调，降低香草、咖啡和厚重木质。',
      softer: '想更柔和，下一轮增加桂花乌龙或水影浆果，让边缘更圆润。',
      longerLasting: '想更持久，下一轮可以小幅提高乌木、玫瑰木质或香草类后调。'
    },
    safetyNote: '请喷在试香纸上，避开眼睛、口鼻和伤口；过敏者谨慎体验。'
  };
}

function buildReply(formula: FormulaResponse) {
  const firstMaterial = formula.formula.heartNotes[0]?.name || formula.formula.topNotes[0]?.name || formula.formula.baseNotes[0]?.name || '';

  return [
    `这版定位成「${formula.fragrancePositioning.style}」，关键词是${formula.fragrancePositioning.keywords.join('、')}，适合${formula.fragrancePositioning.suitableScenarios.join('、')}。`,
    `核心选材围绕${firstMaterial || '中调主体'}展开：${roleText(firstMaterial)}整体会先建立清晰第一印象，再过渡到主体气质，最后留下稳定的尾调记忆点。`,
    `下面的配方卡已经列出具体比例和步骤；如果想微调，可以直接说“更清爽”“更柔和”或“更持久”。`
  ].join('');
}

export async function generateFallback(input: string, plan?: SelectionPlan) {
  const selectionPlan = plan || selectMaterials(analyzeIntent(input));
  const formula = buildFormula(selectionPlan);

  return {
    mode: 'fallback' as const,
    replyText: buildReply(formula),
    formula
  };
}
