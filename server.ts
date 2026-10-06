import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildFinalReadingPrompt, type ReadingLanguage, type ReadingScores } from './server/prompts/finalReadingPrompt';

// Load local secrets for development. `.env.local` takes precedence over
// `.env`, and both are ignored by Git (see .gitignore).
dotenv.config({ path: ['.env.local', '.env'] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// DeepSeek exposes an OpenAI-compatible chat completions endpoint. Keep the
// provider behind the server so the browser never receives the API key.
const apiKey = process.env.DEEPSEEK_API_KEY;
const deepSeekBaseUrl = (process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const deepSeekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

interface StageRecord {
  stage: number;
  stageName?: string;
  card: {
    numeral: string;
    nameEn: string;
    nameZh: string;
    keyword: string;
    keywordUpright?: string;
    keywordReversed?: string;
    archetype: string;
    symbol: string;
    encounter?: {
      giftReactionOffered: string;
      giftReactionKept: string;
    };
  };
  orientation: 'upright' | 'reversed';
  offeredGift: boolean;
  encounterName: string;
  encounterDesc: string;
}

// Fallback poetic generator in case API key is missing or service unavailable

function deriveFocusSituation(history: StageRecord[], language: ReadingLanguage = 'zh') {
  const first = history[0];
  if (language === 'en') {
    if (!first) return 'the choice and direction taking shape now';
    const themes: Record<string, string> = {
      'THE FOOL': 'whether to take a first step into the unknown, and how to meet it',
      'THE PRIESTESS': 'how to trust intuition while handling what has not been said',
      'THE EMPEROR': 'how to build boundaries, order, and sustainable control',
      'THE HIEROPHANT': 'how to choose between inherited rules and your own path',
      'THE LOVERS': 'closeness, commitment, and autonomy within a relationship',
      'THE CHARIOT': 'how to decide and act under pressure and uncertainty',
      'THE HERMIT': 'how to be alone, sort inner needs, and hear your own judgment',
      'WHEEL OF FORTUNE': 'how to meet change, timing, and what cannot be controlled',
      'THE TOWER': 'how to handle a loosening structure, conflict, or sudden change',
      'THE STAR': 'how to restore hope and turn a wish into a direction in reality',
      'THE MOON': 'how to tell anxiety, imagination, and real signals apart',
      'THE SUN': 'how to let yourself be seen and name the life you truly want',
      'THE WORLD': 'how to complete one chapter and choose where to go next',
    };
    return themes[first.card.nameEn] || `the choice, relationship, and self-positioning reflected by ${first.card.nameEn}`;
  }
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

function resolveReadingScores(scores: Partial<ReadingScores> | undefined, history: StageRecord[]): ReadingScores {
  const offered = history.filter((item) => item.offeredGift).length;
  return {
    empathy: Number.isFinite(scores?.empathy) ? Number(scores?.empathy) : 2 + offered * 2 + (history.length - offered),
    insight: Number.isFinite(scores?.insight) ? Number(scores?.insight) : 2 + offered + (history.length - offered) * 2,
    hesitation: Number.isFinite(scores?.hesitation) ? Number(scores?.hesitation) : 2 + offered * 3 + (history.length - offered),
    boundary: Number.isFinite(scores?.boundary) ? Number(scores?.boundary) : 2 + (history.length - offered) * 2,
  };
}

function generatePoeticFallback(
  history: StageRecord[],
  focusSituation: string | undefined,
  language: ReadingLanguage = 'zh',
  scores: ReadingScores = resolveReadingScores(undefined, history),
) {
  const resolvedSituation = focusSituation ?? deriveFocusSituation(history, language);
  if (language === 'en') {
    const first = history[0];
    const second = history[1];
    const third = history[2];
    const topic = first ? `the choice and self-positioning reflected by ${first.card.nameEn}` : 'the choice and direction taking shape now';
    const giftCount = history.filter((h) => h.offeredGift).length;
    const cardLabel = (item: StageRecord | undefined) => item ? `${item.card.nameEn} (${item.orientation})` : 'an unrecorded card';
    const choiceLabel = (item: StageRecord | undefined) => item?.offeredGift ? 'offered the gift' : 'kept the gift';
    const encounterLabel = (item: StageRecord | undefined) => item?.encounterName || 'the unnamed encounter';
    const responseLabel = (item: StageRecord | undefined) => {
      if (!item) return 'No response was recorded.';
      return item.card.encounter?.[item.offeredGift ? 'giftReactionOffered' : 'giftReactionKept'] || item.encounterDesc;
    };
    let metaphorTitle = 'A red ember carried through three kinds of weather';
    if (giftCount === 3) metaphorTitle = 'The ember that never stopped moving';
    else if (giftCount === 0) metaphorTitle = 'The ember kept beneath the coat';
    else if (first?.offeredGift && second && !second.offeredGift) metaphorTitle = 'A hand opened, then closed around the light';
    return {
      metaphorTitle: `${metaphorTitle}: an inner map for ${topic}`,
      situationReading: `The journey begins with ${cardLabel(first)} at ${encounterLabel(first)}: you ${choiceLabel(first)}, and the encounter answers, “${responseLabel(first)}” That first exchange makes contact possible, but it also makes the cost of contact visible. In the middle, ${cardLabel(second)} brings you to ${encounterLabel(second)}, where you ${choiceLabel(second)}. The light is no longer being tested by distance; it is being tested by a limit. By the final scene, ${cardLabel(third)} meets ${encounterLabel(third)} and you ${choiceLabel(third)}. The return matters because the last offering is not the same as the first: it carries the memory of what you chose to protect. Read as a mirror, the arc is about learning whether closeness can remain real after you stop treating openness as an all-or-nothing act.`,
      psychologicalInsight: `Your four scores give the arc a sharper shape: empathy ${scores.empathy}, insight ${scores.insight}, hesitation ${scores.hesitation}, and boundary ${scores.boundary}. Empathy and insight describe how clearly you register another presence; hesitation and boundary describe the price you attach to being affected by it. The middle decision to keep the gift can therefore be understood as a test: can the relationship or possibility remain there without immediate proof from you? When you offer again, the act is more deliberate because it follows that test. The numbers are narrative signals rather than a diagnosis, but their contrast points to a specific tension: you may understand what is happening before you feel safe enough to participate in it.`,
      selfAwareness: 'Notice the exact moment when “I need to understand more” appears. Ask whether it is naming a real boundary, or quietly asking fear to postpone a choice that your empathy and insight have already made legible.',
      fallback: true,
      fallbackReason: 'The reading service is unavailable, so this local fallback reading is being shown.',
    };
  }
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

  const encounterText = (item: StageRecord) => item.encounterName || item.encounterDesc;
  const reactionText = (item: StageRecord) => item.card.encounter?.[item.offeredGift ? 'giftReactionOffered' : 'giftReactionKept'] || item.encounterDesc;
  const journeyReflection = `第一程是【${c1.card.nameZh}】（${c1.orientation === 'upright' ? '顺位' : '逆位'}）与“${encounterText(c1)}”：你${c1.offeredGift ? '交付' : '保留'}礼物，回应是“${reactionText(c1)}”。第二程来到【${c2.card.nameZh}】（${c2.orientation === 'upright' ? '顺位' : '逆位'}）与“${encounterText(c2)}”：你${c2.offeredGift ? '再次交付' : '收回'}，让边界先说话。终程的【${c3.card.nameZh}】把这段迟疑带回到行动里，你${c3.offeredGift ? '再次交付' : '仍然保留'}，但它已不再是第一幕的同一个动作。四个维度留下的轨迹是：共情${scores.empathy}、洞察${scores.insight}、犹豫${scores.hesitation}、边界${scores.boundary}。`;

  return {
    metaphorTitle: `关于“${resolvedSituation}”的内在地图`,
    situationReading: `就“${resolvedSituation}”而言，旅者的选择呈现出一种在靠近与保护之间反复校准的过程。旅者并非缺少答案，而是在评估投入之后的代价、关系是否可靠，以及什么边界必须保留。`,
    psychologicalInsight: `${journeyReflection} 这组分数进一步照亮了拉扯：共情${scores.empathy}与洞察${scores.insight}说明你并非看不见他者；犹豫${scores.hesitation}和边界${scores.boundary}则显示，真正困难的是决定何时让对方靠近。保留礼物像把火种护在掌心，交付礼物像承认火光必须离开掌心才会照见别处。这里的分数只是叙事线索，不是诊断。`,
    selfAwareness: `留意那个“再确认一下”的瞬间：当共情和洞察已经足够，而犹豫仍在上升时，你是在保护一条必要的边界，还是在用准备的名义推迟被看见？`,
    fallback: true,
    fallbackReason: 'AI 解读接口不可用，已使用本地备用解读。',
  };
}

// API endpoint to generate deep metaphorical interpretation
app.post('/api/interpret', async (req, res) => {
  const { stageHistory, language: requestedLanguage, scores: requestedScores } = req.body as {
    stageHistory: StageRecord[];
    language?: string;
    scores?: Partial<ReadingScores>;
  };
  const language: ReadingLanguage = requestedLanguage === 'en' ? 'en' : 'zh';

  if (!stageHistory || !Array.isArray(stageHistory) || stageHistory.length === 0) {
    return res.status(400).json({ error: 'Missing stageHistory data' });
  }
  const situation = deriveFocusSituation(stageHistory, language);
  const scores = resolveReadingScores(requestedScores, stageHistory);

  // If no DeepSeek key is provided, gracefully use the handcrafted poetic engine
  if (!apiKey) {
    const fallback = generatePoeticFallback(stageHistory, situation, language, scores);
    return res.json(fallback);
  }

  try {
    const historySummary = stageHistory
      .map((item, idx) => {
        const keyword = item.orientation === 'upright' ? (item.card.keywordUpright ?? item.card.keyword) : (item.card.keywordReversed ?? item.card.keyword);
        const reaction = item.offeredGift ? (item.card.encounter?.giftReactionOffered ?? item.encounterDesc) : (item.card.encounter?.giftReactionKept ?? item.encounterDesc);
        if (language === 'en') {
          return `Scene ${idx + 1} (${item.stageName ?? 'stage'}):\n- Tarot: [${item.card.numeral} · ${item.card.nameEn}]\n- Keyword in this orientation: ${keyword}\n- Encounter image: ${item.encounterName}\n- Scene description: ${item.encounterDesc}\n- Gift choice: ${item.offeredGift ? '[offered]' : '[kept]'}\n- Encounter response: ${reaction}\n- Final orientation: [${item.orientation === 'upright' ? 'Upright' : 'Reversed'}]`;
        }
        return `第${idx + 1}次选择：
- 抽取塔罗：【${item.card.numeral} · ${item.card.nameZh} (${item.card.nameEn})】
- 这一状态的关键词：${keyword}
- 遇到造物：${item.encounterName}
- 相遇场景：${item.encounterDesc}
- 红色礼物选择：${item.offeredGift ? '【献出红色礼物】（促使卡牌逆向共鸣/转化）' : '【保留红色礼物，未给予】（守护内敛原质）'}
- 造物回应：${reaction}
- 最终卡牌呈现状态：【${item.orientation === 'upright' ? '顺位 (Upright)' : '逆位 (Reversed)'}】`;
      })
      .join('\n\n');

    const prompt = buildFinalReadingPrompt(language, situation, historySummary, scores);

    const response = await fetch(`${deepSeekBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: deepSeekModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek request failed (${response.status}): ${errorText.slice(0, 300)}`);
    }

    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content || '';
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
      return res.json(generatePoeticFallback(stageHistory, situation, language, scores));
    }
  } catch (error) {
    console.error('DeepSeek API call failed, falling back to poetic engine:', error);
    return res.json(generatePoeticFallback(stageHistory, situation, language, scores));
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
