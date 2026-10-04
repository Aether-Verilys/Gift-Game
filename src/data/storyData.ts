import { StoryNode, Ending } from '../types';

export const ENDINGS: Record<string, Ending> = {
  steed_ascension: {
    id: 'steed_ascension',
    title: 'Ascension of the Steed · 天琴白马',
    subtitle: 'To Merge with the Constellations',
    theme: 'transcendence',
    epitaph: '松开缰绳那一刻，星辰尽头诞生了永不熄灭的巡天座。',
    fullPoem: [
      '你轻轻放开缰绳，它额前的星辉化作漫天黎明。',
      '它并未离去，只是融入了浩瀚的宇宙微波背景。',
      '每当你的披风拂过星尘，虚空中总有温暖的马鬃如轻风掠过。',
      '一人，一马，整片不再孤独的星系。'
    ]
  },
  pale_blue_dot: {
    id: 'pale_blue_dot',
    title: 'The Pale Blue Dot · 暗淡蓝点',
    subtitle: 'Echoes of the Cradle',
    theme: 'grounding',
    epitaph: '跨越数十亿光年，在光谱褶皱的边缘，重见那粒悬浮的尘埃。',
    fullPoem: [
      '马蹄踏过最后的引力折射，冰冷的虚空退潮而去。',
      '一颗宛如蓝色泪滴的行星静候在晨光里，带来带着野草与微雨的清风。',
      '你在微温的天空下抚摸旅伴的脊背。',
      '漫游的终点从不是征服宇宙，而是归来，拥抱最初的摇篮。'
    ]
  },
  eternal_watchers: {
    id: 'eternal_watchers',
    title: 'The Eternal Watchers · 永恒巡礼',
    subtitle: 'The Infinite Companions',
    theme: 'stoicism',
    epitaph: '以苍穹为局，以星辰为子；在世界的视界线上，一步步丈量永恒。',
    fullPoem: [
      '你未曾重塑奇点，亦未向虚无低头。',
      '只要蹄声未绝，这颗孤独的天体就永远拥有脉搏。',
      '数亿年后，漫游的光子仍将记录下这道永恒的剪影：',
      '披风漫行者与高洁的白马，静静漫步于星芒与长夜之间。'
    ]
  },
  nova_genesis: {
    id: 'nova_genesis',
    title: 'The New Genesis · 创世黎明',
    subtitle: 'The Spark that Kindled Epochs',
    theme: 'creation',
    epitaph: '身后留下的余温，成为了这片死寂星区第一颗新生太阳的火种。',
    fullPoem: [
      '奇点在掌心化作亿万道倾泻的极光。',
      '纤细的几何向外伸展，编织出崭新的星云与轨道面。',
      '宇宙重新获得了温度与绚丽的光谱。',
      '而两位漫行者的传奇，已被铭刻在最初的自旋与光辉之中。'
    ]
  }
};

