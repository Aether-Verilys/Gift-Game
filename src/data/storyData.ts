import { StoryNode, Ending } from '../types';

export const ENDINGS: Record<string, Ending> = {
  steed_ascension: {
    id: 'steed_ascension',
    title: 'Ascension of the Steed',
    subtitle: 'To Merge with the Constellations',
    theme: 'transcendence',
    epitaph: 'And so, beside the brightest beacon in Lyra, there sprang a celestial steed of living light.',
    fullPoem: [
      'You gently release the reins, and the starlight upon its brow blooms into dawn across the heavens.',
      'It has not departed, only woven itself into the grand cosmic background radiation.',
      'Whenever your cloak brushes against stardust, a warm, phantom mane stirs within the quiet void.',
      'One wanderer, one steed, and an entire unquenchable galaxy.'
    ]
  },
  pale_blue_dot: {
    id: 'pale_blue_dot',
    title: 'The Pale Blue Dot',
    subtitle: 'Echoes of the Cradle',
    theme: 'grounding',
    epitaph: 'After journeys of billions of light-years, at the folded edge of the spectrum, we glimpsed that suspended speck of dust.',
    fullPoem: [
      'The hooves tread across the final gravitational refraction, and the cold void begins to recede.',
      'There lies a planet as azure as a teardrop, bearing winds laden with wild grass and rain.',
      'You dismount beneath quiet skies, stroking the warm flank of your companion.',
      'The destination was never to conquer the cosmos, but to return and embrace the original cradle.'
    ]
  },
  eternal_watchers: {
    id: 'eternal_watchers',
    title: 'The Eternal Watchers',
    subtitle: 'The Infinite Companions',
    theme: 'stoicism',
    epitaph: 'The heavens as the board, the stars as pieces; upon the world’s horizon, they measure eternity stride by stride.',
    fullPoem: [
      'You refused the reconstruction of the singularity, nor did you yield to the silence of the void.',
      'As long as the hoofbeats do not cease, this lone celestial sphere retains its pulse.',
      'Millions of years hence, roving photons will still record this timeless silhouette:',
      'A cloaked wanderer and a proud white steed, pacing softly between the starlight and the dark.'
    ]
  },
  nova_genesis: {
    id: 'nova_genesis',
    title: 'The New Genesis',
    subtitle: 'The Spark that Kindled Epochs',
    theme: 'creation',
    epitaph: 'The faint warmth left behind in your wake became the fuse for the first newborn sun of this silent sector.',
    fullPoem: [
      'The singularity dissolves within your palms into a billion cascading auroras.',
      'Slender lines of geometry branch outward, weaving fresh nebulae and orbital planes.',
      'The universe reclaims its warmth and vivid spectrum.',
      'And the legend of the two wanderers is etched forever into the primordial spin of creation.'
    ]
  },
  silent_fellowship: {
    id: 'silent_fellowship',
    title: 'Harmony in the Void',
    subtitle: 'Companionship Beyond Time',
    theme: 'harmony',
    epitaph: 'Even as the cosmos approaches heat death, the breath beside you remains an undeniable warmth.',
    fullPoem: [
      'No longer seeking answers, for the questions themselves have scattered upon the solar wind.',
      'The white steed nuzzles your arm, its breath rising like an ethereal northern light.',
      'In the soundless vacuum, you are each other’s only metric of truth.',
      'The night is ink, the steps are light, and this silence outshines every grand epic.'
    ]
  }
};

