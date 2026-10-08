import { buildFinalReadingPrompt, type ReadingLanguage, type ReadingScores } from '../server/prompts/finalReadingPrompt.js';

type VercelRequest = { method?: string; body?: any };
type VercelResponse = { status(code: number): VercelResponse; json(body: unknown): void };

type StageRecord = {
  stageName?: string;
  card: { numeral: string; nameEn: string; nameZh: string; keyword: string; keywordUpright?: string; keywordReversed?: string; encounter?: { giftReactionOffered: string; giftReactionKept: string } };
  orientation: 'upright' | 'reversed';
  offeredGift: boolean;
  encounterName: string;
  encounterDesc: string;
};

function fallback(history: StageRecord[], language: ReadingLanguage, scores: ReadingScores) {
  const names = history.map((item) => language === 'en' ? item?.card?.nameEn : item?.card?.nameZh).filter(Boolean).join(language === 'en' ? ', ' : '、');
  if (language === 'en') return {
    metaphorTitle: 'A reading for the path you are choosing',
    situationReading: `Your journey through ${names || 'the unknown'} reflects a gradual calibration between openness and self-protection.`,
    psychologicalInsight: `Empathy ${scores.empathy}, insight ${scores.insight}, hesitation ${scores.hesitation}, boundary ${scores.boundary}. These are narrative signals, not a diagnosis.`,
    selfAwareness: 'Notice whether the next pause protects a necessary boundary or postpones a choice you already understand.',
    fallback: true,
    fallbackReason: 'The AI reading service is unavailable, so a local reading is being shown.',
  };
  return {
    metaphorTitle: '关于当下选择的内在地图',
    situationReading: `从${names || '未知的道路'}经过时，你正在靠近与保护之间逐步校准自己的位置。`,
    psychologicalInsight: `共情${scores.empathy}、洞察${scores.insight}、犹豫${scores.hesitation}、边界${scores.boundary}。这些是叙事线索，不是诊断。`,
    selfAwareness: '留意下一次停顿：你是在保护必要的边界，还是在推迟一个其实已经看懂的选择？',
    fallback: true,
    fallbackReason: 'AI 解读接口不可用，已使用本地备用解读。',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let stageHistory: StageRecord[] = [];
  let language: ReadingLanguage = 'zh';
  let scores: ReadingScores = { empathy: 2, insight: 2, hesitation: 2, boundary: 2 };
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const requestedLanguage = body.language;
    const requestedScores = body.scores || {};
    language = requestedLanguage === 'en' ? 'en' : 'zh';
    if (!Array.isArray(body.stageHistory) || body.stageHistory.length === 0) return res.status(400).json({ error: 'Missing stageHistory data' });
    if (body.stageHistory.some((item: StageRecord) => !item?.card || typeof item.card !== 'object')) {
      return res.status(400).json({ error: 'Invalid stageHistory data' });
    }
    stageHistory = body.stageHistory;
    scores = {
      empathy: Number(requestedScores?.empathy) || 2,
      insight: Number(requestedScores?.insight) || 2,
      hesitation: Number(requestedScores?.hesitation) || 2,
      boundary: Number(requestedScores?.boundary) || 2,
    };
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) return res.status(200).json(fallback(stageHistory, language, scores));

    const summary = stageHistory.map((item, i) => `${i + 1}. ${item.card.nameEn || ''}/${item.card.nameZh || ''}; ${item.encounterName || ''}; ${item.offeredGift ? 'offered' : 'kept'}; ${item.orientation || ''}`).join('\n');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let response: Response;
    try {
      response = await fetch(`${(process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com').replace(/\/$/, '')}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', messages: [{ role: 'user', content: buildFinalReadingPrompt(language, 'the choice taking shape now', summary, scores) }], temperature: 0.7, response_format: { type: 'json_object' } }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) throw new Error(`DeepSeek ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('DeepSeek returned no JSON content');
    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('Interpretation request failed', error);
    if (stageHistory.length > 0) return res.status(200).json(fallback(stageHistory, language, scores));
    return res.status(500).json({ error: 'Unable to create interpretation' });
  }
}