export const STORY_NODES: Record<string, StoryNode> = {
  start: {
    id: 'start',
    chapter: 'PROLOGUE · THE LONE STAR',
    title: 'Silent Odyssey',
    prompt: '翻开命运塔罗，向星海问卜前路。',
    speaker: '星空低语',
    choices: [
      {
        id: 'c_start_star',
        tarot: {
          numeral: 'ⅩⅦ',
          nameEn: 'THE STAR',
          nameZh: '星辰',
          keyword: 'GUIDANCE · 追寻微光',
          archetype: 'light',
          symbol: 'star'
        },
        text: 'Follow the Star Beacon',
        subtext: 'Trust the stride into the warm glow',
        nextNodeId: 'beacon_encounter',
        effects: { bond: 2, starlight: 2 },
        narration: '星光垂落，白马与你的呼吸在冰冷虚空中同频起伏。',
        sceneryShift: 'normal'
      },
      {
        id: 'c_start_hermit',
        tarot: {
          numeral: 'Ⅸ',
          nameEn: 'THE HERMIT',
          nameZh: '隐士',
          keyword: 'INTROSPECTION · 潮汐深思',
          archetype: 'void',
          symbol: 'hermit'
        },
        text: 'Contemplate Void Tides',
        subtext: 'In deep silence, listen to the stars',
        nextNodeId: 'deep_abyss',
        effects: { insight: 2, voidAffinity: 2 },
        narration: '远方星光在视界边缘弯折成弦，于静默中沉淀出至深的宁静。',
        sceneryShift: 'aurora'
      }
    ]
  },

  beacon_encounter: {
    id: 'beacon_encounter',
    chapter: 'ACT I · THE ABANDONED BEACON',
    title: 'Sleeping Signal Tower',
    prompt: '残缺的信标在星尘中轻吟，命运之牌应声浮现。',
    speaker: '信标残响',
    choices: [
      {
        id: 'c_beacon_sun',
        tarot: {
          numeral: 'ⅩⅨ',
          nameEn: 'THE SUN',
          nameZh: '太阳',
          keyword: 'KINDLE · 点亮芯火',
          archetype: 'creation',
          symbol: 'sun'
        },
        text: 'Kindle the Stellar Core',
        subtext: 'A burst of flame to pierce the night',
        nextNodeId: 'crystal_field',
        effects: { starlight: 3, bond: 1 },
        narration: '信标谐振迸发，一道纯净的银光划破深空长夜。',
        sceneryShift: 'meteor_shower'
      },
      {
        id: 'c_beacon_hierophant',
        tarot: {
          numeral: 'Ⅴ',
          nameEn: 'THE HIEROPHANT',
          nameZh: '教皇',
          keyword: 'RECORD · 铭刻星纹',
          archetype: 'fate',
          symbol: 'beacon'
        },
        text: 'Trace Ancient Glyphs',
        subtext: 'Bearing witness to what once was',
        nextNodeId: 'crystal_field',
        effects: { insight: 3, voidAffinity: 1 },
        narration: '指尖轻触风化的几何符文，沉睡的信息在漫游纪中苏醒。',
        sceneryShift: 'normal'
      },
      {
        id: 'c_beacon_priestess',
        tarot: {
          numeral: 'Ⅱ',
          nameEn: 'THE PRIESTESS',
          nameZh: '女祭司',
          keyword: 'SILENCE · 拂尘静默',
          archetype: 'void',
          symbol: 'watcher'
        },
        text: 'Pass in Reverent Silence',
        subtext: 'Let the sleeping dust rest in peace',
        nextNodeId: 'ring_passage',
        effects: { voidAffinity: 2, insight: 2 },
        narration: '不惊动沉睡之物，你们在阴影中滑行，敬畏被遗忘的永恒。',
        sceneryShift: 'rings'
      }
    ]
  },

  deep_abyss: {
    id: 'deep_abyss',
    chapter: 'ACT I · VOID TIDES',
    title: 'Edge of the Gravity Chasm',
    prompt: '重力深渊扭曲虚空，秘仪之牌指引去向。',
    speaker: '白马的凝视',
    choices: [
      {
        id: 'c_abyss_chariot',
        tarot: {
          numeral: 'Ⅶ',
          nameEn: 'THE CHARIOT',
          nameZh: '战车',
          keyword: 'LEAP · 驭光越境',
          archetype: 'bond',
          symbol: 'chariot'
        },
        text: 'Clasp Reins Across the Chasm',
        subtext: 'Bound by trust, the void cannot claim you',
        nextNodeId: 'crystal_field',
        effects: { bond: 3, starlight: 1 },
        narration: '白马踏出失重的涟漪，信任如看不见的丝线跨越黑暗。',
        sceneryShift: 'aurora'
      },
      {
        id: 'c_abyss_moon',
        tarot: {
          numeral: 'ⅩⅧ',
          nameEn: 'THE MOON',
          nameZh: '月亮',
          keyword: 'DILATION · 窥视膨胀',
          archetype: 'void',
          symbol: 'abyss'
        },
        text: 'Cast Light into Horizon',
        subtext: 'Witness the curvature of spacetime',
        nextNodeId: 'ring_passage',
        effects: { insight: 3, voidAffinity: 2 },
        narration: '光子在奇点边界拉长为纤细光弦，记录下时空的极致曲率。',
        sceneryShift: 'black_hole'
      }
    ]
  },

  crystal_field: {
    id: 'crystal_field',
    chapter: 'ACT II · PRISM WASTES',
    title: 'Sea of Mirrored Memories',
    prompt: '棱镜之海升起，抽取契合灵魂的倒影。',
    speaker: '时空镜面',
    choices: [
      {
        id: 'c_crystal_lovers',
        tarot: {
          numeral: 'Ⅵ',
          nameEn: 'THE LOVERS',
          nameZh: '恋人',
          keyword: 'MEMORY · 故土麦浪',
          archetype: 'bond',
          symbol: 'lovers'
        },
        text: 'Touch the Memory Facet',
        subtext: 'Cherishing the warmth of earthly wheat',
        nextNodeId: 'monolith_dialogue',
        effects: { bond: 3, starlight: 2 },
        narration: '晶面回荡着遥远蔚蓝星球的风声，白马轻蹭你的掌心。',
        sceneryShift: 'normal'
      },
      {
        id: 'c_crystal_tower',
        tarot: {
          numeral: 'ⅩⅥ',
          nameEn: 'THE TOWER',
          nameZh: '高塔',
          keyword: 'SHATTER · 踏碎幻影',
          archetype: 'journey',
          symbol: 'prism'
        },
        text: 'Shatter Reflections Forward',
        subtext: 'The road ahead belongs to open stars',
        nextNodeId: 'monolith_dialogue',
        effects: { voidAffinity: 3, insight: 2 },
        narration: '镜晶在马蹄下碎裂如霜，前路唯有无限星河。',
        sceneryShift: 'monolith'
      }
    ]
  },

  ring_passage: {
    id: 'ring_passage',
    chapter: 'ACT II · RING SHADOWS',
    title: 'Stripes of Silver and Ink',
    prompt: '星环光瀑横亘苍穹，命运塔罗在环带中沉浮。',
    speaker: '环带谐振',
    choices: [
      {
        id: 'c_ring_wheel',
        tarot: {
          numeral: 'Ⅹ',
          nameEn: 'WHEEL OF FORTUNE',
          nameZh: '命运之轮',
          keyword: 'SILVER · 逐光冰带',
          archetype: 'fate',
          symbol: 'rings'
        },
        text: 'Trot Along Silver Ribbons',
        subtext: 'Chasing starlight across icy rings',
        nextNodeId: 'monolith_dialogue',
        effects: { starlight: 3, bond: 1 },
        narration: '马蹄在结晶星环上叩出清脆风铃，溅起阵阵银白彗尾。',
        sceneryShift: 'meteor_shower'
      },
      {
        id: 'c_ring_hanged',
        tarot: {
          numeral: 'ⅩⅡ',
          nameEn: 'THE HANGED MAN',
          nameZh: '倒吊人',
          keyword: 'SOLACE · 潜入暗影',
          archetype: 'void',
          symbol: 'watcher'
        },
        text: 'Step into Obsidian Shadow',
        subtext: 'Finding quiet solace in the deep',
        nextNodeId: 'monolith_dialogue',
        effects: { voidAffinity: 3, insight: 2 },
        narration: '步入绝对的黑曜石阴影，身旁温热的呼吸是宇宙唯一的标尺。',
        sceneryShift: 'rings'
      }
    ]
  },

  monolith_dialogue: {
    id: 'monolith_dialogue',
    chapter: 'ACT III · THE SENTINEL',
    title: 'The Floating Sentinel',
    prompt: '高维丰碑无声叩问，三张真理塔罗在此共振。',
    speaker: '高维哨卫',
    choices: [
      {
        id: 'c_mono_temperance',
        tarot: {
          numeral: 'ⅩⅣ',
          nameEn: 'TEMPERANCE',
          nameZh: '节制',
          keyword: 'AFFINITY · 爱与同行',
          archetype: 'bond',
          symbol: 'lovers'
        },
        text: '“Love Still Measures Light-Years”',
        subtext: 'The universe is measured by companionship',
        nextNodeId: 'crossroads',
        effects: { bond: 3, starlight: 2 },
        narration: '丰碑泛起暖银色的潮汐，在二人身前化为前行的通路。',
        sceneryShift: 'aurora'
      },
      {
        id: 'c_mono_emperor',
        tarot: {
          numeral: 'Ⅳ',
          nameEn: 'THE EMPEROR',
          nameZh: '皇帝',
          keyword: 'COSMOS · 自然法则',
          archetype: 'fate',
          symbol: 'monolith'
        },
        text: '“The Cosmos Needs No Purpose”',
        subtext: 'Harmonizing with immutable natural law',
        nextNodeId: 'crossroads',
        effects: { insight: 4, voidAffinity: 2 },
        narration: '超正方体几何静默翻转，向你展现宇宙最朴素的自洽。',
        sceneryShift: 'monolith'
      },
      {
        id: 'c_mono_hermit',
        tarot: {
          numeral: 'Ⅸ',
          nameEn: 'THE HERMIT',
          nameZh: '隐士',
          keyword: 'WATER · 凝露赠尘',
          archetype: 'void',
          symbol: 'hermit'
        },
        text: 'Pour Water onto Stardust',
        subtext: 'Silence is the ultimate cosmic answer',
        nextNodeId: 'crossroads',
        effects: { bond: 2, voidAffinity: 3 },
        narration: '一滴甘露在星尘上凝为冰霜之花，沉默是对永恒最好的敬意。',
        sceneryShift: 'normal'
      }
    ]
  },

  crossroads: {
    id: 'crossroads',
    chapter: 'ACT IV · THE CROSSROADS',
    title: 'The Final Horizon',
    prompt: '时空在奇点坍缩，翻开执掌结局的终末大阿尔卡那。',
    speaker: '命运十字路口',
    choices: [
      {
        id: 'c_end_world',
        tarot: {
          numeral: 'ⅩⅩⅠ',
          nameEn: 'THE WORLD',
          nameZh: '世界',
          keyword: 'ASCENSION · 化作星座',
          archetype: 'creation',
          symbol: 'world'
        },
        text: 'Ascend into Celestial Lyra',
        subtext: 'Eternal guardians woven into the night sky',
        nextNodeId: 'ending_steed_ascension',
        effects: { bond: 4, starlight: 4 },
        narration: '松开缰绳，白马鬃毛化作亿万光年永不熄灭的北极星座。',
        sceneryShift: 'meteor_shower'
      },
      {
        id: 'c_end_fool',
        tarot: {
          numeral: '0',
          nameEn: 'THE FOOL',
          nameZh: '愚者',
          keyword: 'HOME · 暗淡蓝点',
          archetype: 'journey',
          symbol: 'fool'
        },
        text: 'Return to Pale Blue Dot',
        subtext: 'Returning home across the folds of light',
        nextNodeId: 'ending_pale_blue',
        effects: { bond: 4, starlight: 3 },
        narration: '纵身跃入曲率折叠，那颗如同泪滴般湛蓝的故土已在眼前。',
        sceneryShift: 'aurora'
      },
      {
        id: 'c_end_justice',
        tarot: {
          numeral: 'ⅩⅠ',
          nameEn: 'JUSTICE',
          nameZh: '正义',
          keyword: 'ETERNITY · 永恒巡礼',
          archetype: 'fate',
          symbol: 'watcher'
        },
        text: 'Pace the Celestial Equator',
        subtext: 'The journey itself is the true destination',
        nextNodeId: 'ending_eternal_watchers',
        effects: { voidAffinity: 4, insight: 4 },
        narration: '蹄声永不停歇，在星海的边界上，以脚步丈量无始无终。',
        sceneryShift: 'normal'
      },
      {
        id: 'c_end_judgement',
        tarot: {
          numeral: 'ⅩⅩ',
          nameEn: 'JUDGEMENT',
          nameZh: '审判',
          keyword: 'GENESIS · 重启原初',
          archetype: 'creation',
          symbol: 'sun'
        },
        text: 'Ignite Nova Singularity',
        subtext: 'Igniting a newborn dawn of creation',
        nextNodeId: 'ending_nova_genesis',
        effects: { insight: 4, starlight: 5 },
        narration: '将灵曦火种投入奇点，亿万道炽烈的晨曦将死寂星区重新点燃。',
        sceneryShift: 'aurora'
      }
    ]
  },

  ending_steed_ascension: {
    id: 'ending_steed_ascension',
    chapter: 'FINALE · CELESTIAL DESTINY',
    title: 'Ascension of the Steed',
    prompt: '',
    choices: [],
    isEnding: true,
    endingData: ENDINGS.steed_ascension
  },

  ending_pale_blue: {
    id: 'ending_pale_blue',
    chapter: 'FINALE · CELESTIAL DESTINY',
    title: 'The Pale Blue Dot',
    prompt: '',
    choices: [],
    isEnding: true,
    endingData: ENDINGS.pale_blue_dot
  },

  ending_eternal_watchers: {
    id: 'ending_eternal_watchers',
    chapter: 'FINALE · CELESTIAL DESTINY',
    title: 'The Eternal Watchers',
    prompt: '',
    choices: [],
    isEnding: true,
    endingData: ENDINGS.eternal_watchers
  },

  ending_nova_genesis: {
    id: 'ending_nova_genesis',
    chapter: 'FINALE · CELESTIAL DESTINY',
    title: 'The New Genesis',
    prompt: '',
    choices: [],
    isEnding: true,
    endingData: ENDINGS.nova_genesis
  }
};

// Continuous philosophical vignettes when wandering
export const CONTINUOUS_VIGNETTES = [
  {
    quote: "夜色如墨，远方每一颗星辰都是宇宙悄然抛出的隐秘问句。",
    author: "星海残卷 · 卷一"
  },
  {
    quote: "蹄声踏过之处从非荒芜，而是尚未被谱写的无垠可能。",
    author: "星海残卷 · 卷二"
  },
  {
    quote: "向着同一方向漫步的两个灵魂，光年亦无法稀释彼此间的重力。",
    author: "星海残卷 · 卷三"
  },
  {
    quote: "眼中所见的璀璨，多是已逝恒星的遗光；漫步，是对过去最温柔的应答。",
    author: "星海残卷 · 卷四"
  },
  {
    quote: "不必畏惧宇宙的沉寂，它只是静候着你赋予它温度与意义。",
    author: "星海残卷 · 卷五"
  }
];
