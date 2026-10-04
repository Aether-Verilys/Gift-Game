import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK
// Using User-Agent header 'aistudio-build' as required
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface StageRecord {
  stage: number;
  card: {
    numeral: string;
    nameEn: string;
    nameZh: string;
    keyword: string;
    archetype: string;
    symbol: string;
  };
  orientation: 'upright' | 'reversed';
  offeredGift: boolean;
  encounterName: string;
  encounterDesc: string;
}

// Fallback poetic generator in case API key is missing or service unavailable
function deriveFocusSituation(history: StageRecord[]) {
  const first = history[0];
  if (!first) return '当下正在形成的选择与方向';
  const themes: Record<string, string> = {
    愚者: '是否迈出新的第一步，以及如何面对未知',
    女祭司: '如何信任直觉，同时处理尚未说出口的信息',
    皇帝: '如何建立边界、秩序与可持续的掌控感',
    教皇: '如何在既有规则与自己的道路之间做选择',
    恋人: '一段关系中的靠近、承诺与自主边界',
    战车: '如何在压力和不确定中作出行动决定',
    隐士: '如何独处、整理内在需要并听见自己的判断',
    命运之轮: '如何面对变化、时机与无法控制的部分',
    高塔: '如何处理旧结构松动、冲突或突然的改变',
    星辰: '如何恢复希望，并把愿望转成现实方向',
    月亮: '如何辨认焦虑、想象与真实信号',
    太阳: '如何允许自己被看见并确认真正想要的生活',
    世界: '如何完成一个阶段并决定下一步去向',
  };
  return themes[first.card.nameZh] || `围绕“${first.card.nameZh}”所展开的选择、关系与自我定位`;
}

function generatePoeticFallback(history: StageRecord[], focusSituation = deriveFocusSituation(history)) {
  const c1 = history[0] || { card: { nameZh: '星辰', numeral: 'ⅩⅦ' }, orientation: 'upright', offeredGift: true };
  const c2 = history[1] || { card: { nameZh: '隐士', numeral: 'Ⅸ' }, orientation: 'reversed', offeredGift: false };
  const c3 = history[2] || { card: { nameZh: '世界', numeral: 'ⅩⅩⅠ' }, orientation: 'upright', offeredGift: true };

  const giftCount = history.filter((h) => h.offeredGift).length;

  let metaphorTitle = '暴风雪里未曾关严的木百叶';
  let coreMetaphor =
    '旅者像是一扇在荒原中半开的木百叶窗，风可以从缝隙里穿过去，但屋里的炉火始终没有熄灭。旅者不拒绝寒冷与外界的声响，却在最深处守着一块不肯轻易交付的干燥木柴。当旅者给予时，动作轻得像是在冰面上放下一颗微温的石子；当旅者收回手时，也不是出于冷漠，只是知道有些光芒只能在自己的掌心发热。';

  if (giftCount === 3) {
    metaphorTitle = '把体温借给潮汐的旅人';
    coreMetaphor =
      '旅者对待这个世界的方式，像是在深秋的黄昏把外套脱给了一棵枯树。旅者习惯把心底最热的一块火种分给每一个路过的静默之物，甚至不在意它们是否能给出回应。你的温柔不是轻飘飘的糖霜，而是一种带着微痛的执拗——哪怕最后掌心只剩下微凉的风，旅者依然相信，曾被温暖过的石头会记得体温。';
  } else if (giftCount === 0) {
    metaphorTitle = '将火种密封在陶罐里的守夜人';
    coreMetaphor =
      '旅者像是在凛冬的夜里，把最后的炭火小心翼翼埋进干燥草灰里的守夜人。外界以为你的沉默是一种防备，但只有旅者自己明白，这是一种极度珍视的敬畏。旅者不轻易打开陶罐的封口，因为你清楚这簇火苗有多脆弱，也知道在这无垠的黑夜中，只有完整守住自己的微光，明天的清晨才有一丝破晓的可能。';
  } else if (history[0]?.offeredGift && !history[1]?.offeredGift) {
    metaphorTitle = '在深潜时屏住呼吸的那几秒';
    coreMetaphor =
      '旅者像是深潜时忽然屏住呼吸的那几个瞬间：外面的水压很大，海面上的喧嚣被完全滤掉，周围的世界忽然变得极其清晰。旅者曾豪迈地向外抛洒过热情，但在某个节点突然收束了缰绳。旅者不是退缩，而是突然学会了在湍急的暗流里稳住自己的重心，像一艘收起风帆但龙骨沉稳的静止之舟。';
  }

  const journeyReflection = `第一程抽得【${c1.card.nameZh}】（${c1.orientation === 'upright' ? '顺位' : '逆位'}），旅者选择${c1.offeredGift ? '献出' : '保留'}了红色礼物；第二程遇【${c2.card.nameZh}】（${c2.orientation === 'upright' ? '顺位' : '逆位'}），旅者选择${c2.offeredGift ? '交付' : '收回'}；终程在【${c3.card.nameZh}】前，旅者完成了最后的抉择。每一次给予与保留，都在这片星海深处刻下了独属于你的力场纹理。`;

  return {
    metaphorTitle: `关于“${focusSituation}”的内在地图`,
    situationReading: `就“${focusSituation}”而言，旅者的选择呈现出一种在靠近与保护之间反复校准的过程。旅者并非缺少答案，而是在评估投入之后的代价、关系是否可靠，以及什么边界必须保留。`,
    psychologicalInsight: `旅者可能会先观察风险和对方的回应，再决定是否投入。这种谨慎能保护你，也可能让你把等待确定感误当成行动前提。三次给予与保留显示，旅者正在练习把决定权从外部反馈拿回自己手中。`,
    selfAwareness: `旅者真正重视的不是“做对选择”，而是既不背叛自己的需要，也不让恐惧替你做决定。可以留意：你是在表达真实意愿，还是在提前避免失望？`,
    fallback: true,
    fallbackReason: 'AI 解读接口不可用，已使用本地备用解读。',
  };
}

