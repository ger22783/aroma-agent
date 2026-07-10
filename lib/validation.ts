import { boothMaterials } from '@/data/ingredients';
import type { FormulaResponse } from './types';

const materialByName = new Map(boothMaterials.map((item) => [item.nameZh, item]));
const allowedMaterialNames = new Set(boothMaterials.map((item) => item.nameZh));
const mojibakeMarkers = ['锟', '閿', '脙', '脗', '娑', '棣?', '鐠', '�'];

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
  return [];
}

function allNotes(formula: FormulaResponse) {
  return [
    ...formula.formula.topNotes.map((item) => ({ ...item, role: 'top' as const })),
    ...formula.formula.heartNotes.map((item) => ({ ...item, role: 'heart' as const })),
    ...formula.formula.baseNotes.map((item) => ({ ...item, role: 'base' as const }))
  ];
}

function assertDistance(percentage: number, distance: string) {
  const expected = percentage >= 40 ? '2-3cm' : percentage >= 30 ? '4-5cm' : percentage >= 20 ? '6-7cm' : '8-9cm';
  if (distance !== expected) {
    throw new Error(`喷香距离不匹配：${percentage}% 应为 ${expected}`);
  }
}

export function assertUsableFormula(formula: FormulaResponse) {
  const text = collectStrings(formula).join('\n');
  if (mojibakeMarkers.some((marker) => text.includes(marker))) {
    throw new Error('LLM 返回内容疑似乱码，已切换到本地规则。');
  }

  const notes = allNotes(formula);
  if (notes.length < 3 || notes.length > 5) {
    throw new Error('配方必须包含 3-5 种原料。');
  }

  const uniqueNames = new Set(notes.map((item) => item.name));
  if (uniqueNames.size !== notes.length) {
    throw new Error('配方中存在重复原料。');
  }

  const total = notes.reduce((sum, item) => sum + item.percentage, 0);
  if (total !== 100) {
    throw new Error(`配方比例总和必须为 100，目前为 ${total}。`);
  }

  notes.forEach((note) => {
    const material = materialByName.get(note.name);
    if (!material || !allowedMaterialNames.has(note.name)) {
      throw new Error('LLM 返回了数据库外原料，已切换到本地规则。');
    }
    if (!material.noteRoles.includes(note.role)) {
      throw new Error(`${note.name} 不适合作为 ${note.role} 使用。`);
    }
    if (note.percentage <= 0 || note.percentage > 60) {
      throw new Error(`${note.name} 的比例不合理。`);
    }
  });

  if (formula.boothSteps.length !== notes.length) {
    throw new Error('现场操作步骤数量必须与配方原料数量一致。');
  }

  const noteKey = new Set(notes.map((item) => `${item.name}:${item.role}:${item.percentage}`));
  formula.boothSteps.forEach((item) => {
    if (!noteKey.has(`${item.material}:${item.noteRole}:${item.percentage}`)) {
      throw new Error('现场操作步骤与配方不一致。');
    }
    if (item.waitSeconds !== 10) {
      throw new Error('每一步等待时间必须为 10 秒。');
    }
    assertDistance(item.percentage, item.distance);
    if (!/喷\s*1\s*下|喷一次|一喷|1\s*spray/i.test(item.instruction)) {
      throw new Error('每种原料只能喷 1 下。');
    }
  });
}
