import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CosmicThreeScene } from './components/CosmicThreeScene';
import { CardSelectionOverlay } from './components/CardSelectionOverlay';
import { ApproachingOverlay } from './components/ApproachingOverlay';
import { EncounterSceneHUD } from './components/EncounterSceneHUD';
import { FinalReadingModal } from './components/FinalReadingModal';
import { TopBar } from './components/TopBar';
import { ChronicleModal } from './components/ChronicleModal';
import { TarotCollectionModal } from './components/TarotCollectionModal';
import { StageProgressHeader } from './components/StageProgressHeader';
import { CardFlightOverlay } from './components/CardFlightOverlay';
import { ALL_TAROT_CARDS, drawOneCard } from './data/tarotDeck';
import {
  TarotCardDef,
  StageRecord,
  LLMInterpretation,
  GamePhase,
  ChronicleEntry,
  WalkPace,
  CameraView,
  PlayerStats,
} from './types';
import { audioService } from './services/audioService';
import { Language, copy, localFallbackReading, stageCopy, tarotEncounterName, tarotEncounterPrompt, tarotGiftReaction } from './i18n';

const TAROT_COLLECTION_KEY = 'gift-game.unlocked-tarot.v1';
const DECISION_TIME_LIMIT = 20;
const AUTO_ADVANCE_TIME_LIMIT = 7;

const STARTUP_ASSETS = [
  'assets/cover.png',
  'assets/audio/card-flip.ogg', 'assets/audio/choice-confirm.ogg', 'assets/audio/footstep-1.ogg',
  'assets/audio/footstep-2.ogg', 'assets/audio/starlight.ogg', 'assets/audio/space-ambient-osmic.mp3',
  'assets/The-Fool.webp', 'assets/chariot-tarotF.webp', 'assets/emperor-tarotF2.webp', 'assets/heirophant-v2F.webp',
  'assets/hermitF2.webp', 'assets/high-priestess-v2F.webp', 'assets/lover-tarotF.webp', 'assets/star-cardF2.webp',
  'assets/sun-cardF2.webp', 'assets/the-world-tarotF.webp', 'assets/tower-v3F.webp', 'assets/wheels-of-fate-tarotF.webp',
  'assets/tarot-back.webp',
];

function scoresFromHistory(history: StageRecord[]): PlayerStats {
  return history.reduce<PlayerStats>((scores, record) => ({
    empathy: scores.empathy + (record.offeredGift ? 2 : 1),
    insight: scores.insight + (record.offeredGift ? 1 : 2),
    hesitation: scores.hesitation + (record.offeredGift ? 3 : 1),
    boundary: scores.boundary + (record.offeredGift ? 0 : 2),
  }), { empathy: 2, insight: 2, hesitation: 2, boundary: 2 });
}