// API endpoint to generate deep metaphorical interpretation
app.post('/api/interpret', async (req, res) => {
  const { stageHistory } = req.body as { stageHistory: StageRecord[] };

  if (!stageHistory || !Array.isArray(stageHistory) || stageHistory.length === 0) {
    return res.status(400).json({ error: 'Missing stageHistory data' });
  }
  const situation = deriveFocusSituation(stageHistory);

  // If no Gemini key is provided, gracefully use the handcrafted poetic engine
  if (!apiKey) {
    const fallback = generatePoeticFallback(stageHistory, situation);
    return res.json(fallback);
  }

  try {
    const historySummary = stageHistory
      .map((item, idx) => {
        return `第${idx + 1}次选择：
- 抽取塔罗：【${item.card.numeral} · ${item.card.nameZh} (${item.card.nameEn})】
- 遇到造物：${item.encounterName}
- 红色礼物选择：${item.offeredGift ? '【献出红色礼物】（促使卡牌逆向共鸣/转化）' : '【保留红色礼物，未给予】（守护内敛原质）'}
- 最终卡牌呈现状态：【${item.orientation === 'upright' ? '顺位 (Upright)' : '逆位 (Reversed)'}】`;
      })
      .join('\n\n');

    const prompt = `你是一位谨慎、温和的心理自我反思引导者。请根据玩家第一张塔罗牌的选择与相遇场景，对他此刻正在面对的核心议题做一个初步定性，再结合三次选择，把结果写成可验证的自我认知，而不是小说、诗歌或命运预言。

第一张牌形成的初步议题：${situation}

玩家记录：
${historySummary}

要求：
1. 直接回应这个初步议题，说明处境中的关键拉扯、可能的心理机制，以及选择模式如何影响判断。
2. 使用日常、清晰、非诊断性的心理学语言；不要做人格分类，不要使用 MBTI、星座或“你就是某种人”。
3. 承认不确定性，区分观察、推测和事实；不要把塔罗当作科学证据。
4. 不提供行动实验或任务清单，重点放在理解处境与自我认知。
5. 严格返回 JSON，不要 markdown：
{
  "metaphorTitle": "一句简洁的事件主题标题",
  "situationReading": "针对这件事的处境解读（120-180字）",
  "psychologicalInsight": "旅者的心理机制与选择模式（120-180字）",
  "selfAwareness": "旅者可以看见的关键心理线索与自我认知（80-140字）"
}`

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      // If parsing fails, extract JSON substring or use fallback
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json(parsed);
      }
      return res.json(generatePoeticFallback(stageHistory, situation));
    }
  } catch (error) {
    console.error('Gemini API call failed, falling back to poetic engine:', error);
    return res.json(generatePoeticFallback(stageHistory, situation));
  }
});

// Setup Vite or static serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gift for Universe server running on port ${PORT}`);
  });
}

setupServer();
