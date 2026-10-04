export type Language = 'zh' | 'en';
export const copy = {
  zh: { origin: '起因之章 · 命运之始', passage: '经过之章 · 际遇之行', result: '结果之章 · 终局归宿', walk: '步向造物', approaching: '正漫步靠近：', arrive: '立即抵达 (Space)', encounter: '邂逅', give: '交付红礼 (逆)', keep: '保留 (顺)', drag: '将红色礼物拖向造物交付', newJourney: '开启新的旅途', chronicle: '查看旅途手记', zen: '进入纯享模式 (H)', show: '显示界面 (H)', language: '语言', choose: '选择一张牌，决定旅途的起点。', cardHint: '点击卡牌，或按 1 / 2 / 3 键选择' },
  en: { origin: 'ORIGIN · THE BEGINNING', passage: 'PASSAGE · THE ENCOUNTER', result: 'OUTCOME · THE DESTINY', walk: 'Approaching the entity', approaching: 'Walking toward:', arrive: 'Arrive now (Space)', encounter: 'Encounter', give: 'Offer the scarlet gift (Reversed)', keep: 'Keep the gift (Upright)', drag: 'Drag the scarlet gift to the entity', newJourney: 'Begin a new journey', chronicle: 'View chronicle', zen: 'Enter Zen mode (H)', show: 'Show interface (H)', language: 'Language', choose: 'Choose a card to shape the beginning of your journey.', cardHint: 'Click a card, or press 1 / 2 / 3 to choose' },
} as const;
export const stageCopy = (lang: Language, stage: number) => [copy[lang].origin, copy[lang].passage, copy[lang].result][stage - 1];
