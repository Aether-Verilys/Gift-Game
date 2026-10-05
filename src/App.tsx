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
import { ALL_TAROT_CARDS, drawThreeCards } from './data/tarotDeck';
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
import { Language, copy, stageCopy, tarotEncounterName, tarotEncounterPrompt, tarotGiftReaction } from './i18n';

const TAROT_COLLECTION_KEY = 'gift-game.unlocked-tarot.v1';

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
  const createClientFallback = useCallback((history: StageRecord[]): LLMInterpretation => {
    const first = history[0];
    const topic = first ? `围绕“${first.card.nameZh}”展开的选择与自我定位` : '当下正在形成的选择与方向';
    return {
      metaphorTitle: `关于${topic}的内在地图`,
      situationReading: `旅者正在靠近与保护之间反复校准。当前议题未必缺少答案，更像是在衡量投入的代价、回应是否可靠，以及哪些边界需要保留。牌面只能提供观察角度，不能替代现实中的事实与决定。`,
      psychologicalInsight: `旅者可能先观察风险与反馈，再决定是否投入。这种谨慎能带来安全感，也可能让等待确定感变成行动的门槛。三次选择显示，旅者正在练习把判断权从外部回应逐步拿回自己手中。`,
      selfAwareness: `可以留意：旅者此刻是在表达真实需要，还是在提前避免失望？把这两个动机分开，才能更清楚地理解下一次选择。`,
      fallback: true,
      fallbackReason: '解读接口暂时不可用，已使用本地备用解读。',
    };
  }, []);

  // Game progression state (起因 · 经过 · 结果)
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [gamePhase, setGamePhase] = useState<GamePhase>('card_selection');
  const [stageCards, setStageCards] = useState<TarotCardDef[]>(() => drawThreeCards([]));
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
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('gift-game.language') as Language) || 'zh');
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [isChronicleOpen, setIsChronicleOpen] = useState<boolean>(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [unlockedCardIds, setUnlockedCardIds] = useState<string[]>(readUnlockedCards);
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>([]);
  const [distance, setDistance] = useState<number>(0);

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

  // 1. Player selects a Tarot Card (三选一) in the Distant Sky View
  const handleSelectCard = useCallback((card: TarotCardDef) => {
    setUnlockedCardIds((prev) => prev.includes(card.id) ? prev : [...prev, card.id]);
    setSelectedCard(card);
    setGiftOffered(null);
    giftDecisionLockRef.current = false;
    setGamePhase('approaching');
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
  const handleAdvanceStage = useCallback(() => {
    if (currentStage < 3) {
      const nextStage = currentStage + 1;
      setCurrentStage(nextStage);
      const usedIds = stageHistory.map((h) => h.card.id).concat(selectedCard ? [selectedCard.id] : []);
      setStageCards(drawThreeCards(usedIds));
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
      const latestRecord = selectedCard && giftOffered !== null
        ? {
            stage: currentStage,
            stageName: '结果' as const,
            card: selectedCard,
            orientation: giftOffered
              ? ((selectedCard.drawnOrientation ?? 'upright') === 'upright' ? 'reversed' : 'upright')
              : (selectedCard.drawnOrientation ?? 'upright'),
            offeredGift: giftOffered,
            encounterName: tarotEncounterName(language, selectedCard.id, selectedCard.encounter.name),
            encounterDesc: tarotEncounterPrompt(language, selectedCard.id, selectedCard.encounter.prompt),
          }
        : null;
      const historyByStage = new Map(stageHistory.map((record) => [record.stage, record]));
      if (latestRecord) historyByStage.set(currentStage, latestRecord);
      const fullHistory = Array.from(historyByStage.values()).sort((a, b) => a.stage - b.stage);
      setFinalHistory(fullHistory);
      const minimumReadingDelay = new Promise((resolve) => window.setTimeout(resolve, 2000));
      fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageHistory: fullHistory }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || '解读接口调用失败');
          return data as LLMInterpretation;
        })
        .then(async (data: LLMInterpretation) => {
          await minimumReadingDelay;
          setInterpretation(data);
          setIsFallbackReading(Boolean(data.fallback));
          setIsLlmLoading(false);
          audioService.playChoiceConfirm();
        })
        .catch(async (err) => {
          await minimumReadingDelay;
          console.error('Failed to get interpretation:', err);
          setInterpretation(createClientFallback(fullHistory));
          setIsFallbackReading(true);
          setIsLlmLoading(false);
        });
    }
  }, [currentStage, stageHistory, selectedCard, giftOffered, createClientFallback, language]);

  // Closing the planet lap ends the journey and reveals the reading.
  const handleJourneyComplete = useCallback(() => {
    setGamePhase((phase) => (phase === 'homecoming' ? 'final_reading' : phase));
    setPace('pause');
  }, []);

  // Countdown timer for offering gift (时间过了就默认不给)
  const [decisionTimeLeft, setDecisionTimeLeft] = useState<number>(10);
  // Auto-advance timer (过了过一段时间也会进入下一阶段)
  const [autoAdvanceTimeLeft, setAutoAdvanceTimeLeft] = useState<number>(3.5);

  // Decision timer: when in encounter_decision and giftOffered === null
  useEffect(() => {
    if (gamePhase !== 'encounter_decision' || giftOffered !== null) return;

    setDecisionTimeLeft(10);
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

    setAutoAdvanceTimeLeft(3.5);
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
    giftDecisionLockRef.current = false;
    setCurrentStage(1);
    setGamePhase('card_selection');
    setStageCards(drawThreeCards([]));
    setSelectedCard(null);
    setStageHistory([]);
    setFinalHistory([]);
    setInterpretation(null);
    setIsFallbackReading(false);
    setIsLlmLoading(false);
    setGiftOffered(null);
    setDecisionTimeLeft(10);
    setAutoAdvanceTimeLeft(3.5);
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
        encounterActive={gamePhase === 'approaching' || gamePhase === 'encounter_decision'}
        encounterType={selectedCard?.encounter.type || null}
        onApproachArrived={handleArriveImmediately}
        giftOffered={giftOffered}
        onGiftDroppedOnEntity={() => handleGiftDecision(true)}
        language={language}
        onJourneyComplete={handleJourneyComplete}
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
          isVisible={gamePhase === 'card_selection'}
          language={language}
        />
      )}

      {/* 4. Phase B: Walking Towards Encounter (选完拉进镜头看场景交互) */}
      {!zenMode && (
        <ApproachingOverlay
          stage={currentStage}
          card={selectedCard}
          onArrive={handleArriveImmediately}
          isVisible={gamePhase === 'approaching'}
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
          onDecision={handleGiftDecision}
          onContinue={handleAdvanceStage}
          language={language}
        />
      )}

      {/* 6. Phase D: Final Metaphorical Reading (LLM生成具象比喻) */}
      <FinalReadingModal
        history={finalHistory.length ? finalHistory : stageHistory}
        interpretation={interpretation}
        isLoading={isLlmLoading}
        onRestart={handleRestart}
        onOpenChronicle={() => setIsChronicleOpen(true)}
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
    </main>
  );
}
