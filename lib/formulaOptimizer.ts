import { boothMaterials, type BoothMaterial, type NoteRole, type ScentFacets } from '@/data/ingredients';
import type { IntentProfile } from './intent';
import type { NoteItem } from './types';
import { selectMaterials, type SelectionPlan } from './materialSelector';

type OdorDimension = keyof ScentFacets | 'intensity';

export type FormulaScoreBreakdown = {
  total: number;
  vectorFit: number;
  scenarioFit: number;
  moodFit: number;
  structureFit: number;
  usageFit: number;
  intensityFit: number;
  penalty: number;
  squaredError: number;
};

export type JudgeCheck = {
  passed: boolean;
  summary: string;
  issues: string[];
};

export type OptimizedFormulaPlan = {
  topNotes: NoteItem[];
  heartNotes: NoteItem[];
  baseNotes: NoteItem[];
  targetVector: Record<OdorDimension, number>;
  formulaVector: Record<OdorDimension, number>;
  averageIntensity: number;
  score: FormulaScoreBreakdown;
  optimizationTrace: {
    method: string;
    selectedMaterials: string[];
    activeSetCount: number;
  };
  rationale: string[];
  judgeCheck: JudgeCheck;
};

type ActiveMaterial = {
  material: BoothMaterial;
  role: NoteRole;
};

type SolvedPlan = {
  activeSet: ActiveMaterial[];
  weights: number[];
  vector: Record<OdorDimension, number>;
  objective: number;
  squaredError: number;
};

const facetKeys: Array<keyof ScentFacets> = ['fresh', 'sweet', 'floral', 'woody', 'watery', 'warm'];
const odorDimensions: OdorDimension[] = [...facetKeys, 'intensity'];
const dimensionWeights: Record<OdorDimension, number> = {
  fresh: 1.35,
  sweet: 1.7,
  floral: 1.05,
  woody: 1.35,
  watery: 1.35,
  warm: 1.1,
  intensity: 1
};

const rolePatterns: NoteRole[][] = [
  ['top', 'heart', 'base'],
  ['top', 'top', 'heart', 'base'],
  ['top', 'heart', 'heart', 'base'],
  ['top', 'heart', 'base', 'base'],
  ['top', 'top', 'heart', 'heart', 'base'],
  ['top', 'top', 'heart', 'base', 'base'],
  ['top', 'heart', 'heart', 'base', 'base']
];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

function hasText(values: string[], words: string[]) {
  const text = values.join(' ').toLowerCase();
  return words.some((word) => text.includes(word.toLowerCase()));
}

function intentHas(intent: IntentProfile, words: string[]) {
  return hasText([intent.rawText, ...intent.dislikes, ...intent.constraints, ...intent.moods, ...intent.scenarios], words);
}

function overlapCount(left: string[], right: string[]) {
  const normalized = right.map((item) => item.toLowerCase());
  return left.reduce((score, item) => {
    const value = item.toLowerCase();
    return score + (normalized.some((target) => target.includes(value) || value.includes(target)) ? 1 : 0);
  }, 0);
}

function targetIntensity(intent: IntentProfile) {
  if (intentHas(intent, ['不要太浓', '别太浓', '太浓', '攻击性', '存在感太强', '低调', '小白', '第一次'])) return 2;
  if (intentHas(intent, ['华丽', '自信', '成熟', '浓郁', '晚会'])) return 3.4;
  return 2.7;
}

