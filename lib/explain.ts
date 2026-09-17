import { boothMaterials } from '@/data/ingredients';
import type { Lang } from './i18n';
import type { FormulaResponse } from './types';

const explanationTriggers = [
  '为什么',
  '为啥',
  '原因',
  '作用',
  '干嘛',
  '有什么用',
  '为什么要加',
  'why',
  'reason',
  'purpose'
];

function allNotes(formula: FormulaResponse, lang: Lang) {
  return [
    ...formula.formula.topNotes.map((item) => ({ ...item, role: lang === 'en' ? 'top note' : '前调' })),
    ...formula.formula.heartNotes.map((item) => ({ ...item, role: lang === 'en' ? 'heart note' : '中调' })),
    ...formula.formula.baseNotes.map((item) => ({ ...item, role: lang === 'en' ? 'base note' : '后调' }))
  ];
}

export function isExplanationQuestion(message: string) {
  const text = message.toLowerCase();
  return explanationTriggers.some((trigger) => text.includes(trigger));
}

export function buildFormulaExplanation(message: string, formula: FormulaResponse, lang: Lang = 'zh') {
  const notes = allNotes(formula, lang);
  const mentionedNote = notes.find((note) => message.includes(note.name));
  const target = mentionedNote || notes.find((note) => {
    const material = boothMaterials.find((item) => item.nameZh === note.name);
    return material ? message.toLowerCase().includes(material.nameEn.toLowerCase()) : false;
  });

  if (target) {
    const material = boothMaterials.find((item) => item.nameZh === target.name || item.nameEn === target.name);
    if (lang === 'en') {
      const name = material?.nameEn || target.name;
      return [
        `${name} is included to support the structure rather than dominate the blend. `,
        `At ${target.percentage}% in the ${target.role}, it helps shape the transition between the opening, heart, and drydown. `,
        'I have kept the current formula unchanged because this is an explanation request. Ask to replace it or make the scent fresher if you want a new version.'
      ].join('');
    }
    const family = material?.family || '当前香调';
    const description = material?.description || '它主要负责补足配方里的气味层次。';
    const moods = material?.moods?.slice(0, 3).join('、') || '整体氛围';

    return [
      `这里加入「${target.name}」不是为了单独突出它，而是让它在${target.role}里承担结构作用。`,
      `它属于${family}，在这版配方中占 ${target.percentage}%，主要贡献是：${description}`,
      `从闻感上，它会把整体往「${moods}」的方向推，让前中后调之间衔接得更自然。`,
      '所以这一步我不会改动你的配方，只解释它在当前版本里的作用；如果你想换掉它，可以直接说“不要这个”或“换成更清爽的”。'
    ].join('');
  }

  const style = formula.fragrancePositioning.style || (lang === 'en' ? 'this scent' : '这版香气');
  const noteSummary = notes.map((note) => `${note.role} ${note.name} ${note.percentage}%`).join('；');

  if (lang === 'en') {
    return [
      `The idea behind “${style}” is to define the mood and setting first, then give each note a clear role. `,
      `The current structure is: ${notes.map((note) => `${note.role} ${note.name} ${note.percentage}%`).join('; ')}. `,
      'Top notes make the first impression, heart notes define the character, and base notes provide stability and staying power. ',
      'I have kept the formula unchanged because you asked for an explanation.'
    ].join('');
  }

  return [
    `这版「${style}」的逻辑是先确定场景和情绪，再用前中后调分工把体验做完整。`,
    `当前结构是：${noteSummary}。`,
    '前调负责第一下闻到的印象，中调负责主体性格，后调负责稳定度和留香感。',
    '你现在问的是配方解释，所以我会保留上一版配方不变；只有当你明确说“更清爽、不要玫瑰、换一个”时，我才会重新调整配方。'
  ].join('');
}