function readUnlockedCards(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(TAROT_COLLECTION_KEY) || '[]');
    return Array.isArray(saved)
      ? ALL_TAROT_CARDS.filter((card) => saved.includes(card.id)).map((card) => card.id)
      : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [startupProgress, setStartupProgress] = useState(0);
  const [startupReady, setStartupReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    if (!startupReady || !sceneReady) return;
    const timer = window.setTimeout(() => setStartupVisible(false), 850);
    return () => window.clearTimeout(timer);
  }, [startupReady, sceneReady]);
  const [startupVisible, setStartupVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let completed = 0;
      await Promise.all(STARTUP_ASSETS.map(async (asset) => {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}${asset}`, { cache: 'force-cache' });
          if (response.ok) await response.arrayBuffer();
        } catch { /* scene loaders handle unavailable optional assets */ }
        if (!cancelled) { completed += 1; setStartupProgress(Math.round((completed / STARTUP_ASSETS.length) * 100)); }
      }));
      if (!cancelled) {
        setStartupReady(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const createClientFallback = useCallback((history: StageRecord[], lang: Language): LLMInterpretation => {
    return localFallbackReading(lang, history[0]?.card, history, scoresFromHistory(history));
  }, []);

  // Keep the final page localized even when an older server process returns a
  // fallback in its default language, or when the language is changed while
  // the reading is already open.
  const normalizeInterpretation = useCallback((
    data: LLMInterpretation,
    history: StageRecord[],
    lang: Language,
  ): LLMInterpretation => {
    const containsChinese = (value: string) => /[\u3400-\u9fff]/.test(value);
    const hasChineseText = [
      data.metaphorTitle,
      data.situationReading,
      data.psychologicalInsight,
      data.selfAwareness,
      data.fallbackReason || '',
    ].some(containsChinese);

    if (lang === 'en' && hasChineseText) {
      return createClientFallback(history, lang);
    }
    return data;
  }, [createClientFallback]);

  // Game progression state (起因 · 经过 · 结果)
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('card_selection');
  const [stageCards, setStageCards] = useState<TarotCardDef[]>(() => drawOneCard([]));
  const [selectedCard, setSelectedCard] = useState<TarotCardDef | null>(null);
  const [stageHistory, setStageHistory] = useState<StageRecord[]>([]);
  const [finalHistory, setFinalHistory] = useState<StageRecord[]>([]);

  // 3D Scene interaction states
  const [pace, setPace] = useState<WalkPace>('walk');
  const [view, setView] = useState<CameraView>('cinematic');
  const [viewToast, setViewToast] = useState<string | null>(null);
  const viewToastTimerRef = useRef<number | null>(null);
  const [giftOffered, setGiftOffered] = useState<boolean | null>(null);
  const giftDecisionLockRef = useRef(false);

  // LLM reading states
  const [interpretation, setInterpretation] = useState<LLMInterpretation | null>(null);
  const [isLlmLoading, setIsLlmLoading] = useState<boolean>(false);
  const [isFallbackReading, setIsFallbackReading] = useState<boolean>(false);

  // Controls & Modals
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('gift-game.language') as Language) || 'en');
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [isChronicleOpen, setIsChronicleOpen] = useState<boolean>(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [unlockedCardIds, setUnlockedCardIds] = useState<string[]>(readUnlockedCards);
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [cardFlight, setCardFlight] = useState<{ card: TarotCardDef; start: { x: number; y: number }; stage: number } | null>(null);

  useEffect(() => { localStorage.setItem('gift-game.language', language); }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem(TAROT_COLLECTION_KEY, JSON.stringify(unlockedCardIds));
    } catch {
      // Keep this session's collection available when browser storage is unavailable.
    }
  }, [unlockedCardIds]);

  // Player Stats derived from stage history
  const [stats, setStats] = useState<PlayerStats>({
    empathy: 2,
    insight: 2,
    hesitation: 2,
    boundary: 2,
  });

  // Distance accumulation timer
  useEffect(() => {
    const interval = setInterval(() => {
      setDistance((prev) => {
        let delta = 0;
        if (pace === 'walk') delta = 0.05;
        else if (pace === 'trot') delta = 0.11;
        return prev + delta;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [pace]);

  // Audio gesture unlock
  useEffect(() => {
    const unlockAudio = () => {
      audioService.init();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Arrival at the colossus: reported by the scene once the duo has walked
  // its leg of the lap, or triggered early by the skip button / Space.
  const handleArriveImmediately = useCallback(() => {
    if (gamePhase === 'approaching') {
      setPace('pause');
      audioService.playStarlightChime();
      setGamePhase('encounter_decision');
    }
  }, [gamePhase]);

  const handleCardArrived = useCallback(() => {
    setPace('pause');
    audioService.playStarlightChime();
  }, []);

  const handleCardSelectFlight = useCallback((card: TarotCardDef, start: { x: number; y: number }) => {
    setCardFlight({ card, start, stage: currentStage });
  }, [currentStage]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCollectionOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Spacebar for arriving immediately if approaching
      if (e.code === 'Space') {
        e.preventDefault();
        if (gamePhase === 'approaching') {
          handleArriveImmediately();
          return;
        }
      }

      // 'h' for Zen Mode
      if (e.key === 'h' || e.key === 'H') {
        setZenMode((prev) => !prev);
      }

      // 'm' for Mute
      if (e.key === 'm' || e.key === 'M') {
        const muted = audioService.toggleMute();
        setIsMuted(muted);
      }

      // 'b' for Book/Chronicle
      if (e.key === 'b' || e.key === 'B') {
        setIsChronicleOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, stageCards, handleArriveImmediately, isCollectionOpen]);

  // Mouse wheel scroll to switch camera view mode
  const lastWheelTime = useRef<number>(0);
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isChronicleOpen || isCollectionOpen) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('#chronicle-dialog, [data-scrollable="true"]')) {
        return;
      }
      if (Math.abs(e.deltaY) < 14) return;

      const now = performance.now();
      if (now - lastWheelTime.current < 260) return;
      lastWheelTime.current = now;

      const zoomOrder: CameraView[] = ['close', 'normal', 'cinematic'];
      setView((currView) => {
        const currIndex = zoomOrder.indexOf(currView);
        let nextIndex = currIndex;

        if (e.deltaY < 0) {
          nextIndex = Math.max(0, currIndex - 1);
        } else {
          nextIndex = Math.min(zoomOrder.length - 1, currIndex + 1);
        }

        const nextView = zoomOrder[nextIndex];
        if (nextView !== currView) {
          audioService.playStarlightChime();
          setViewToast(null);
          if (viewToastTimerRef.current) {
            window.clearTimeout(viewToastTimerRef.current);
          }
          viewToastTimerRef.current = window.setTimeout(() => {
            setViewToast(null);
          }, 1500);
        }
        return nextView;
      });
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isChronicleOpen, isCollectionOpen]);

  // Helper to trigger view change with toast
  const handleChangeView = useCallback((newView: CameraView) => {
    setView(newView);
    audioService.playStarlightChime();
    setViewToast(null);
    if (viewToastTimerRef.current) {
      window.clearTimeout(viewToastTimerRef.current);
    }
    viewToastTimerRef.current = window.setTimeout(() => {
      setViewToast(null);
    }, 1500);
  }, []);

  // 1. Player opens the single Tarot Card after walking up to it
  const handleSelectCard = useCallback((card: TarotCardDef) => {
    setUnlockedCardIds((prev) => prev.includes(card.id) ? prev : [...prev, card.id]);
    setSelectedCard(card);
    setGiftOffered(null);
    giftDecisionLockRef.current = false;
    setGamePhase('approaching');
    setPace('walk');
    audioService.playWindWhisper();
  }, []);

  // 2. Player makes the Gift decision at encounter (Drag in 3D or Click button)
  const handleGiftDecision = useCallback(
    (offered: boolean) => {
      if (!selectedCard || giftOffered !== null || giftDecisionLockRef.current) return;
      // Guard synchronously: timeout, drag, and button events can arrive in
      // the same render before React commits giftOffered.
      giftDecisionLockRef.current = true;
      setGiftOffered(offered);

      // Giving the gift flips the card from the orientation it was drawn in;
      // keeping it preserves the drawn orientation.
      const drawnOrientation = selectedCard.drawnOrientation ?? 'upright';
      const orientation = offered
        ? (drawnOrientation === 'upright' ? 'reversed' : 'upright')
        : drawnOrientation;

      if (offered) {
        audioService.playCrimsonResonance();
        setTimeout(() => {
          audioService.playTarotFlip();
        }, 200);
      } else {
        audioService.playStarlightChime();
        setTimeout(() => {
          audioService.playChoiceConfirm();
        }, 150);
      }

      // Update player stats
      setStats((prev) => ({
        empathy: prev.empathy + (offered ? 2 : 1),
        insight: prev.insight + (offered ? 1 : 2),
        hesitation: prev.hesitation + (offered ? 3 : 1),
        boundary: prev.boundary + (offered ? 0 : 2),
      }));

      // Record stage history
      const stageNameMap: Record<number, '起因' | '经过' | '结果'> = {
        1: '起因',
        2: '经过',
        3: '结果',
      };
      const record: StageRecord = {
        stage: currentStage,
        stageName: stageNameMap[currentStage],
        card: selectedCard,
        orientation,
        offeredGift: offered,
        encounterName: tarotEncounterName(language, selectedCard.id, selectedCard.encounter.name),
        encounterDesc: tarotEncounterPrompt(language, selectedCard.id, selectedCard.encounter.prompt),
      };

      setStageHistory((prev) => {
        const next = prev.some((item) => item.stage === currentStage)
          ? prev.map((item) => (item.stage === currentStage ? record : item))
          : [...prev, record];
        if (currentStage === 3) setFinalHistory(next);
        return next;
      });

      // Add to Chronicle log
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      const entry: ChronicleEntry = {
        timestamp: timeStr,
        stage: currentStage,
        card: selectedCard,
        orientation,
        offeredGift: offered,
        encounterName: tarotEncounterName(language, selectedCard.id, selectedCard.encounter.name),
        reflection: tarotGiftReaction(
          language,
          selectedCard.id,
          offered,
          offered ? selectedCard.encounter.giftReactionOffered : selectedCard.encounter.giftReactionKept,
        ),
      };
      setChronicle((prev) => [...prev, entry]);
    },
    [selectedCard, currentStage, giftOffered, language]
  );

  // 3. Advance to next stage or final LLM reading
  const handleAdvanceStage = useCallback((decisionOverride?: { offeredGift: boolean; card: TarotCardDef }) => {
    const effectiveSelectedCard = decisionOverride?.card ?? selectedCard;
    const effectiveGiftOffered = decisionOverride?.offeredGift ?? giftOffered;
    if (currentStage < 3) {
      const nextStage = currentStage + 1;
      setCurrentStage(nextStage);
      const usedIds = stageHistory.map((h) => h.card.id).concat(effectiveSelectedCard ? [effectiveSelectedCard.id] : []);
      setStageCards(drawOneCard(usedIds));
      setSelectedCard(null);
      setGiftOffered(null);
      giftDecisionLockRef.current = false;
        setGamePhase('card_selection');
      setPace('walk');
    } else {
      // Completed all 3 stages (起因、经过、结果)! The duo walks on to close
      // the lap; the reading loads meanwhile and opens back at the origin.
      setGamePhase('homecoming');
      setPace('walk');
      setIsLlmLoading(true);

      // React state updates are batched: the final gift decision may not have
      // been committed to stageHistory when this callback runs. Include the
      // current stage explicitly so the first play gets a complete reading.
      const latestRecord = effectiveSelectedCard && effectiveGiftOffered !== null
        ? {
            stage: currentStage,
            stageName: '结果' as const,
            card: effectiveSelectedCard,
            orientation: effectiveGiftOffered
              ? ((effectiveSelectedCard.drawnOrientation ?? 'upright') === 'upright' ? 'reversed' : 'upright')
              : (effectiveSelectedCard.drawnOrientation ?? 'upright'),
            offeredGift: effectiveGiftOffered,
            encounterName: tarotEncounterName(language, effectiveSelectedCard.id, effectiveSelectedCard.encounter.name),
            encounterDesc: tarotEncounterPrompt(language, effectiveSelectedCard.id, effectiveSelectedCard.encounter.prompt),
          }
        : null;
      const historyByStage = new Map(stageHistory.map((record) => [record.stage, record]));
      if (latestRecord) historyByStage.set(currentStage, latestRecord);
      const fullHistory = Array.from(historyByStage.values()).sort((a, b) => a.stage - b.stage);
      const readingScores = scoresFromHistory(fullHistory);
      setFinalHistory(fullHistory);
      const minimumReadingDelay = new Promise((resolve) => window.setTimeout(resolve, 2000));
      fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageHistory: fullHistory, language, scores: readingScores }),
      })
        .then(async (res) => {
          const contentType = res.headers.get('content-type') || '';
          const raw = await res.text();
          let data: Partial<LLMInterpretation> & { error?: string } = {};
          if (raw && contentType.includes('application/json')) {
            try { data = JSON.parse(raw); } catch { /* handled by the fallback below */ }
          }
          if (!res.ok) throw new Error(data.error || raw.slice(0, 160) || '解读接口调用失败');
          return data as LLMInterpretation;
        })
        .then(async (data: LLMInterpretation) => {
          await minimumReadingDelay;
          const localizedData = normalizeInterpretation(data, fullHistory, language);
          setInterpretation(localizedData);
          setIsFallbackReading(Boolean(localizedData.fallback));
          setIsLlmLoading(false);
          audioService.playChoiceConfirm();
        })
        .catch(async (err) => {
          await minimumReadingDelay;
          console.error('Failed to get interpretation:', err);
          setInterpretation(createClientFallback(fullHistory, language));
          setIsFallbackReading(true);
          setIsLlmLoading(false);
        });
    }
  }, [currentStage, stageHistory, selectedCard, giftOffered, createClientFallback, language, normalizeInterpretation]);

  const handleKeepAndAdvance = useCallback(() => {
    if (!selectedCard || giftOffered !== null || giftDecisionLockRef.current) return;
    handleGiftDecision(false);
  }, [selectedCard, giftOffered, handleGiftDecision]);

  // Closing the planet lap ends the journey and reveals the reading.
  const handleJourneyComplete = useCallback(() => {
    setGamePhase((phase) => (phase === 'homecoming' ? 'final_reading' : phase));
    setPace('pause');
  }, []);

  // Countdown timer for offering gift (时间过了就默认不给)
  const [decisionTimeLeft, setDecisionTimeLeft] = useState<number>(DECISION_TIME_LIMIT);
  // Auto-advance timer (过了过一段时间也会进入下一阶段)
  const [autoAdvanceTimeLeft, setAutoAdvanceTimeLeft] = useState<number>(AUTO_ADVANCE_TIME_LIMIT);

  // Decision timer: when in encounter_decision and giftOffered === null
  useEffect(() => {
    if (gamePhase !== 'encounter_decision' || giftOffered !== null) return;

    setDecisionTimeLeft(DECISION_TIME_LIMIT);
    const interval = setInterval(() => {
      setDecisionTimeLeft((prev) => {
        if (prev <= 0.15) {
          clearInterval(interval);
          handleGiftDecision(false); // 默认不给
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gamePhase, giftOffered, handleGiftDecision]);

  // Auto-advance timer: once gift decision is made in encounter_decision
  useEffect(() => {
    if (gamePhase !== 'encounter_decision' || giftOffered === null) return;

    setAutoAdvanceTimeLeft(AUTO_ADVANCE_TIME_LIMIT);
    const interval = setInterval(() => {
      setAutoAdvanceTimeLeft((prev) => {
        if (prev <= 0.15) {
          clearInterval(interval);
          handleAdvanceStage(); // 自动进入下一阶段
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gamePhase, giftOffered, currentStage, handleAdvanceStage]);

  // Restart journey
  const handleRestart = useCallback(() => {
    setIsCollectionOpen(false);
    setCardFlight(null);
    giftDecisionLockRef.current = false;
    setCurrentStage(1);
    setGamePhase('card_selection');
    setStageCards(drawOneCard([]));
    setSelectedCard(null);
    setStageHistory([]);
    setFinalHistory([]);
    setInterpretation(null);
    setIsFallbackReading(false);
    setIsLlmLoading(false);
    setGiftOffered(null);
    setDecisionTimeLeft(DECISION_TIME_LIMIT);
    setAutoAdvanceTimeLeft(AUTO_ADVANCE_TIME_LIMIT);
    setPace('walk');
    setDistance(0);
    setChronicle([]);
    setStats({
      empathy: 2,
      insight: 2,
      hesitation: 2,
      boundary: 2,
    });
  }, []);

  const stageChapterTitles: Record<number, string> = {
    1: stageCopy(language, 1),
    2: stageCopy(language, 2),
    3: stageCopy(language, 3),
  };
  const readingHistory = finalHistory.length ? finalHistory : stageHistory;
  const localizedInterpretation = interpretation
    ? normalizeInterpretation(interpretation, readingHistory, language)
    : null;

  return (
    <main
      id="app-root"
      className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none"
    >
      {/* 1. Fullscreen Three.js 3D Scene with Dynamic Camera Steering, Celestial 3D Sky Cards and 3D Gift Dragging */}
      <CosmicThreeScene
        pace={pace}
        view={view}
        gamePhase={gamePhase}
        stageCards={stageCards}
        stage={currentStage}
        onSelectCard={handleSelectCard}
        onCardSelectFlight={handleCardSelectFlight}
        encounterActive={gamePhase === 'approaching' || gamePhase === 'encounter_decision'}
        encounterType={selectedCard?.encounter.type || null}
        encounterCard={selectedCard}
        onApproachArrived={handleArriveImmediately}
        onCardArrived={handleCardArrived}
        giftOffered={giftOffered}
        onGiftDroppedOnEntity={() => handleGiftDecision(true)}
        language={language}
        onJourneyComplete={handleJourneyComplete}
        onSceneReady={() => setSceneReady(true)}
      />


      {/* 2. Top Navigation & Status Bar (Simplified, without pace buttons) */}
      <TopBar
        currentChapter={stageChapterTitles[currentStage] || copy[language].roaming}
        distance={distance}
        view={view}
        onChangeView={handleChangeView}
        isMuted={isMuted}
        onToggleMute={() => {
          const muted = audioService.toggleMute();
          setIsMuted(muted);
        }}
        onOpenChronicle={() => setIsChronicleOpen(true)}
        zenMode={zenMode}
        onToggleZenMode={() => setZenMode(!zenMode)}
        onRestart={handleRestart}
        stats={stats}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Stage Progress (起因 · 经过 · 结果) */}
      {!zenMode && (
        <div className="absolute top-16 left-6 z-30 pointer-events-auto">
          <StageProgressHeader
            currentStage={currentStage}
            history={stageHistory}
            selectedCard={selectedCard}
            giftOffered={giftOffered}
            language={language}
          />
        </div>
      )}

      <AnimatePresence>
        {cardFlight && (
          <CardFlightOverlay
            key={`${cardFlight.card.id}-${cardFlight.stage}`}
            card={cardFlight.card}
            start={cardFlight.start}
            stage={cardFlight.stage}
            onComplete={() => setCardFlight(null)}
          />
        )}
      </AnimatePresence>

      {/* Perspective Shift Toast Indicator */}
      <AnimatePresence>
        {viewToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="px-3.5 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-[11px] font-artistic text-white/80 tracking-[0.1em] uppercase shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
              <span>{viewToast}</span>
              <span className="text-white/35 font-garamond text-[9px] tracking-normal lowercase ml-1">
                {copy[language].wheelZoom}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Phase A: Card Selection */}
      {!zenMode && (
        <CardSelectionOverlay
          stage={currentStage}
          cards={stageCards}
          onSelectCard={handleSelectCard}
          isVisible={gamePhase === 'card_selection' && pace === 'pause'}
          language={language}
        />
      )}

      {/* 5. Phase C: In-Scene HUD for Encounter & Red Gift Interaction (结合场景，非大遮罩弹窗) */}
      {!zenMode && selectedCard && (
        <EncounterSceneHUD
          stage={currentStage}
          card={selectedCard}
          offeredGift={giftOffered}
          decisionTimeLeft={decisionTimeLeft}
          autoAdvanceTimeLeft={autoAdvanceTimeLeft}
          isVisible={gamePhase === 'encounter_decision'}
          language={language}
          onKeepAndAdvance={handleKeepAndAdvance}
        />
      )}

      {/* 6. Phase D: Final Metaphorical Reading (LLM生成具象比喻) */}
      <FinalReadingModal
        history={readingHistory}
        chronicle={chronicle}
        stats={stats}
        distance={distance}
        interpretation={localizedInterpretation}
        isLoading={isLlmLoading}
        onRestart={handleRestart}
        isOpen={gamePhase === 'final_reading'}
        isFallback={isFallbackReading}
        language={language}
        onOpenCollection={() => setIsCollectionOpen(true)}
      />

      {/* 7. Chronicle / Logbook Modal */}
      <ChronicleModal
        isOpen={isChronicleOpen}
        onClose={() => setIsChronicleOpen(false)}
        entries={chronicle}
        stats={stats}
        distance={distance}
        language={language}
      />
      <TarotCollectionModal
        isOpen={isCollectionOpen}
        onClose={() => setIsCollectionOpen(false)}
        cards={ALL_TAROT_CARDS}
        unlockedCardIds={unlockedCardIds}
        language={language}
      />
      <AnimatePresence>
        {startupVisible && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden bg-black"
            initial={{ opacity: 1 }} animate={{ opacity: startupReady && sceneReady ? 0 : 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <img src={`${import.meta.env.BASE_URL}assets/cover.png`} alt="Tarot Gift" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
            <div className="relative z-10 mb-14 w-[min(420px,75vw)] text-center font-garamond text-white">
              <div className="mb-3 text-[11px] uppercase tracking-[0.35em] text-white/70">{startupReady && sceneReady ? copy[language].startupEntering : copy[language].startupPreparing}</div>
              <div className="h-1 overflow-hidden rounded-full bg-white/20"><motion.div className="h-full bg-white" animate={{ width: `${startupProgress}%` }} transition={{ ease: 'easeOut' }} /></div>
              <div className="mt-2 text-[10px] tracking-[0.25em] text-white/55">{startupProgress}%</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