function targetVector(intent: IntentProfile): Record<OdorDimension, number> {
  const hasExplicitFacet = Object.values(intent.desiredFacets).some((value) => value > 0);
  const fallback: ScentFacets = {
    fresh: 2.6,
    sweet: 0.8,
    floral: 1.4,
    woody: 0.8,
    watery: 1.2,
    warm: 0.8
  };
  const target = facetKeys.reduce((result, key) => {
    result[key] = hasExplicitFacet ? intent.desiredFacets[key] : fallback[key];
    return result;
  }, {} as Record<OdorDimension, number>);

  target.intensity = targetIntensity(intent);

  if (intentHas(intent, ['不甜', '不要甜', '不要太甜', '别太甜', '太甜', '甜腻', '奶茶', '香草'])) {
    target.sweet = 0;
    target.warm = Math.min(target.warm, 1);
  }
  if (intentHas(intent, ['不要太浓', '别太浓', '太浓', '低调', '小白', '第一次'])) {
    target.intensity = Math.min(target.intensity, 2);
  }
  if (intentHas(intent, ['不要花', '不花', '不要玫瑰', '不要茉莉', '太花'])) target.floral = 0;
  if (intentHas(intent, ['不要木质', '不木质', '不要烟熏', '不沉重', '寺庙', '焚香'])) target.woody = 0;

  Object.assign(target, intent.preferenceTargets || {});
  return target;
}

function materialVector(material: BoothMaterial): Record<OdorDimension, number> {
  return {
    fresh: material.facets.fresh,
    sweet: material.facets.sweet,
    floral: material.facets.floral,
    woody: material.facets.woody,
    watery: material.facets.watery,
    warm: material.facets.warm,
    intensity: material.intensity
  };
}

function isHardBlocked(intent: IntentProfile, material: BoothMaterial) {
  if (intent.bannedMaterialIds?.includes(material.id)) return true;
  if (intentHas(intent, ['不甜', '不要甜', '不要太甜', '香草']) && material.id === 'french-vanilla') return true;
  if (intentHas(intent, ['不要玫瑰', '不喜欢玫瑰']) && material.id === 'desert-rose') return true;
  if (intentHas(intent, ['不要茉莉', '不喜欢茉莉', '不要白花']) && material.id === 'jasmine-floral-ring') return true;
  if (intentHas(intent, ['不要烟熏', '不喜欢烟熏', '不要焚香']) && material.id === 'smoky-agarwood') return true;
  return false;
}

function materialPenalty(intent: IntentProfile, material: BoothMaterial) {
  let penalty = 0;
  if (intentHas(intent, ['不甜', '不要甜', '不要太甜', '甜腻', '太甜', '奶茶', '糖', '香草']) && material.facets.sweet >= 3) penalty += 0.7;
  if (intentHas(intent, ['不要花', '不花', '明显花香', '太花', '玫瑰', '茉莉', '白花']) && material.facets.floral >= 4) penalty += 0.5;
  if (intentHas(intent, ['不要木质', '不木质', '厚重木质', '烟熏', '寺庙', '焚香', '沉重']) && material.facets.woody >= 4) penalty += 0.55;
  if (intentHas(intent, ['不要太浓', '太浓', '攻击性', '存在感太强', '低调', '小白']) && material.intensity >= 4) penalty += 0.5;
  return penalty;
}

function contextBonus(intent: IntentProfile, material: BoothMaterial) {
  return (intent.materialPreferenceScores?.[material.id] || 0) * 0.025 + overlapCount(intent.scenarios, material.scenarios) * 0.055 +
    overlapCount(intent.moods, material.moods) * 0.04;
}

function mixVector(activeSet: ActiveMaterial[], weights: number[]) {
  return odorDimensions.reduce((result, dimension) => {
    result[dimension] = activeSet.reduce((sum, item, index) => {
      return sum + materialVector(item.material)[dimension] * weights[index];
    }, 0);
    return result;
  }, {} as Record<OdorDimension, number>);
}

function squaredError(vector: Record<OdorDimension, number>, target: Record<OdorDimension, number>) {
  return odorDimensions.reduce((sum, dimension) => {
    const diff = vector[dimension] - target[dimension];
    return sum + dimensionWeights[dimension] * diff * diff;
  }, 0);
}

