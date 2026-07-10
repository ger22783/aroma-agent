export type NoteRole = 'top' | 'heart' | 'base';

export type ScentFacets = {
  fresh: number;
  sweet: number;
  floral: number;
  woody: number;
  watery: number;
  warm: number;
};

export type BoothMaterial = {
  id: string;
  nameZh: string;
  nameEn: string;
  family: string;
  noteRoles: NoteRole[];
  volatility: 'fast' | 'medium' | 'slow';
  usageRange: [number, number];
  scenarios: string[];
  moods: string[];
  facets: ScentFacets;
  intensity: 1 | 2 | 3 | 4 | 5;
  description: string;
  professionalRole: string;
  pairingTips: string[];
  avoidWhen: string[];
  caution?: string;
};

export const boothMaterials: BoothMaterial[] = [
  {
    id: 'japanese-citrus',
    nameZh: '日系柑橘',
    nameEn: 'Japanese Citrus',
    family: '柑橘调',
    noteRoles: ['top'],
    volatility: 'fast',
    usageRange: [10, 35],
    scenarios: ['日常通勤', '提神', '运动', '夏天'],
    moods: ['清爽', '明亮', '轻盈'],
    facets: { fresh: 5, sweet: 1, floral: 0, woody: 0, watery: 1, warm: 0 },
    intensity: 2,
    description: '清亮柑橘开场，适合第一喷快速提亮。',
    professionalRole: '负责开场亮度和第一印象，能把厚重或甜感配方拉轻。',
    pairingTips: ['搭配青盈绿茶会更干净', '搭配海上风铃会增加空气感', '搭配乌木可避免过于单薄'],
    avoidWhen: ['用户明确要求低存在感、睡前或非常安静时不宜过高']
  },
  {
    id: 'smoky-agarwood',
    nameZh: '烟熏乌木',
    nameEn: 'Smoky Agarwood',
    family: '木质调',
    noteRoles: ['base'],
    volatility: 'slow',
    usageRange: [10, 30],
    scenarios: ['独处', '阅读', '冥想', '秋冬'],
    moods: ['沉稳', '安静', '高级'],
    facets: { fresh: 0, sweet: 0, floral: 0, woody: 5, watery: 0, warm: 3 },
    intensity: 4,
    description: '深色木质收尾，增加沉稳感和留香厚度。',
    professionalRole: '负责尾调骨架、稳定度和成熟感，能让清新配方更有支撑。',
    pairingTips: ['少量搭配柑橘可形成清冷木质', '搭配咖啡会更沉稳', '搭配玫瑰可增强高级感'],
    avoidWhen: ['用户要求非常轻盈、运动后或低龄校园感时不宜过高']
  },
  {
    id: 'osmanthus-oolong',
    nameZh: '桂花乌龙',
    nameEn: 'Osmanthus Oolong',
    family: '花茶调',
    noteRoles: ['heart'],
    volatility: 'medium',
    usageRange: [15, 40],
    scenarios: ['下午茶', '雨天', '放松', '校园'],
    moods: ['温柔', '茶感', '治愈'],
    facets: { fresh: 2, sweet: 2, floral: 3, woody: 0, watery: 1, warm: 2 },
    intensity: 3,
    description: '桂花茶香，柔和又有记忆点。',
    professionalRole: '负责中调主体和亲和力，让配方更容易被路人接受。',
    pairingTips: ['搭配日系柑橘更明亮', '搭配水影浆果更柔软', '搭配乌木更适合雨天阅读'],
    avoidWhen: ['用户明确不要茶感或不要花香时减少使用']
  },
  {
    id: 'jasmine-floral-ring',
    nameZh: '典雅茉莉花环',
    nameEn: 'Elegant Jasmine Garland',
    family: '白花调',
    noteRoles: ['heart'],
    volatility: 'medium',
    usageRange: [10, 30],
    scenarios: ['约会', '面试', '正式场合'],
    moods: ['优雅', '干净', '亲和'],
    facets: { fresh: 1, sweet: 1, floral: 5, woody: 0, watery: 0, warm: 1 },
    intensity: 3,
    description: '干净白花中调，提升精致感。',
    professionalRole: '负责中段的精致度和仪式感，让配方显得更完整。',
    pairingTips: ['搭配柑橘更干净', '搭配玫瑰更浪漫', '搭配乌木更成熟'],
    avoidWhen: ['用户要求不花、不浓或运动场景时降低比例']
  },
  {
    id: 'coffee-hour',
    nameZh: '咖啡时光',
    nameEn: 'Coffee Hour',
    family: '美食调',
    noteRoles: ['heart', 'base'],
    volatility: 'medium',
    usageRange: [10, 30],
    scenarios: ['熬夜', '书店', '探店', '学习'],
    moods: ['温暖', '微苦', '提神'],
    facets: { fresh: 0, sweet: 1, floral: 0, woody: 2, watery: 0, warm: 4 },
    intensity: 3,
    description: '咖啡微苦，适合营造温暖而不甜腻的氛围。',
    professionalRole: '提供微苦与温暖质感，能把甜香压得更成熟。',
    pairingTips: ['搭配绿茶会更轻', '搭配乌木会更沉稳', '搭配香草会更甜暖'],
    avoidWhen: ['用户要求纯净皂感、海风感或不要美食调时不用']
  },
  {
    id: 'french-vanilla',
    nameZh: '法国香草',
    nameEn: 'French Vanilla',
    family: '美食调',
    noteRoles: ['base'],
    volatility: 'slow',
    usageRange: [5, 25],
    scenarios: ['冬日', '甜品', '约会', '放松'],
    moods: ['甜暖', '柔软', '亲密'],
    facets: { fresh: 0, sweet: 5, floral: 0, woody: 0, watery: 0, warm: 5 },
    intensity: 4,
    description: '香草甜暖，少量就很明显，适合做柔和尾调。',
    professionalRole: '负责甜暖、柔软和亲密感，但过量容易变腻。',
    pairingTips: ['搭配柑橘可降低腻感', '搭配花茶更温柔', '搭配咖啡更像甜点氛围'],
    avoidWhen: ['用户说不甜、清爽、运动后或通勤低调时避免高比例']
  },
  {
    id: 'bergamot-lime-kiss',
    nameZh: '香柠檬之吻',
    nameEn: 'Bergamot Lime Kiss',
    family: '果香柑橘调',
    noteRoles: ['top'],
    volatility: 'fast',
    usageRange: [10, 30],
    scenarios: ['夏日', '户外', '聚会', '开心'],
    moods: ['活泼', '酸甜', '明快'],
    facets: { fresh: 4, sweet: 2, floral: 0, woody: 0, watery: 1, warm: 0 },
    intensity: 2,
    description: '酸甜果香开场，制造轻松好心情。',
    professionalRole: '提供活泼果香开场，比日系柑橘更有社交感。',
    pairingTips: ['搭配茉莉更明亮', '搭配玫瑰更年轻', '搭配绿茶更清爽'],
    avoidWhen: ['用户要求严肃、沉稳或完全不甜时降低比例']
  },
  {
    id: 'watery-berry',
    nameZh: '水影浆果',
    nameEn: 'Watery Berry',
    family: '花果调',
    noteRoles: ['top', 'heart'],
    volatility: 'medium',
    usageRange: [10, 25],
    scenarios: ['傍晚', '湖边', '放松', '睡前'],
    moods: ['水润', '柔和', '轻甜'],
    facets: { fresh: 2, sweet: 3, floral: 1, woody: 0, watery: 5, warm: 1 },
    intensity: 2,
    description: '水润浆果，能降低配方攻击性，让边缘更柔软。',
    professionalRole: '负责水润柔化和轻甜过渡，让尖锐原料更圆滑。',
    pairingTips: ['搭配桂花乌龙更治愈', '搭配海上风铃更水感', '搭配香草更柔软'],
    avoidWhen: ['用户明确不要甜或要极简冷感时减少']
  },
  {
    id: 'grand-hotel',
    nameZh: '高雅希尔顿',
    nameEn: 'Grand Hotel Floral',
    family: '华丽花香调',
    noteRoles: ['heart'],
    volatility: 'medium',
    usageRange: [10, 25],
    scenarios: ['晚会', '婚礼', '酒店', '拍照'],
    moods: ['华丽', '自信', '成熟'],
    facets: { fresh: 0, sweet: 2, floral: 5, woody: 1, watery: 0, warm: 3 },
    intensity: 4,
    description: '华丽白花，适合做主角，让配方更有仪式感。',
    professionalRole: '负责华丽度和存在感，适合晚会或拍照打卡主题。',
    pairingTips: ['搭配柑橘可提亮', '搭配乌木更像酒店大堂', '搭配玫瑰更正式'],
    avoidWhen: ['用户要求低调、通勤、面试或清爽不浓时避免高比例']
  },
  {
    id: 'green-tea',
    nameZh: '青盈绿茶',
    nameEn: 'Green Tea Breeze',
    family: '茶香柑橘调',
    noteRoles: ['top', 'heart'],
    volatility: 'medium',
    usageRange: [15, 35],
    scenarios: ['夏日', '通勤', '提神', '解腻'],
    moods: ['清爽', '干净', '轻盈'],
    facets: { fresh: 5, sweet: 0, floral: 0, woody: 0, watery: 2, warm: 0 },
    intensity: 2,
    description: '绿茶清爽，适合快速试喷，也能让甜香更轻。',
    professionalRole: '负责干净茶感和清爽主体，是路演中最安全的低门槛原料之一。',
    pairingTips: ['搭配柑橘做清爽通勤', '搭配桂花乌龙做花茶', '搭配咖啡降低厚重感'],
    avoidWhen: ['用户明确想要浓郁甜暖或晚会华丽感时不做主角']
  },
  {
    id: 'desert-rose',
    nameZh: '无人之境玫瑰',
    nameEn: 'Desert Rose',
    family: '玫瑰木质调',
    noteRoles: ['heart', 'base'],
    volatility: 'slow',
    usageRange: [10, 30],
    scenarios: ['浪漫', '表白', '纪念日', '优雅'],
    moods: ['浪漫', '高级', '克制'],
    facets: { fresh: 0, sweet: 2, floral: 4, woody: 3, watery: 0, warm: 3 },
    intensity: 4,
    description: '玫瑰带木质，浪漫但不俗气。',
    professionalRole: '负责浪漫主题和记忆点，木质面让它不显廉价甜腻。',
    pairingTips: ['搭配柑橘更年轻', '搭配茉莉更花香', '搭配乌木更克制高级'],
    avoidWhen: ['用户说不要玫瑰、面试、运动后或极简皂感时不用']
  },
  {
    id: 'sea-breeze-bell',
    nameZh: '海上风铃',
    nameEn: 'Sea Breeze Bell',
    family: '海洋花香调',
    noteRoles: ['top', 'heart'],
    volatility: 'medium',
    usageRange: [15, 35],
    scenarios: ['海边', '雨天', '安静', '夏天'],
    moods: ['清凉', '水感', '安静'],
    facets: { fresh: 4, sweet: 0, floral: 1, woody: 0, watery: 5, warm: 0 },
    intensity: 2,
    description: '海风水感，适合做清凉空气感。',
    professionalRole: '负责水感、空气感和清凉边界，让配方更有空间感。',
    pairingTips: ['搭配柑橘像海风开场', '搭配绿茶更清透', '搭配桂花乌龙更雨天'],
    avoidWhen: ['用户要求甜暖、冬日或厚重留香时不做主角']
  }
];

export const ingredientLibrary = boothMaterials.map((item) => item.nameZh);