export const STORY_NODES: Record<string, StoryNode> = {
  start: {
    id: 'start',
    chapter: 'PROLOGUE · THE LONE STAR',
    title: 'Silent Odyssey',
    prompt: 'Along the quiet ridge of Forgotten Star VII, the white steed exhales luminous frost into the silent void:',
    speaker: 'Whispers of the Cosmos',
    choices: [
      {
        id: 'c_start_1',
        text: 'Follow the faint cerulean beacon',
        subtext: 'Trust the stride; warmth defies the cold',
        nextNodeId: 'beacon_encounter',
        effects: { bond: 2, starlight: 1 },
        narration: 'The steed nickers softly, falling into step with your breath.',
        sceneryShift: 'normal'
      },
      {
        id: 'c_start_2',
        text: 'Contemplate the gravitational tides',
        subtext: 'In deep silence, listen to the stars',
        nextNodeId: 'deep_abyss',
        effects: { insight: 2, voidAffinity: 1 },
        narration: 'Distant starlight bends into quiet chords across the event horizon.',
        sceneryShift: 'aurora'
      }
    ]
  },

  beacon_encounter: {
    id: 'beacon_encounter',
    chapter: 'ACT I · THE ABANDONED BEACON',
    title: 'Sleeping Signal Tower',
    prompt: 'A fractured navigation beacon hums in the stardust, casting ancient geometric glyphs:',
    speaker: 'Resonance of the Beacon',
    choices: [
      {
        id: 'c_beacon_1',
        text: 'Kindle its core with your stellar spark',
        subtext: 'A brief flame to pierce the night',
        nextNodeId: 'crystal_field',
        effects: { starlight: 2, bond: 1 },
        narration: 'The beacon chimes, casting a harmonic beam into the deep.',
        sceneryShift: 'meteor_shower'
      },
      {
        id: 'c_beacon_2',
        text: 'Trace the etched glyphs into memory',
        subtext: 'Bearing witness to what once was',
        nextNodeId: 'crystal_field',
        effects: { insight: 2, voidAffinity: 1 },
        narration: 'You record the faded glyphs as the steed waits patiently.',
        sceneryShift: 'normal'
      },
      {
        id: 'c_beacon_3',
        text: 'Guide the reins past in silence',
        subtext: 'Let the sleeping dust rest',
        nextNodeId: 'ring_passage',
        effects: { voidAffinity: 2, insight: 1 },
        narration: 'You glide through its shadow, honoring the quiet of forgotten things.',
        sceneryShift: 'rings'
      }
    ]
  },

  deep_abyss: {
    id: 'deep_abyss',
    chapter: 'ACT I · VOID TIDES',
    title: 'Edge of the Gravity Chasm',
    prompt: 'A gravitational chasm bends starlight into a glowing ring. The steed pauses at the brink:',
    speaker: 'Instinct of the Steed',
    choices: [
      {
        id: 'c_abyss_1',
        text: 'Clasp the reins and cross the bridge',
        subtext: 'Bound by trust, the void cannot claim you',
        nextNodeId: 'crystal_field',
        effects: { bond: 3 },
        narration: 'Its hooves tread weightless ripples, tracing an arc across the dark.',
        sceneryShift: 'aurora'
      },
      {
        id: 'c_abyss_2',
        text: 'Cast a light speck to measure the dilation',
        subtext: 'Witnessing the curvature of spacetime',
        nextNodeId: 'ring_passage',
        effects: { insight: 3 },
        narration: 'The photon lingers at the horizon, a luminous thread against the void.',
        sceneryShift: 'black_hole'
      }
    ]
  },

  crystal_field: {
    id: 'crystal_field',
    chapter: 'ACT II · THE PRISM WASTES',
    title: 'Sea of Mirrored Memories',
    prompt: 'A forest of weightless prisms rises ahead, each facet mirroring a distant memory:',
    speaker: 'Mirrors of Spacetime',
    choices: [
      {
        id: 'c_crystal_1',
        text: 'Touch the facet reflecting home',
        subtext: 'Cherishing the warmth of earthly wheat',
        nextNodeId: 'monolith_dialogue',
        effects: { bond: 1, starlight: 2 },
        narration: 'A faint melody hums from the crystal as the steed nuzzles your palm.',
        sceneryShift: 'normal'
      },
      {
        id: 'c_crystal_2',
        text: 'Stride past the shattering reflections',
        subtext: 'The road ahead belongs to the open stars',
        nextNodeId: 'monolith_dialogue',
        effects: { voidAffinity: 2, insight: 1 },
        narration: 'Crystal shards scatter like frost underfoot as you press onward.',
        sceneryShift: 'monolith'
      }
    ]
  },

  ring_passage: {
    id: 'ring_passage',
    chapter: 'ACT II · RING SHADOWS',
    title: 'Stripes of Silver and Ink',
    prompt: 'A gas giant’s rings streak across the sky in stark ribbons of silver and shadow:',
    speaker: 'Interplay of Rings and Light',
    choices: [
      {
        id: 'c_ring_1',
        text: 'Trot along the silver ribbons',
        subtext: 'Chasing starlight across the ice',
        nextNodeId: 'monolith_dialogue',
        effects: { starlight: 2, bond: 1 },
        narration: 'The steed trots eagerly, hooves ringing like bells upon the frost.',
        sceneryShift: 'meteor_shower'
      },
      {
        id: 'c_ring_2',
        text: 'Step into the obsidian shadow',
        subtext: 'Finding quiet solace in the deep',
        nextNodeId: 'monolith_dialogue',
        effects: { voidAffinity: 2, insight: 2 },
        narration: 'In total darkness, your companion’s steady breath is your sole anchor.',
        sceneryShift: 'rings'
      }
    ]
  },

  monolith_dialogue: {
    id: 'monolith_dialogue',
    chapter: 'ACT III · THE MONOLITH’S QUERY',
    title: 'The Floating Sentinel',
    prompt: 'A mirror-smooth monolith hovers in mid-air, echoing a silent query in your mind:',
    speaker: 'Sentinel of Higher Dimensions',
    choices: [
      {
        id: 'c_mono_1',
        text: '“We wander to prove love still measures distance.”',
        subtext: 'The universe is measured by companionship',
        nextNodeId: 'crossroads',
        effects: { bond: 3, starlight: 1 },
        narration: 'The monolith ripples with warm light, parting the horizon ahead.',
        sceneryShift: 'aurora'
      },
      {
        id: 'c_mono_2',
        text: '“The cosmos needs no purpose; we simply exist.”',
        subtext: 'Harmonizing with immutable natural law',
        nextNodeId: 'crossroads',
        effects: { insight: 3, voidAffinity: 2 },
        narration: 'The monolith turns in silence, unfolding folded dimensional geometries.',
        sceneryShift: 'monolith'
      },
      {
        id: 'c_mono_3',
        text: 'Pour a drop of water onto the dust and pass by',
        subtext: 'Silence is the ultimate answer',
        nextNodeId: 'crossroads',
        effects: { bond: 1, voidAffinity: 2 },
        narration: 'The droplet freezes into a crystal rose as you walk past in peace.',
        sceneryShift: 'normal'
      }
    ]
  },

  crossroads: {
    id: 'crossroads',
    chapter: 'ACT IV · THE SINGULARITY CROSSROADS',
    title: 'The Final Horizon of Fate',
    prompt: 'Spacetime converges at a miniature white singularity. The steed turns to meet your gaze:',
    speaker: 'The Crossroads of Destiny',
    choices: [
      {
        id: 'c_end_ascend',
        text: 'Release the reins and ascend into a constellation',
        subtext: 'Eternal guardians woven into the night',
        nextNodeId: 'ending_steed_ascension',
        effects: { bond: 2, starlight: 2 },
        narration: 'The steed dissolves into pure radiant starlight, ascending into the heavens.',
        sceneryShift: 'meteor_shower'
      },
      {
        id: 'c_end_blue',
        text: 'Leap into the warp horizon toward the blue dot',
        subtext: 'Returning home across the folds of light',
        nextNodeId: 'ending_pale_blue',
        effects: { bond: 3, starlight: 2 },
        narration: 'Threads of light streak past as the pale blue world draws near.',
        sceneryShift: 'aurora'
      },
      {
        id: 'c_end_watchers',
        text: 'Wheel around to pace the equator forever',
        subtext: 'The journey itself is the true destination',
        nextNodeId: 'ending_eternal_watchers',
        effects: { voidAffinity: 3, insight: 2 },
        narration: 'The hoofbeats endure in rhythmic grace beneath the quiet stars.',
        sceneryShift: 'normal'
      },
      {
        id: 'c_end_genesis',
        text: 'Cast the spark and crystal into the singularity',
        subtext: 'Igniting a newborn dawn of creation',
        nextNodeId: 'ending_nova_genesis',
        effects: { insight: 3, starlight: 3 },
        narration: 'A brilliant white shockwave blooms, birthing a thousand newborn suns.',
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
    quote: "When the night turns as deep as obsidian, every distant star is a quiet question cast by the universe.",
    author: "Celestial Fragments · Tome I"
  },
  {
    quote: "Where the hooves tread is never barren desolation, but a vast expanse of unwritten possibilities.",
    author: "Celestial Fragments · Tome II"
  },
  {
    quote: "Two souls, walking in the same direction—even across light-years, the gravity between them never fades.",
    author: "Celestial Fragments · Tome III"
  },
  {
    quote: "Much of the light we behold was born from long-dead suns. To wander is to send a tardy reply to the past.",
    author: "Celestial Fragments · Tome IV"
  },
  {
    quote: "Do not dread the silence of the cosmos; it is merely waiting for you to bestow it with meaning.",
    author: "Celestial Fragments · Tome V"
  }
];