function projectBoxSimplex(values: number[], lower: number[], upper: number[], targetSum = 1) {
  const lowerSum = lower.reduce((sum, value) => sum + value, 0);
  const upperSum = upper.reduce((sum, value) => sum + value, 0);
  if (lowerSum - targetSum > 1e-9 || targetSum - upperSum > 1e-9) return null;

  let low = Math.min(...values.map((value, index) => value - upper[index])) - 1;
  let high = Math.max(...values.map((value, index) => value - lower[index])) + 1;

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const sum = values.reduce((total, value, index) => {
      return total + Math.max(lower[index], Math.min(upper[index], value - mid));
    }, 0);
    if (sum > targetSum) low = mid;
    else high = mid;
  }

  const tau = (low + high) / 2;
  return values.map((value, index) => Math.max(lower[index], Math.min(upper[index], value - tau)));
}

function solveActiveSet(intent: IntentProfile, activeSet: ActiveMaterial[], target: Record<OdorDimension, number>): SolvedPlan | null {
  const lower = activeSet.map((item) => item.material.usageRange[0] / 100);
  const upper = activeSet.map((item) => item.material.usageRange[1] / 100);
  let weights = projectBoxSimplex(activeSet.map(() => 1 / activeSet.length), lower, upper);
  if (!weights) return null;

  const stepSize = 0.018;
  for (let iteration = 0; iteration < 850; iteration += 1) {
    const vector = mixVector(activeSet, weights);
    const gradient = activeSet.map((item) => {
      const material = materialVector(item.material);
      const fitGradient = odorDimensions.reduce((sum, dimension) => {
        return sum + 2 * dimensionWeights[dimension] * (vector[dimension] - target[dimension]) * material[dimension];
      }, 0);
      const contextTerm = materialPenalty(intent, item.material) - contextBonus(intent, item.material);
      return fitGradient + contextTerm;
    });
    const next = weights.map((weight, index) => weight - stepSize * gradient[index]);
    const projected = projectBoxSimplex(next, lower, upper);
    if (!projected) return null;
    const previousWeights = weights;
    const change = Math.max(...projected.map((value, index) => Math.abs(value - previousWeights[index])));
    weights = projected;
    if (change < 1e-7) break;
  }

  const vector = mixVector(activeSet, weights);
  const error = squaredError(vector, target);
  const penalty = activeSet.reduce((sum, item, index) => {
    return sum + weights[index] * materialPenalty(intent, item.material) - weights[index] * contextBonus(intent, item.material);
  }, 0);
  const objective = error + penalty * 4;

  return {
    activeSet,
    weights,
    vector,
    objective,
    squaredError: error
  };
}

function enumerateActiveSets(pattern: NoteRole[], plan: SelectionPlan, index = 0, used = new Set<string>()): ActiveMaterial[][] {
  if (index >= pattern.length) return [[]];
  const role = pattern[index];
  const results: ActiveMaterial[][] = [];

  for (const { material } of plan[role]) {
    if (used.has(material.id) || !material.noteRoles.includes(role)) continue;
    const nextUsed = new Set(used);
    nextUsed.add(material.id);
    for (const tail of enumerateActiveSets(pattern, plan, index + 1, nextUsed)) {
      results.push([{ material, role }, ...tail]);
    }
  }

  return results;
}

function integerizePercentages(activeSet: ActiveMaterial[], weights: number[]) {
  const raw = weights.map((weight) => weight * 100);
  const min = activeSet.map((item) => Math.ceil(item.material.usageRange[0]));
  const max = activeSet.map((item) => Math.floor(item.material.usageRange[1]));
  let percentages = raw.map((value, index) => Math.max(min[index], Math.min(max[index], Math.round(value))));
  let delta = 100 - percentages.reduce((sum, value) => sum + value, 0);

  while (delta !== 0) {
    const direction = Math.sign(delta);
    const candidates = percentages
      .map((value, index) => ({
        index,
        room: direction > 0 ? max[index] - value : value - min[index],
        priority: direction > 0 ? raw[index] - value : value - raw[index]
      }))
      .filter((item) => item.room > 0)
      .sort((a, b) => b.priority - a.priority);
    if (!candidates.length) break;
    percentages[candidates[0].index] += direction;
    delta -= direction;
  }

  return percentages;
}

