import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CosmicThreeScene } from './components/CosmicThreeScene';
import { FloatingChoiceOverlay } from './components/FloatingChoiceOverlay';
import { NarrationOverlay } from './components/NarrationOverlay';
import { TopBar } from './components/TopBar';
import { ChronicleModal } from './components/ChronicleModal';
import { EndingModal } from './components/EndingModal';
import { VignetteBar } from './components/VignetteBar';
import { STORY_NODES, CONTINUOUS_VIGNETTES } from './data/storyData';
import { StoryNode, Choice, PlayerStats, ChronicleEntry, WalkPace, CameraView } from './types';
import { audioService } from './services/audioService';

export default function App() {
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [isChoiceVisible, setIsChoiceVisible] = useState<boolean>(true);
  const [currentNarration, setCurrentNarration] = useState<string | null>(null);
  const [sceneryShift, setSceneryShift] = useState<string>('normal');
  const [pace, setPace] = useState<WalkPace>('walk');
  const [view, setView] = useState<CameraView>('cinematic');
  const [viewToast, setViewToast] = useState<string | null>(null);
  const viewToastTimerRef = useRef<number | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [isChronicleOpen, setIsChronicleOpen] = useState<boolean>(false);
  const [endlessMode, setEndlessMode] = useState<boolean>(false);

  // Player stats
  const [stats, setStats] = useState<PlayerStats>({
    bond: 0,
    insight: 0,
    starlight: 0,
    voidAffinity: 0,
  });

  // Chronicle logs
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>([]);

  // Distance in light-years
  const [distance, setDistance] = useState<number>(0);

  // Subtle background quotes
  const [vignetteIdx, setVignetteIdx] = useState<number>(0);
  const [showVignette, setShowVignette] = useState<boolean>(false);

  const currentNode: StoryNode = STORY_NODES[currentNodeId] || STORY_NODES['start'];

  // Ref to track next node transition after narration
  const pendingNextNodeId = useRef<string | null>(null);

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

  // Subtle vignette cycling
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isChoiceVisible && !currentNarration && !currentNode.isEnding) {
        setShowVignette(true);
        setVignetteIdx((prev) => (prev + 1) % CONTINUOUS_VIGNETTES.length);

        setTimeout(() => {
          setShowVignette(false);
        }, 7000);
      }
    }, 18000);

    return () => clearInterval(timer);
  }, [isChoiceVisible, currentNarration, currentNode.isEnding]);

  // Handle first user gesture to unlock audio
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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 1-4 for choices
      if (isChoiceVisible && currentNode && !currentNode.isEnding) {
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= currentNode.choices.length) {
          handleSelectChoice(currentNode.choices[keyNum - 1]);
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

      // Spacebar toggles walk/pause
      if (e.code === 'Space') {
        e.preventDefault();
        setPace((prev) => (prev === 'pause' ? 'walk' : 'pause'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChoiceVisible, currentNode]);

  // Helper to trigger view change with audio & visual feedback
  const handleChangeView = useCallback((newView: CameraView) => {
    setView(newView);
    audioService.playStarlightChime();
    const labels: Record<CameraView, string> = {
      cinematic: 'Perspective: Deep Space',
      normal: 'Perspective: Trailing View',
      close: 'Perspective: Companion View',
    };
    setViewToast(labels[newView]);
    if (viewToastTimerRef.current) {
      window.clearTimeout(viewToastTimerRef.current);
    }
    viewToastTimerRef.current = window.setTimeout(() => {
      setViewToast(null);
    }, 1500);
  }, []);

  // Mouse wheel scroll to switch camera view mode
  const lastWheelTime = useRef<number>(0);
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Do not switch view if modal dialog is open or user is scrolling inside scrollable container
      if (isChronicleOpen) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('#chronicle-dialog, #ending-container, [data-scrollable="true"]')) {
        return;
      }

      // Ignore micro-jitters
      if (Math.abs(e.deltaY) < 14) return;

      const now = performance.now();
      // Throttle wheel view switching to prevent abrupt multiple jumps
      if (now - lastWheelTime.current < 260) return;
      lastWheelTime.current = now;

      // Distance order: 'close' (nearest) -> 'normal' (medium) -> 'cinematic' (deep space)
      const zoomOrder: CameraView[] = ['close', 'normal', 'cinematic'];

      setView((currView) => {
        const currIndex = zoomOrder.indexOf(currView);
        let nextIndex = currIndex;

        if (e.deltaY < 0) {
          // Scroll UP -> Zoom in (towards 'close')
          nextIndex = Math.max(0, currIndex - 1);
        } else {
          // Scroll DOWN -> Zoom out (towards 'cinematic' Deep Space)
          nextIndex = Math.min(zoomOrder.length - 1, currIndex + 1);
        }

        const nextView = zoomOrder[nextIndex];
        if (nextView !== currView) {
          audioService.playStarlightChime();
          const labels: Record<CameraView, string> = {
            cinematic: 'Perspective: Deep Space',
            normal: 'Perspective: Trailing View',
            close: 'Perspective: Companion View',
          };
          setViewToast(labels[nextView]);
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
  }, [isChronicleOpen]);

  const hasResonatedRef = useRef<boolean>(false);
  const handleRedObjectResonance = useCallback((state: { isDragging: boolean; distance: number; resonanceLevel: number }) => {
    if (state.isDragging && state.distance < 7.0 && !hasResonatedRef.current) {
      hasResonatedRef.current = true;
      setStats((prev) => ({
        ...prev,
        starlight: prev.starlight + 1,
        insight: prev.insight + 1,
      }));
      setViewToast('Scarlet Core · Celestial Gravitational Resonance');
      if (viewToastTimerRef.current) {
        window.clearTimeout(viewToastTimerRef.current);
      }
      viewToastTimerRef.current = window.setTimeout(() => {
        setViewToast(null);
      }, 2200);
    }
  }, []);

  const handleSelectChoice = useCallback((choice: Choice) => {
    // 1. Hide the choice card
    setIsChoiceVisible(false);

    // 2. Play wind/cosmic sweep
    audioService.playWindWhisper();

    // 3. Update stats
    setStats((prev) => ({
      bond: prev.bond + (choice.effects.bond || 0),
      insight: prev.insight + (choice.effects.insight || 0),
      starlight: prev.starlight + (choice.effects.starlight || 0),
      voidAffinity: prev.voidAffinity + (choice.effects.voidAffinity || 0),
    }));

    // 4. Update Scenery Shift
    if (choice.sceneryShift) {
      setSceneryShift(choice.sceneryShift);
    }

    // 5. Record Chronicle entry
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newEntry: ChronicleEntry = {
      timestamp: timeStr,
      chapter: currentNode.chapter,
      prompt: currentNode.prompt,
      choiceMade: choice.text,
      reflection: choice.narration,
      statsDelta: choice.effects,
    };
    setChronicle((prev) => [...prev, newEntry]);

    // 6. Display Narration Toast
    setCurrentNarration(choice.narration);
    pendingNextNodeId.current = choice.nextNodeId;
  }, [currentNode]);

  const handleDismissNarration = useCallback(() => {
    setCurrentNarration(null);
    if (pendingNextNodeId.current) {
      const nextId = pendingNextNodeId.current;
      pendingNextNodeId.current = null;
      setCurrentNodeId(nextId);

      // If next node has choices, delay slightly for poetic atmosphere
      const nextNode = STORY_NODES[nextId];
      if (nextNode && !nextNode.isEnding) {
        setTimeout(() => {
          setIsChoiceVisible(true);
        }, 700);
      }
    }
  }, []);

  const handleRestart = () => {
    setCurrentNodeId('start');
    setIsChoiceVisible(true);
    setCurrentNarration(null);
    setSceneryShift('normal');
    setPace('walk');
    setEndlessMode(false);
    setStats({
      bond: 0,
      insight: 0,
      starlight: 0,
      voidAffinity: 0,
    });
    setChronicle([]);
    setDistance(0);
  };

  const handleToggleMute = () => {
    const muted = audioService.toggleMute();
    setIsMuted(muted);
  };

  const handleContinueEndless = () => {
    setEndlessMode(true);
    setPace('walk');
  };

  const currentVignette = CONTINUOUS_VIGNETTES[vignetteIdx];

  return (
    <main id="app-root" className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none">
      {/* 1. Fullscreen Three.js 3D Universe & Walking Duo */}
      <CosmicThreeScene
        pace={pace}
        view={view}
        sceneryShift={sceneryShift}
        onRedObjectResonance={handleRedObjectResonance}
      />

      {/* 2. Top Navigation & Status Bar */}
      <TopBar
        currentChapter={currentNode.chapter}
        distance={distance}
        pace={pace}
        onChangePace={setPace}
        view={view}
        onChangeView={handleChangeView}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenChronicle={() => setIsChronicleOpen(true)}
        zenMode={zenMode}
        onToggleZenMode={() => setZenMode(!zenMode)}
        onRestart={handleRestart}
        stats={stats}
      />

      {/* Perspective Shift Toast Indicator */}
      <AnimatePresence>
        {viewToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="px-3.5 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-[11px] font-artistic text-white/80 tracking-[0.1em] uppercase shadow-[0_4px_20px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
              <span>{viewToast}</span>
              <span className="text-white/35 font-garamond text-[9px] tracking-normal lowercase ml-1">(scroll wheel to zoom)</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Floating Choice in Mid-Air */}
      {!zenMode && (
        <FloatingChoiceOverlay
          currentNode={currentNode}
          onSelectChoice={handleSelectChoice}
          isVisible={isChoiceVisible && !currentNarration}
        />
      )}

      {/* 4. Poetic Reflection / Narration Overlay */}
      {!zenMode && (
        <NarrationOverlay
          narration={currentNarration}
          onDismiss={handleDismissNarration}
        />
      )}

      {/* 5. Subtle Bottom Philosophical Vignette */}
      {!zenMode && (
        <VignetteBar
          quote={currentVignette.quote}
          author={currentVignette.author}
          visible={showVignette && !isChoiceVisible && !currentNarration && !currentNode.isEnding}
        />
      )}

      {/* 6. Ending Screen */}
      {currentNode.isEnding && currentNode.endingData && !endlessMode && (
        <EndingModal
          ending={currentNode.endingData}
          stats={stats}
          distance={distance}
          onRestart={handleRestart}
          onOpenChronicle={() => setIsChronicleOpen(true)}
          onContinueEndless={handleContinueEndless}
        />
      )}

      {/* 7. Chronicle / Logbook Modal */}
      <ChronicleModal
        isOpen={isChronicleOpen}
        onClose={() => setIsChronicleOpen(false)}
        entries={chronicle}
        stats={stats}
        distance={distance}
      />
    </main>
  );
}
