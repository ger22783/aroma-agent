export type Lang = 'zh' | 'en';

export type LocalizedText = Record<Lang, string>;

export const quickPrompts: LocalizedText[] = [
  { zh: '清爽、不甜、适合夏天通勤', en: 'Fresh, not sweet, for a summer commute' },
  { zh: '雨天、安静、像图书馆', en: 'Quiet and library-like on a rainy day' },
  { zh: '温柔一点，适合约会', en: 'Soft and gentle for a date' },
  { zh: '木质、沉稳、适合阅读', en: 'Woody and grounded for reading' },
  { zh: '甜一点，但不要腻', en: 'A little sweet, but never cloying' },
  { zh: '适合面试，干净、有亲和力', en: 'Clean and approachable for an interview' },
  { zh: '适合运动后，清凉、轻盈', en: 'Cool and light after a workout' },
  { zh: '适合晚会，成熟、有记忆点', en: 'Mature and memorable for an evening event' },
  { zh: '像白衬衫，皂感、低调', en: 'Like a white shirt: soapy and understated' },
  { zh: '适合睡前，放松、柔和', en: 'Relaxing and soft before sleep' },
  { zh: '想要茶香，不要太花', en: 'Tea-like, without too many florals' },
  { zh: '想要高级感，但不要太浓', en: 'Refined, but not too intense' },
  { zh: '今天心情低落，想要治愈一点', en: 'Something comforting for a low mood' },
  { zh: '适合拍照打卡，明亮、有氛围', en: 'Bright and photogenic with atmosphere' },
  { zh: '适合秋冬，温暖、木质', en: 'Warm and woody for autumn or winter' },
  { zh: '想要海风感，清透、干净', en: 'Airy and clean like a sea breeze' },
  { zh: '适合第一次体验，安全不出错', en: 'A safe first-time scent experience' },
  { zh: '像刚洗完澡，清洁、舒服', en: 'Clean and comfortable after a shower' },
  { zh: '有咖啡感，但不要太苦', en: 'Coffee-like, but not too bitter' },
  { zh: '像校园午后，轻松、有茶感', en: 'A relaxed, tea-like campus afternoon' }
];

export const t = {
  siteTitle: { zh: 'iGEM Perfume Booth', en: 'iGEM Perfume Booth' },
  brandName: { zh: 'AI 个性化香氛', en: 'AI Personalized Perfume' },
  brandTeam: { zh: '西湖大学 iGEM 2026', en: 'iGEM Westlake 2026' },
  eyebrow: { zh: '合成生物学 × AI × 个性化香氛', en: 'SYNTHETIC BIOLOGY × AI × PERSONALIZED FRAGRANCE' },
  cardNumber: { zh: '试香卡 · 现场版', en: 'SCENT CARD · BOOTH EDITION' },
  heroTitle: { zh: '30 秒生成你的专属试香卡', en: 'Generate your scent card in 30 seconds' },
  heroDesc: {
    zh: '告诉我们你今天想要的感觉，Agent 会从展台已有原料里选择 3-5 种，生成一张可以马上照着喷的试香步骤。',
    en: 'Describe the mood you want. The agent will choose 3-5 booth materials and create a quick scent-card recipe.'
  },
  qrHint: { zh: '扫码在手机上体验', en: 'Scan to try on your phone' },
  modeLLM: { zh: '在线模型', en: 'Live model' },
  modeFallback: { zh: '演示模式', en: 'Demo mode' },
  inputLabel: { zh: '你想要什么感觉？', en: 'What feeling do you want?' },
  inputPlaceholder: {
    zh: '例如：今天很热，想要清爽、不甜、适合通勤的香气',
    en: 'Example: It is hot today. I want something fresh, not sweet, and commute-friendly.'
  },
  btnFirst: { zh: '生成试香卡', en: 'Generate scent card' },
  btnContinue: { zh: '按我的新想法调整', en: 'Refine with my new idea' },
  btnLoading: { zh: '生成中...', en: 'Generating...' },
  btnReset: { zh: '下一位体验者', en: 'Next visitor' },
  hintFollowUp: {
    zh: '也可以继续说：更清爽一点 / 不要玫瑰 / 更甜一点 / 更适合雨天',
    en: 'Try: fresher / no rose / sweeter / more rainy-day friendly'
  },
  quickTitle: { zh: '快速选择', en: 'Quick picks' },
  quickHint: { zh: '点击任意需求即可生成', en: 'Click any prompt to generate' },
  historyTitle: { zh: '短对话记录', en: 'Short conversation' },
  historyEmpty: {
    zh: '生成后可以继续追问，让 Agent 沿着上一版配方解释或调整。',
    en: 'After generating, you can keep refining or asking about the previous recipe.'
  },
  resultTitle: { zh: '你的试香卡', en: 'Your scent card' },
  resultHint: {
    zh: '按顺序每种喷 1 下，喷在试香纸上。每一步之间等 10 秒。',
    en: 'Spray each material once on a scent strip. Wait 10 seconds between steps.'
  },
  resultEmpty: {
    zh: '先输入一个需求，或点击左侧快速选择。',
    en: 'Enter a request or choose a quick pick.'
  },
  blockAIReply: { zh: 'Agent 建议', en: 'Agent suggestion' },
  blockPositioning: { zh: '香气定位', en: 'Scent positioning' },
  blockBlending: { zh: '现场操作步骤', en: 'Booth steps' },
  blockFormula: { zh: '配方结构', en: 'Formula structure' },
  blockEffect: { zh: '闻起来会怎样', en: 'Expected effect' },
  blockSafety: { zh: '安全提醒', en: 'Safety note' },
  labelStyle: { zh: '风格', en: 'Style' },
  labelKeywords: { zh: '关键词', en: 'Keywords' },
  labelScenarios: { zh: '适合场景', en: 'Scenarios' },
  labelOpening: { zh: '前段', en: 'Opening' },
  labelHeart: { zh: '中段', en: 'Heart' },
  labelDrydown: { zh: '尾调', en: 'Drydown' },
  labelSillage: { zh: '扩散', en: 'Sillage' },
  labelLongevity: { zh: '留香', en: 'Longevity' },
  topNotes: { zh: '前调', en: 'Top notes' },
  heartNotes: { zh: '中调', en: 'Heart notes' },
  baseNotes: { zh: '后调', en: 'Base notes' },
  roleYou: { zh: '你', en: 'You' },
  roleAgent: { zh: 'Agent', en: 'Agent' },
  debugTitle: { zh: '调试信息', en: 'Debug info' },
  fallbackReply: {
    zh: '在线模型暂时不可用，已切换到本地演示规则生成。',
    en: 'Live model is unavailable, switched to local demo rules.'
  },
  genericError: { zh: '暂时无法生成，请稍后再试。', en: 'We could not generate a card just now. Please try again.' },
  feedbackTitle: { zh: '体验反馈', en: 'Feedback' },
  feedbackHint: {
    zh: '调完香后给这版配方打个分，帮助我们改进 Agent。',
    en: 'Rate this recipe after trying it.'
  },
  feedbackPlaceholder: {
    zh: '可选：哪里喜欢，哪里想改？',
    en: 'Optional: what worked, what should change?'
  },
  feedbackSubmit: { zh: '提交反馈', en: 'Submit feedback' },
  feedbackThanks: { zh: '已记录，谢谢你的反馈。', en: 'Feedback saved. Thank you.' }
} as const;
