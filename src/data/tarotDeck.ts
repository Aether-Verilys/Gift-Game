import { TarotCardDef } from '../types';

export const ALL_TAROT_CARDS: TarotCardDef[] = [
  {
    id: 'tarot_fool',
    numeral: '0',
    nameEn: 'THE FOOL',
    nameZh: '愚者',
    keywordUpright: 'ORIGIN · 无畏探身',
    keywordReversed: 'PRESERVATION · 珍藏初念',
    archetype: 'journey',
    symbol: 'fool',
    encounter: {
      id: 'enc_seedling',
      name: '原初的蓝色幼苗',
      nameEn: 'Primordial Blue Seedling',
      theme: '初始与摇篮',
      prompt: '在冰冷星尘的裂隙中，一株散发着地球蓝光的脆弱幼苗正静默舒展。',
      type: 'seedling',
      visualHint: '一束破土而出的微光，宛如遥远母星寄来的最初请柬。',
      giftReactionOffered: '你将礼物放在幼苗根部。晶核的绯红温热渗入土壤，幼苗瞬间抽出生长出两片带有金色经脉的恒星之叶。',
      giftReactionKept: '你将礼物收回胸前。幼苗在寒风中微微摇曳，你默默为它挡下流星的细沙，保留着最初的敬畏。'
    }
  },
  {
    id: 'tarot_high_priestess',
    numeral: 'Ⅱ',
    nameEn: 'THE PRIESTESS',
    nameZh: '女祭司',
    keywordUpright: 'INTUITION · 静默明澈',
    keywordReversed: 'VEIL · 秘藏回响',
    archetype: 'void',
    symbol: 'watcher',
    encounter: {
      id: 'enc_archive_tome',
      name: '悬浮的时空石卷',
      nameEn: 'Suspended Chronicle of Time',
      theme: '直觉与隐秘',
      prompt: '一本由凝固光子构筑的古籍悬停空中，无数透明文字在虚空中游弋流转。',
      type: 'priestess',
      visualHint: '一页页翻动的时空书页，记录着未曾被发声的宇宙秘密。',
      giftReactionOffered: '你把礼物推向石卷。赤红的光丝渗入透明文字，整本书卷泛起温润的霞光，折叠出一条通向深空的引力隧道。',
      giftReactionKept: '你握紧礼物没有交付。石卷缓缓合拢，在虚空中为你投下一道宁静的无字光斑，任由谜团安眠。'
    }
  },
  {
    id: 'tarot_emperor',
    numeral: 'Ⅳ',
    nameEn: 'THE EMPEROR',
    nameZh: '皇帝',
    keywordUpright: 'ORDER · 秩序定锚',
    keywordReversed: 'SOFTENING · 融化疆界',
    archetype: 'fate',
    symbol: 'monolith',
    encounter: {
      id: 'enc_hypercube',
      name: '自旋的高维超正方体',
      nameEn: 'Spinning Hypercube',
      theme: '秩序与边界',
      prompt: '一座绝对对称的四维几何超立方体正在虚空中以精准的数学节奏无声自旋。',
      type: 'emperor',
      visualHint: '线条森严的几何骨架，折射出整个星系不变的引力常数。',
      giftReactionOffered: '你将礼物掷向几何中心。坚硬森严的晶体边缘骤然柔化，化作如水波般荡漾的光带，接纳了未知的温度。',
      giftReactionKept: '你保留了礼物。超立方体继续精确运转，其凛然的阴影如一座守护的堡垒，护送你安然穿过引力紊流。'
    }
  },
  {
    id: 'tarot_hierophant',
    numeral: 'Ⅴ',
    nameEn: 'THE HIEROPHANT',
    nameZh: '教皇',
    keywordUpright: 'BEACON · 薪火相传',
    keywordReversed: 'UNBOUND · 独寻道标',
    archetype: 'fate',
    symbol: 'beacon',
    encounter: {
      id: 'enc_beacon_spire',
      name: '星球上的巨像教皇',
      nameEn: 'Colossal Hierophant',
      theme: '誓约与传统',
      prompt: '巨大的教皇立于星球地表，三重冠冕没入星光，长袍垂落如山壁。旅者与白马停在权杖投下的阴影里。',
      type: 'hierophant',
      visualHint: '冠冕、祝祷的手掌与植入大地的权杖，构成一座沉默的人形圣殿。',
      giftReactionOffered: '旅者将礼物献于巨像脚下。绯红沿长袍的纹路向上流淌，照亮教皇的冠冕与祝祷的手掌。',
      giftReactionKept: '旅者保留礼物，仰望沉默的教皇。权杖仍立于大地，旅者在古老秩序面前守住自己的判断。'
    }
  },
  {
    id: 'tarot_lovers',
    numeral: 'Ⅵ',
    nameEn: 'THE LOVERS',
    nameZh: '恋人',
    keywordUpright: 'BOND · 灵魂同频',
    keywordReversed: 'AUTONOMY · 守望独岛',
    archetype: 'empathy',
    symbol: 'lovers',
    encounter: {
      id: 'enc_twin_core',
      name: '双生互绕的共鸣星核',
      nameEn: 'Twin Resonant Cores',
      theme: '陪伴与契约',
      prompt: '两颗微缩星核在磁力线上互相环绕起舞，如同一对永不分开的星辰舞者。',
      type: 'twin_core',
      visualHint: '相互追逐却永不相撞的微光，折射出陪伴的至高张力。',
      giftReactionOffered: '你奉上礼物。双核吸纳了这枚赤红第三极，共振出横跨夜空的双色彩虹，轻柔拂过白马与你的额头。',
      giftReactionKept: '你微笑着收好礼物。双核在前方继续纯粹的二重奏，白马靠近你的手臂，无声印证着彼此之间不可替代的距离。'
    }
  },
  {
    id: 'tarot_chariot',
    numeral: 'Ⅶ',
    nameEn: 'THE CHARIOT',
    nameZh: '战车',
    keywordUpright: 'MOMENTUM · 决意破障',
    keywordReversed: 'PAUSE · 驻马听涛',
    archetype: 'empathy',
    symbol: 'chariot',
    encounter: {
      id: 'enc_gravity_bridge',
      name: '失重裂谷的星桥悬索',
      nameEn: 'Starbridge Over the Rift',
      theme: '勇气与决断',
      prompt: '深不见底的引力裂谷横亘在眼前，仅有一道由细微光子绷紧的悬索通向对岸。',
      type: 'chariot',
      visualHint: '深渊之上的纤薄天平，唯有坚定的信念方能踏足。',
      giftReactionOffered: '你将礼物抛向对岸。赤色光波如焰火铺展，瞬间将纤细悬索拓宽成一条坚如磐石的赤红光轨。',
      giftReactionKept: '你握紧礼物提缰轻跃。白马踏上细如琴弦的光索，每一步都踏在生与死的节点上，凭借纯粹的信任踏空而过。'
    }
  },
  {
    id: 'tarot_hermit',
    numeral: 'Ⅸ',
    nameEn: 'THE HERMIT',
    nameZh: '隐士',
    keywordUpright: 'LANTERN · 孤光自照',
    keywordReversed: 'THAW · 融雪分光',
    archetype: 'void',
    symbol: 'hermit',
    encounter: {
      id: 'enc_solitary_lantern',
      name: '虚空灯塔守望者',
      nameEn: 'Void Lantern Watcher',
      theme: '内省与沉静',
      prompt: '一盏悬挂于极低空中的磨砂黑曜石提灯，内部微弱地燃烧着一星恒古火苗。',
      type: 'lantern',
      visualHint: '在苍茫夜色中孤立自守的一豆微光，驱散了十步以内的虚无。',
      giftReactionOffered: '你把礼物送入提灯。冷冽的磨砂玻璃立刻被透亮的赤光注满，向四面八方倾泻出久违的温暖炊烟气息。',
      giftReactionKept: '你静立在提灯投下的光圈中，将自己的礼物悄然暖在怀中。两簇火苗在暗夜中隔空相望，共享着各自的寂寥。'
    }
  },
  {
    id: 'tarot_wheel_of_fortune',
    numeral: 'Ⅹ',
    nameEn: 'WHEEL OF FORTUNE',
    nameZh: '命运之轮',
    keywordUpright: 'CYCLES · 顺流潮转',
    keywordReversed: 'CENTER · 渊停岳峙',
    archetype: 'fate',
    symbol: 'rings',
    encounter: {
      id: 'enc_astrolabe',
      name: '青铜与玄冰星轨天象仪',
      nameEn: 'Bronze Ice Astrolabe',
      theme: '时运与自处',
      prompt: '一座巨大的多层环形天象仪在平原上徐徐啮合运转，齿轮之间流泻着冰晶与恒星风。',
      type: 'astrolabe',
      visualHint: '无数交错的轨道环圈，预言着每次相聚与离散的精确度数。',
      giftReactionOffered: '你将礼物放在天象仪的中心轴。巨环轰然转动加速，为你开启了通往下一处神秘星域的直达星环通路。',
      giftReactionKept: '你立于天象仪庞大的阴影下，不曾拨动它的指针。你明白命运自有其起落，而你的方向只在自己脚下。'
    }
  },
  {
    id: 'tarot_tower',
    numeral: 'ⅩⅥ',
    nameEn: 'THE TOWER',
    nameZh: '高塔',
    keywordUpright: 'FRACTURE · 击碎幻象',
    keywordReversed: 'RENEWAL · 拾玉瓦砾',
    archetype: 'journey',
    symbol: 'prism',
    encounter: {
      id: 'enc_shattered_prism',
      name: '倾颓的时空棱镜尖峰',
      nameEn: 'Shattered Prism Spire',
      theme: '破立与重塑',
      prompt: '一片巨大的反光镜群在地面上碎裂成千百块镜片，每一面镜片都折射着截然不同的平行世界。',
      type: 'prism',
      visualHint: '斑驳倒塌的旧日幻境，暴露出底层最赤裸裸的虚空真实。',
      giftReactionOffered: '你将礼物按在最大的一块断镜上。赤红如熔岩般将满地碎片重新黏合，淬炼成一尊崭新的透光方碑。',
      giftReactionKept: '你踩过破碎的水银镜片，任由幻象在蹄下嘎吱作响。你保留了完整的礼物，未曾留恋碎裂的梦境。'
    }
  },
  {
    id: 'tarot_star',
    numeral: 'ⅩⅦ',
    nameEn: 'THE STAR',
    nameZh: '星辰',
    keywordUpright: 'SPRING · 倾注甘霖',
    keywordReversed: 'RECHARGE · 潜泉暗蓄',
    archetype: 'light',
    symbol: 'star',
    encounter: {
      id: 'enc_hesitation_spring',
      name: '失重液态星光泉',
      nameEn: 'Weightless Starlight Spring',
      theme: '希望与自愈',
      prompt: '一汪无重力悬浮的银色流体清泉，正轻柔地泛起涟漪，洗涤着周围的宇宙尘埃。',
      type: 'spring',
      visualHint: '清澈不冻的流动光体，能抚平漫长星际跋涉留下的每一道划痕。',
      giftReactionOffered: '你让礼物滑入银泉。泉水泛起欢愉的绯红浪花，化作甘霖淋湿白马与你的风衣，赋予全身轻灵的飘浮力。',
      giftReactionKept: '你仅在泉边掬起一捧清水饮下，保留了礼物的干燥。你知道有些力量需留到最寒冷的深夜才可取用。'
    }
  },
  {
    id: 'tarot_sun',
    numeral: 'ⅩⅨ',
    nameEn: 'THE SUN',
    nameZh: '太阳',
    keywordUpright: 'DAWN · 炽烈迸发',
    keywordReversed: 'EMBER · 余烬心火',
    archetype: 'creation',
    symbol: 'sun',
    encounter: {
      id: 'enc_dawn_hearth',
      name: '初生恒星的温室火炉',
      nameEn: 'Newborn Solar Hearth',
      theme: '新生与炽热',
      prompt: '一颗刚诞生的微型脉冲太阳悬在地面三尺之上，散发着麦浪与烘烤般的纯白暖意。',
      type: 'sun',
      visualHint: '宛如新烤麦包般香甜的金色微光，彻底驱散了四周百里的霜冻。',
      giftReactionOffered: '你将礼物奉入金炉。烈焰欢呼般暴涨，化作漫天耀眼的暖日拂晓，照亮了整个天际线的远山。',
      giftReactionKept: '你坐在火炉旁烤暖了双手，把礼物贴在心口。你静静凝视着初阳，享受着这片刻无需付出代价的温柔。'
    }
  },
  {
    id: 'tarot_world',
    numeral: 'ⅩⅩⅠ',
    nameEn: 'THE WORLD',
    nameZh: '世界',
    keywordUpright: 'COMPLETION · 圆融通达',
    keywordReversed: 'INFINITE · 未完待续',
    archetype: 'creation',
    symbol: 'world',
    encounter: {
      id: 'enc_ouroboros_gate',
      name: '回旋衔尾蛇星环门',
      nameEn: 'Ouroboros Gateway',
      theme: '圆满与新生',
      prompt: '一道由咬尾星蛇构成的发光巨拱耸立在天地尽头，拱门背后是一片重新呼吸的崭新星云。',
      type: 'gateway',
      visualHint: '首尾相衔的闭环之门，标志着一段旅程的极点与下一次跨越。',
      giftReactionOffered: '你将礼物镶入衔尾蛇的眼瞳。整座星环之门轰然洞开，万千星芒如群鸽展翅，铺就一条通往高维维度的天阶。',
      giftReactionKept: '你牵着白马立于门前，将礼物系在马鞍之上。你没有急于跨入门扉，而是回头望了一眼走过的足迹，平静微笑。'
    }
  }
];

// Helper to draw 3 distinct random cards for a stage
export function drawThreeCards(excludedIds: string[] = []): TarotCardDef[] {
  const available = ALL_TAROT_CARDS.filter((c) => !excludedIds.includes(c.id));
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  const drawn = shuffled.slice(0, 3).map((card) => ({
    ...card,
    drawnOrientation: Math.random() < 0.45 ? ('reversed' as const) : ('upright' as const),
  }));

  // Keep both polarities visible in every three-card spread so a spread never
  // accidentally presents as three upright cards.
  if (drawn.length > 1 && drawn.every((card) => card.drawnOrientation === 'upright')) {
    drawn[0].drawnOrientation = 'reversed';
  } else if (drawn.length > 1 && drawn.every((card) => card.drawnOrientation === 'reversed')) {
    drawn[0].drawnOrientation = 'upright';
  }
  return drawn;
}
