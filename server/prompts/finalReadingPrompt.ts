export type ReadingLanguage = 'zh' | 'en';

export interface ReadingScores {
  empathy: number;
  insight: number;
  hesitation: number;
  boundary: number;
}

/** Builds the short, warm final reading used by the AI provider. */
export function buildFinalReadingPrompt(
  language: ReadingLanguage,
  situation: string,
  historySummary: string,
  scores: ReadingScores,
): string {
  const scoreLine = `Empathy ${scores.empathy}; Insight ${scores.insight}; Hesitation ${scores.hesitation}; Boundary ${scores.boundary}`;

  if (language === 'en') {
    return `You are a careful, warm guide for psychological self-reflection. Write a short final reading that feels close in tone to a thoughtful local fallback reading: clear, gentle, concrete, and lightly metaphorical. Tarot and encounters are narrative mirrors, not evidence or prophecy. Do not diagnose, label personality types, or give an action plan.

The starting situation is: ${situation}

Journey record:
${historySummary}

Reflection scores (soft narrative cues only): ${scoreLine}

Use the journey details where they help, especially the movement between offering and keeping the gift. Let the most meaningful contrast among the four scores subtly shape the psychological insight (for example, high hesitation alongside lower boundary, or high empathy alongside lower insight). Mention that contrast at most once; do not list all four scores or turn the response into a score report. Keep the writing grounded and similar in length to a concise human reflection. Return strict JSON only, with no markdown:
{
  "metaphorTitle": "a short image-rich title",
  "situationReading": "one concise paragraph about what this journey seems to be holding",
  "psychologicalInsight": "one concise paragraph about the offer/keep pattern and its possible meaning",
  "selfAwareness": "one concise, recognizable observation"
}`;
  }

  return `你是一位谨慎、温和的心理自我反思引导者。请写一份简短的最终解读，语气接近一份好的本地备用解读：清晰、克制、具体，带有轻微的故事比喻。塔罗牌与相遇场景只是叙事镜面，不是证据或命运预言。不要做诊断、人格定型或行动计划。

这段旅程一开始触及的议题是：${situation}

旅途记录：
${historySummary}

四个反思分数（只是叙事线索）：共情${scores.empathy}，洞察${scores.insight}，犹豫${scores.hesitation}，边界${scores.boundary}。

请在有帮助的地方引用旅途中的牌、相遇和交付/保留礼物的变化。只根据四个分数中最有意义的一组高低对照，轻轻补充一句心理背景（例如犹豫较高而边界较低，或共情较高而洞察较低）；最多提到一次，不要逐项列分数，也不要把回答写成量表报告。篇幅保持在简洁的人类反思水平。严格只返回 JSON，不要 markdown：
{
  "metaphorTitle": "一句简短、有画面的标题",
  "situationReading": "一段简洁的处境解读",
  "psychologicalInsight": "一段简洁的心理机制解读，说明交付与保留可能意味着什么",
  "selfAwareness": "一个具体、容易辨认的自我观察"
}`;
}