function notesByRole(activeSet: ActiveMaterial[], percentages: number[], role: NoteRole): NoteItem[] {
  return activeSet
    .map((item, index) => ({ item, percentage: percentages[index] }))
    .filter(({ item }) => item.role === role)
    .map(({ item, percentage }) => ({ name: item.material.nameZh, percentage }));
}

function scenarioFit(intent: IntentProfile, activeSet: ActiveMaterial[]) {
  if (!intent.scenarios.length) return 0.75;
  const matches = activeSet.reduce((sum, item) => sum + overlapCount(intent.scenarios, item.material.scenarios), 0);
  return clamp01(matches / Math.max(2, intent.scenarios.length));
}

function moodFit(intent: IntentProfile, activeSet: ActiveMaterial[]) {
  if (!intent.moods.length) return 0.75;
  const matches = activeSet.reduce((sum, item) => sum + overlapCount(intent.moods, item.material.moods), 0);
  return clamp01(matches / Math.max(2, intent.moods.length));
}

function judgePlan(intent: IntentProfile, activeSet: ActiveMaterial[], percentages: number[], target: Record<OdorDimension, number>, vector: Record<OdorDimension, number>): JudgeCheck {
  const issues: string[] = [];
  const total = percentages.reduce((sum, value) => sum + value, 0);
  const roles = new Set(activeSet.map((item) => item.role));

  if (activeSet.length < 3 || activeSet.length > 5) issues.push(`原料数为 ${activeSet.length}，不在 3-5 种范围内。`);
  if (total !== 100) issues.push(`配比总和为 ${total}%，不是 100%。`);
  for (const role of ['top', 'heart', 'base'] as NoteRole[]) {
    if (!roles.has(role)) issues.push(`缺少 ${role} 结构。`);
  }
  activeSet.forEach((item, index) => {
    const percentage = percentages[index];
    const [min, max] = item.material.usageRange;
    if (!item.material.noteRoles.includes(item.role)) issues.push(`${item.material.nameZh} 不允许作为 ${item.role}。`);
    if (percentage < min || percentage > max) issues.push(`${item.material.nameZh} ${percentage}% 超出推荐范围 ${min}-${max}%。`);
    if (isHardBlocked(intent, item.material)) issues.push(`${item.material.nameZh} 触发用户明确禁忌。`);
  });
  if (vector.intensity - target.intensity > 1.2) issues.push(`整体强度 ${vector.intensity.toFixed(2)} 明显高于目标 ${target.intensity.toFixed(2)}。`);

  return {
    passed: issues.length === 0,
    summary: issues.length === 0
      ? 'Judge check passed: 配比总和、前中后调、推荐用量、禁忌和强度约束均通过。'
      : `Judge check failed: 发现 ${issues.length} 个问题。`,
    issues
  };
}

function scorePlan(intent: IntentProfile, activeSet: ActiveMaterial[], percentages: number[], target: Record<OdorDimension, number>, vector: Record<OdorDimension, number>): FormulaScoreBreakdown {
  const error = squaredError(vector, target);
  const vectorFit = clamp01(1 - error / 42);
  const weightedPenalty = activeSet.reduce((sum, item, index) => sum + percentages[index] / 100 * materialPenalty(intent, item.material), 0);
  const intensityDiff = Math.max(0, vector.intensity - target.intensity);
  const usageFit = activeSet.filter((item, index) => {
    const [min, max] = item.material.usageRange;
    return percentages[index] >= min && percentages[index] <= max;
  }).length / activeSet.length;
  const score = {
    vectorFit,
    scenarioFit: scenarioFit(intent, activeSet),
    moodFit: moodFit(intent, activeSet),
    structureFit: 1,
    usageFit,
    intensityFit: clamp01(1 - intensityDiff / 2),
    penalty: clamp01(weightedPenalty),
    squaredError: round2(error),
    total: 0
  };

  score.total = clamp01(
    0.55 * score.vectorFit +
    0.11 * score.scenarioFit +
    0.08 * score.moodFit +
    0.10 * score.structureFit +
    0.08 * score.usageFit +
    0.08 * score.intensityFit -
    score.penalty
  );

  return score;
}

function rationale(target: Record<OdorDimension, number>, vector: Record<OdorDimension, number>, activeSet: ActiveMaterial[], percentages: number[], score: FormulaScoreBreakdown) {
  const formulaLine = activeSet.map((item, index) => `${item.material.nameZh}/${item.role} ${percentages[index]}%`).join('、');
  const vectorLine = odorDimensions.map((dimension) => `${dimension}: target ${round2(target[dimension])} → formula ${round2(vector[dimension])}`).join('；');
  return [
    `优化问题：minimize ||Aw - y||² + penalty(w)，其中 y 为用户目标香气向量，A 为原料香气矩阵，w 为原料比例。`,
    `求解方式：枚举 3-5 个可执行 active set，每个 active set 内用 box-simplex projected least squares 求连续最优比例，再选择目标函数最低的方案。`,
    `最优配比：${formulaLine}。`,
    `向量拟合：${vectorLine}。`,
    `Judge 得分：总分 ${(score.total * 100).toFixed(1)}，向量拟合 ${(score.vectorFit * 100).toFixed(1)}，误差 ||Aw-y||²=${score.squaredError}。`
  ];
}

export function optimizeFormula(intent: IntentProfile, selectionPlan = selectMaterials(intent)): OptimizedFormulaPlan {
  const target = targetVector(intent);
  let activeSetCount = 0;
  let best: SolvedPlan | null = null;
  const seen = new Set<string>();

  for (const pattern of rolePatterns) {
    for (const activeSet of enumerateActiveSets(pattern, selectionPlan)) {
      const key = activeSet.map(item => `${item.material.id}:${item.role}`).sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      if (activeSet.some((item) => isHardBlocked(intent, item.material))) continue;
      activeSetCount += 1;
      const solved = solveActiveSet(intent, activeSet, target);
      if (!solved) continue;
      if (!best || solved.objective < best.objective) best = solved;
    }
  }

  if (!best) {
    throw new Error('未找到满足前中后调、推荐用量和禁忌约束的可执行配方。');
  }

  const percentages = integerizePercentages(best.activeSet, best.weights);
  const integerWeights = percentages.map((percentage) => percentage / 100);
  const vector = mixVector(best.activeSet, integerWeights);
  const score = scorePlan(intent, best.activeSet, percentages, target, vector);
  const judgeCheck = judgePlan(intent, best.activeSet, percentages, target, vector);

  return {
    topNotes: notesByRole(best.activeSet, percentages, 'top'),
    heartNotes: notesByRole(best.activeSet, percentages, 'heart'),
    baseNotes: notesByRole(best.activeSet, percentages, 'base'),
    targetVector: odorDimensions.reduce((result, dimension) => {
      result[dimension] = round2(target[dimension]);
      return result;
    }, {} as Record<OdorDimension, number>),
    formulaVector: odorDimensions.reduce((result, dimension) => {
      result[dimension] = round2(vector[dimension]);
      return result;
    }, {} as Record<OdorDimension, number>),
    averageIntensity: round2(vector.intensity),
    score,
    optimizationTrace: {
      method: 'Active-set constrained least-squares over role-valid 3-5 ingredient formulations',
      selectedMaterials: best.activeSet.map((item, index) => `${item.material.nameZh}/${item.role} ${percentages[index]}%`),
      activeSetCount
    },
    rationale: rationale(target, vector, best.activeSet, percentages, score),
    judgeCheck
  };
}
