import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  Clock,
  Crown,
  Flag,
  Heart,
  Home,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { QUESTIONS } from '../data/questions';
import { audio } from '../game/audio';
import { RaceEngine } from '../game/RaceEngine';
import type { AudioSettings, OutcomeType, RaceStats } from '../types';
import { EMPTY_STATS, MAX_LIVES, OPTION_COLORS, OPTION_LETTERS, QUESTION_TIME } from '../types';
import { Confetti, RaceButton, SettingsModal } from '../components/ui';

type Phase = 'intro' | 'playing' | 'evaluating' | 'paused';
type ControlName = 'up' | 'down' | 'left' | 'right';

interface Outcome {
  type: OutcomeType;
  chosen: number;
  correct: number;
  points: number;
  newLives: number;
  newRank: number;
}

interface RaceScreenProps {
  settings: AudioSettings;
  onSettingsChange: (s: AudioSettings) => void;
  onGameOver: (stats: RaceStats) => void;
  onFinish: (stats: RaceStats) => void;
  onQuit: () => void;
  onRestart: () => void;
}

const RIVAL_COLORS = ['#2f6fed', '#f1c232', '#8b5cf6'];

function ordinal(n: number) {
  return `P${n}`;
}

function formatScore(n: number) {
  return n.toLocaleString('id-ID');
}

function buildPositions(playerRank: number) {
  let rival = 0;
  return [1, 2, 3, 4].map((pos) => {
    if (pos === playerRank) return { pos, label: 'KAMU', isPlayer: true, color: '#ffd24a' };
    rival += 1;
    return { pos, label: `RIVAL ${rival}`, isPlayer: false, color: RIVAL_COLORS[(rival - 1) % 3] };
  });
}

function PositionBoard({ rank, compact = false }: { rank: number; compact?: boolean }) {
  const rows = buildPositions(rank);
  if (compact) {
    return (
      <div className="hud-frame flex items-center gap-1.5 rounded-lg px-2 py-1">
        <Flag className="h-3.5 w-3.5 text-[#ffd24a]" />
        <span className="font-display text-[10px] font-bold tracking-wider text-sky-100/80">POSISI</span>
        <span className="font-display text-[15px] font-extrabold leading-none text-[#ffd24a]">{ordinal(rank)}</span>
      </div>
    );
  }
  return (
    <div className="hud-frame overflow-hidden rounded-xl">
      <div className="ribbon-gold flex items-center justify-center gap-1.5 px-2 py-[3px]">
        <Crown className="h-3 w-3 text-[#4a3000]" />
        <span className="font-display text-[11px] font-extrabold tracking-[0.14em] text-[#3a2500]">POSISI</span>
      </div>
      <div className="space-y-[3px] p-1">
        {rows.map((row) => (
          <div
            key={row.pos}
            className={`flex items-center gap-1.5 rounded-md border px-1.5 py-[3px] transition ${
              row.isPlayer
                ? 'border-[#ffd24a]/80 bg-gradient-to-r from-[#6d4a05] via-[#8a5e06] to-[#5b3f06] shadow-[inset_0_1px_0_rgba(255,255,255,.25)]'
                : 'border-white/10 bg-[#0a2137]/75'
            }`}
          >
            <span className={`h-3.5 w-[5px] rounded-sm ${row.isPlayer ? 'bg-[#ffd24a]' : 'bg-white/25'}`} />
            <span className="w-[15px] font-display text-[11px] font-extrabold text-white/90">{row.pos}</span>
            <span className={`flex-1 truncate font-display text-[11px] font-bold ${row.isPlayer ? 'text-[#fff4c9]' : 'text-white/75'}`}>
              {row.label}
            </span>
            {row.isPlayer && <Zap className="h-2.5 w-2.5 fill-[#ffe57a] text-[#ffe57a]" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimerArc({ timeLeft }: { timeLeft: number }) {
  const pct = Math.max(0, Math.min(1, timeLeft / QUESTION_TIME));
  const low = timeLeft <= 5;
  const warn = timeLeft <= 10;
  const stroke = low ? '#f87171' : warn ? '#fbbf24' : '#4ade80';
  return (
    <div className="relative h-11 w-11 shrink-0 sm:h-14 sm:w-14">
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
        <circle cx="24" cy="24" r="20" fill="rgba(3,15,28,0.7)" stroke="rgba(255,255,255,0.14)" strokeWidth="5" />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${126 * pct} 126`}
          className="transition-[stroke] duration-300"
          style={{ filter: `drop-shadow(0 0 3px ${stroke})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-[20px] font-extrabold leading-none tabular-nums sm:text-[26px] ${low ? 'animate-pulse text-[#ff8c96]' : 'text-white'}`}>
          {Math.ceil(timeLeft)}
        </span>
        <span className="text-[6px] font-bold uppercase tracking-wider text-sky-100/60 sm:text-[8px]">detik</span>
      </div>
    </div>
  );
}

function TimerCard({ timeLeft }: { timeLeft: number }) {
  const pct = Math.max(0, Math.min(100, (timeLeft / QUESTION_TIME) * 100));
  const low = timeLeft <= 5;
  const warn = timeLeft <= 10;
  const barColor = low ? 'from-[#ff5566] to-[#b91c1c]' : warn ? 'from-[#fde68a] to-[#d97706]' : 'from-[#86efac] to-[#15803d]';
  return (
    <div className={`hud-frame rounded-xl p-1.5 ${low ? 'border-[#ff7385]/70 warning-flash' : ''}`}>
      <div className="flex items-center justify-between gap-1">
        <div>
          <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.12em] text-sky-100/70">
            <Clock className="h-2.5 w-2.5" /> Sisa Waktu
          </p>
          <p className={`font-display text-[26px] font-extrabold leading-none tabular-nums ${low ? 'text-[#ff8c96]' : 'text-white'}`}>
            {Math.ceil(timeLeft)}
            <span className="ml-1 text-[10px] font-semibold text-sky-100/60">dtk</span>
          </p>
        </div>
        <TimerArc timeLeft={timeLeft} />
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full border border-white/15 bg-[#04121f]">
        <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-[width] duration-100 ease-linear`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Speedometer({ speed, lane }: { speed: number; lane: number }) {
  const pct = Math.min(1, speed / 320);
  const dash = 2 * Math.PI * 40;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-[78px] w-[78px] rounded-full border-2 border-[#c9dcee]/85 bg-[radial-gradient(circle_at_50%_32%,#1d3f5e_0%,#0a2035_52%,#03101d_100%)] shadow-[0_4px_0_rgba(0,0,0,.55),0_8px_18px_rgba(0,0,0,.45),inset_0_2px_0_rgba(255,255,255,.25)] sm:h-[104px] sm:w-[104px]">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-[220deg]">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" strokeDasharray={`${dash * 0.78} ${dash}`} strokeLinecap="round" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={pct > 0.82 ? '#ff6b6b' : pct > 0.55 ? '#ffd24a' : '#53e0a0'}
            strokeWidth="7"
            strokeDasharray={`${dash * 0.78 * pct} ${dash}`}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 4px rgba(94,231,166,.65))', transition: 'stroke-dasharray .12s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[27px] font-extrabold leading-none tabular-nums text-white drop-shadow-[0_2px_3px_rgba(0,0,0,.65)] sm:text-[36px]">
            {speed}
          </span>
          <span className="text-[6.5px] font-bold uppercase tracking-[0.18em] text-sky-100/65 sm:text-[8px]">km/jam</span>
        </div>
      </div>
      <div className="flex items-center gap-1 rounded-full border border-white/15 bg-[#04121f]/85 px-1.5 py-[2px]">
        <span className="text-[7px] font-bold uppercase tracking-wider text-sky-100/55">Jalur</span>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`grid h-3 w-3 place-items-center rounded-[2px] text-[7px] font-extrabold leading-none transition sm:h-3.5 sm:w-3.5 sm:text-[8px] ${
              lane === i ? 'scale-110 text-[#08131f] shadow-[0_0_6px_rgba(255,255,255,.55)]' : 'text-white/60'
            }`}
            style={{ backgroundColor: lane === i ? OPTION_COLORS[i] : `${OPTION_COLORS[i]}55` }}
          >
            {OPTION_LETTERS[i]}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1 rounded-full border border-[#5ee89a]/30 bg-[#06271d]/85 px-2 py-[2px] text-[6.5px] font-extrabold uppercase tracking-[0.13em] text-[#9bf5c4] shadow-[0_2px_6px_rgba(0,0,0,.3)] sm:text-[8px]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5ee89a] opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#5ee89a]" />
        </span>
        Auto drive aktif
      </div>
    </div>
  );
}

export default function RaceScreen({ settings, onSettingsChange, onGameOver, onFinish, onQuit, onRestart }: RaceScreenProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RaceEngine | null>(null);
  const mountedRef = useRef(true);
  const phaseRef = useRef<Phase>('intro');
  const qIndexRef = useRef(0);
  const statsRef = useRef<RaceStats>({ ...EMPTY_STATS });
  const usedRef = useRef(false);
  const remainingRef = useRef(QUESTION_TIME);
  const advancingRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const highlightTimersRef = useRef<number[]>([]);
  const pressedRef = useRef<Record<ControlName, boolean>>({ up: false, down: false, left: false, right: false });
  const lastWholeRef = useRef(QUESTION_TIME);
  const evaluateRef = useRef<(gate: number) => void>(() => {});
  const timeoutRef = useRef<() => void>(() => {});

  const [phase, setPhase] = useState<Phase>('intro');
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [stats, setStats] = useState<RaceStats>({ ...EMPTY_STATS });
  const [speed, setSpeed] = useState(0);
  const [lane, setLane] = useState(2);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [pressed, setPressed] = useState<Record<ControlName, boolean>>({ up: false, down: false, left: false, right: false });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [flash, setFlash] = useState(false);

  const question = QUESTIONS[qIndex];

  const setPhaseBoth = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const releaseAll = useCallback(() => {
    (['up', 'down', 'left', 'right'] as ControlName[]).forEach((c) => {
      pressedRef.current[c] = false;
      engineRef.current?.setControl(c, false);
    });
    setPressed({ up: false, down: false, left: false, right: false });
  }, []);

  const commitStats = useCallback((patch: Partial<RaceStats>) => {
    const next = { ...statsRef.current, ...patch };
    statsRef.current = next;
    setStats(next);
  }, []);

  // Engine lifecycle
  useEffect(() => {
    mountedRef.current = true;
    if (!containerRef.current) return;
    const engine = new RaceEngine(containerRef.current, {
      onSpeed: (kmh) => {
        setSpeed(kmh);
        audio.updateEngine(kmh / 320, pressedRef.current.up);
      },
      onLane: (laneIndex) => setLane(laneIndex),
      onGate: (gate) => evaluateRef.current(gate),
    });
    engineRef.current = engine;
    engine.setQuestion(QUESTIONS[0].options);
    audio.init();
    audio.startEngine();
    return () => {
      mountedRef.current = false;
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      highlightTimersRef.current.forEach((id) => window.clearTimeout(id));
      audio.stopEngine();
      engine.dispose();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, []);

  const openSettings = () => setSettingsOpen(true);

  const advance = useCallback(() => {
    if (!mountedRef.current) return;
    advancingRef.current = true;
    releaseAll();
    const engine = engineRef.current;
    const s = statsRef.current;
    const finish = (kind: 'gameover' | 'finish') => {
      audio.stopEngine();
      const finalStats: RaceStats = { ...s, questionsSeen: Math.min(QUESTIONS.length, qIndexRef.current + 1) };
      if (kind === 'gameover') onGameOver(finalStats);
      else onFinish(finalStats);
    };
    if (s.lives <= 0) {
      advanceTimerRef.current = null;
      finish('gameover');
      return;
    }
    const next = qIndexRef.current + 1;
    if (next >= QUESTIONS.length) {
      advanceTimerRef.current = null;
      audio.win();
      finish('finish');
      return;
    }
    advanceTimerRef.current = null;
    qIndexRef.current = next;
    setQIndex(next);
    setOutcome(null);
    remainingRef.current = QUESTION_TIME;
    lastWholeRef.current = QUESTION_TIME;
    setTimeLeft(QUESTION_TIME);
    usedRef.current = false;
    advancingRef.current = false;
    engine?.clearHighlight();
    engine?.beginRound(QUESTIONS[next].options);
    engine?.setStartLights(5);
    setPhaseBoth('playing');
    setFlash(true);
    window.setTimeout(() => setFlash(false), 850);
  }, [onFinish, onGameOver, releaseAll, setPhaseBoth]);

  const resolveAnswer = useCallback(
    (choice: number | 'timeout') => {
      if (usedRef.current || phaseRef.current !== 'playing') return;
      usedRef.current = true;
      releaseAll();
      const currentQuestion = QUESTIONS[qIndexRef.current];
      const correct = currentQuestion.answer;
      const isTimeout = choice === 'timeout';
      const type: OutcomeType = isTimeout ? 'timeout' : choice === correct ? 'correct' : 'wrong';
      const engine = engineRef.current;
      // Evaluation never parks the car: only answer input is locked.
      engine?.beginEvaluation();

      const prev = statsRef.current;
      const newLives = type === 'correct' ? prev.lives : Math.max(0, prev.lives - 1);
      const newRank = type === 'correct' ? Math.max(1, prev.rank - 1) : Math.min(4, prev.rank + 1);
      const points = type === 'correct' ? 100 : 0;
      const patch: Partial<RaceStats> = {
        lives: newLives,
        rank: newRank,
        score: prev.score + points,
        correct: prev.correct + (type === 'correct' ? 1 : 0),
        wrong: prev.wrong + (type === 'wrong' ? 1 : 0),
        missed: prev.missed + (type === 'timeout' ? 1 : 0),
      };
      commitStats(patch);
      engine?.setRank(newRank);

      if (type === 'correct') {
        engine?.setTurbo(true);
        engine?.highlightGate(correct, true);
        audio.correct();
        window.setTimeout(() => audio.turbo(), 120);
      } else if (type === 'wrong') {
        engine?.highlightGate(typeof choice === 'number' ? choice : correct, false);
        audio.wrong();
        const id = window.setTimeout(() => engine?.highlightGate(correct, true), 900);
        highlightTimersRef.current.push(id);
      } else {
        engine?.highlightGate(correct, true);
        audio.timeout();
      }

      setOutcome({ type, chosen: typeof choice === 'number' ? choice : -1, correct, points, newLives, newRank });
      setPhaseBoth('evaluating');
      advancingRef.current = false;
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = window.setTimeout(() => {
        if (advancingRef.current) return;
        advance();
      }, type === 'correct' ? 2900 : 3400);
    },
    [advance, commitStats, releaseAll, setPhaseBoth],
  );

  evaluateRef.current = (gate: number) => resolveAnswer(gate);
  timeoutRef.current = () => resolveAnswer('timeout');

  // Start-light intro
  useEffect(() => {
    let step = 0;
    const totalSteps = 4;
    engineRef.current?.setStartLights(1);
    audio.countdown(false);
    const interval = window.setInterval(() => {
      step += 1;
      if (step < totalSteps) {
        setCountdown(3 - step);
        engineRef.current?.setStartLights(Math.min(4, step + 1));
        audio.countdown(false);
      } else {
        window.clearInterval(interval);
        setCountdown(0);
        engineRef.current?.setStartLights(5);
        audio.countdown(true);
        window.setTimeout(() => {
          if (!mountedRef.current) return;
          setCountdown(-1);
          setPhaseBoth('playing');
          engineRef.current?.setFrozen(false);
          setFlash(true);
          window.setTimeout(() => setFlash(false), 850);
        }, 700);
      }
    }, 700);
    return () => window.clearInterval(interval);
  }, [setPhaseBoth]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      if (!mountedRef.current) return;
      // Wall-clock delta: the 20-second rule stays accurate even on slow devices.
      const dt = Math.max(0, (now - last) / 1000);
      last = now;
      remainingRef.current = Math.max(0, remainingRef.current - dt);
      acc += dt;
      if (acc >= 0.09) {
        acc = 0;
        setTimeLeft(remainingRef.current);
        const whole = Math.ceil(remainingRef.current);
        if (whole !== lastWholeRef.current) {
          lastWholeRef.current = whole;
          if (whole > 0 && whole <= 5) audio.tick(true);
          else if (whole > 5 && whole <= 10) audio.tick(false);
        }
      }
      if (remainingRef.current <= 0) {
        setTimeLeft(0);
        timeoutRef.current();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, qIndex]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'playing') {
      releaseAll();
      engineRef.current?.setFrozen(true);
      setPhaseBoth('paused');
    } else if (phaseRef.current === 'paused') {
      engineRef.current?.setFrozen(false);
      setPhaseBoth('playing');
    }
  }, [releaseAll, setPhaseBoth]);

  // Keyboard controls
  useEffect(() => {
    const keyMap: Record<string, ControlName> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
      w: 'up',
      s: 'down',
      a: 'left',
      d: 'right',
      W: 'up',
      S: 'down',
      A: 'left',
      D: 'right',
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (settingsOpen) setSettingsOpen(false);
        else togglePause();
        return;
      }
      const control = keyMap[e.key];
      if (!control) return;
      e.preventDefault();
      if (e.repeat) return;
      if (phaseRef.current !== 'playing') return;
      pressedRef.current[control] = true;
      engineRef.current?.setControl(control, true);
      setPressed((p) => ({ ...p, [control]: true }));
      if (control === 'down') audio.whoosh();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const control = keyMap[e.key];
      if (!control) return;
      pressedRef.current[control] = false;
      engineRef.current?.setControl(control, false);
      setPressed((p) => ({ ...p, [control]: false }));
    };
    const onBlur = () => releaseAll();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [releaseAll, settingsOpen, togglePause]);

  const setControl = (control: ControlName, active: boolean) => {
    if (phaseRef.current !== 'playing') return;
    pressedRef.current[control] = active;
    engineRef.current?.setControl(control, active);
    setPressed((p) => ({ ...p, [control]: active }));
    if (active && control === 'down') audio.whoosh();
  };

  const holdProps = (control: ControlName) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setControl(control, true);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setControl(control, false);
    },
    onPointerCancel: () => setControl(control, false),
    onLostPointerCapture: () => setControl(control, false),
    onContextMenu: (e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(),
  });

  const pause = phase === 'paused';
  const playing = phase === 'playing';
  const evaluating = phase === 'evaluating';
  const muted = !settings.music && !settings.sfx;
  const controlsDisabled = phase !== 'playing';
  const pct = Math.max(0, Math.min(100, (timeLeft / QUESTION_TIME) * 100));

  const toggleMute = () => {
    if (muted) onSettingsChange({ music: true, sfx: true });
    else onSettingsChange({ music: false, sfx: false });
  };

  const skipResult = () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    advance();
  };

  const questionCard = (
    <div className="silver-frame rounded-xl">
      <div className="relative overflow-hidden rounded-[9px] bg-gradient-to-b from-[#fdfefe] via-[#eef5fb] to-[#dce9f4] px-2 pb-1.5 pt-1.5 shadow-inner sm:px-4 sm:pb-3 sm:pt-2">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <span className="ribbon-red rounded-[4px] px-2 py-1 font-display text-[12px] font-extrabold italic tracking-wide text-white sm:px-2.5 sm:text-[15px]">
              SOAL {String(qIndex + 1).padStart(2, '0')}/20
            </span>
            <span className="hidden items-center gap-1 rounded-full bg-[#0a2742] px-2 py-0.5 text-[7.5px] font-bold uppercase tracking-[0.14em] text-sky-100 sm:flex">
              <Flag className="h-2.5 w-2.5 text-[#ffd24a]" /> IPAS · JEJAK SANG PAHLAWAN
            </span>
          </div>
          <p className="race-question-text min-w-0 flex-1 self-center text-center text-[14px] font-extrabold leading-[1.3] text-[#071c30] sm:text-[18px] sm:leading-[1.3] lg:text-[20px]">
            {question.question}
          </p>
          <div className="flex shrink-0 flex-col items-center sm:hidden">
            <div className={`grid h-9 w-9 place-items-center rounded-full border-2 ${timeLeft <= 5 ? 'border-[#ff5566] bg-[#fff1f2]' : 'border-[#0f4c81] bg-[#eaf6ff]'}`}>
              <span className={`font-display text-[18px] font-extrabold leading-none ${timeLeft <= 5 ? 'text-[#d21f36]' : 'text-[#0f4c81]'}`}>{Math.ceil(timeLeft)}</span>
            </div>
            <span className="mt-0.5 text-[7px] font-bold uppercase text-[#4b6b86]">detik</span>
          </div>
        </div>
        <div className="mt-0.5 flex items-center gap-2 sm:mt-2">
          <Clock className="h-3 w-3 shrink-0 text-[#43688a]" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#b9cddd]">
            <div
              className={`h-full rounded-full transition-[width] duration-100 ease-linear ${timeLeft <= 5 ? 'bg-gradient-to-r from-[#ff7a86] to-[#c3162a]' : timeLeft <= 10 ? 'bg-gradient-to-r from-[#fbd34d] to-[#d48305]' : 'bg-gradient-to-r from-[#54d98c] to-[#0f7c43]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="hidden shrink-0 font-display text-[9px] font-bold uppercase tracking-wider text-[#43688a] sm:block">
            SISA WAKTU
          </span>
        </div>
      </div>
    </div>
  );

  const optionStrip = (
    <div className="mt-0.5 sm:mt-1.5">
      <div className="mx-auto mb-1 hidden max-w-[1080px] items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-sky-100/75 sm:flex sm:text-[10px]">
        <ChevronRight className="h-3 w-3 text-[#ffd24a]" />
        GERBANG JAWABAN · BACA DI LINTASAN
        <ChevronRight className="h-3 w-3 rotate-180 text-[#ffd24a]" />
      </div>
      <div className="mx-auto grid max-w-[1080px] grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
        {question.options.map((opt, i) => (
          <div
            key={i}
            className="race-option flex min-h-[46px] min-w-0 items-stretch gap-1.5 rounded-md border border-white/25 bg-[#031222]/96 shadow-[0_3px_8px_rgba(0,0,0,.4)] backdrop-blur-sm sm:min-h-[54px]"
            style={{ borderTopColor: OPTION_COLORS[i], borderTopWidth: 3 }}
          >
            <span className="gate-chip flex w-[24px] shrink-0 items-center justify-center text-[14px] sm:w-[28px] sm:text-[16px]" style={{ backgroundColor: OPTION_COLORS[i] }}>
              {OPTION_LETTERS[i]}
            </span>
            <span className="race-options-text block min-w-0 flex-1 self-center whitespace-normal break-words py-1.5 pr-1.5 text-[12px] font-semibold leading-[1.28] text-white [overflow-wrap:anywhere] [text-overflow:clip] min-[400px]:text-[12.5px] sm:py-2 sm:text-[13.5px] lg:text-[14.5px]">
              {opt}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main className="race-root relative h-[100svh] w-full select-none overflow-hidden bg-[#04101f]">
      <div ref={containerRef} className="absolute inset-0" />

      {/* subtle vignette to improve HUD legibility */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(2,9,17,0.5)_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-[#020b15]/85 via-[#020b15]/45 to-transparent sm:h-44" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-[#020b15]/80 via-[#020b15]/30 to-transparent" />

      {/* ============ HUD TOP ============ */}
      <div className="race-hud-top absolute inset-x-0 top-0 z-30 px-1.5 pt-1.5 sm:px-3 sm:pt-3">
        <div className="mx-auto flex max-w-[1540px] items-start gap-2">
          <div className="hidden w-[128px] shrink-0 xl:block">
            <PositionBoard rank={stats.rank} />
            <div className="mt-1 flex items-center justify-between rounded-md border border-white/15 bg-[#04121f]/80 px-1.5 py-1 text-[8px] font-semibold text-sky-100/60">
              <span>SIRKUIT</span>
              <span className="font-display text-[9px] font-bold text-[#ffd24a]">JEJAK PAHLAWAN</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {/* mobile status row */}
            <div className="mb-0.5 flex items-center gap-1 sm:hidden">
              <PositionBoard rank={stats.rank} compact />
              <div className="hud-frame flex h-7 items-center gap-1 rounded-lg px-1.5 py-0.5">
                <Heart className="h-3 w-3 fill-[#ff5566] text-[#ff9ca7]" />
                <span className="font-display text-[13px] font-extrabold leading-none text-white">{stats.lives}</span>
              </div>
              <div className="hud-frame flex h-7 items-center gap-1 rounded-lg px-1.5 py-0.5">
                <Trophy className="h-3 w-3 text-[#ffd24a]" />
                <span className="font-display text-[13px] font-extrabold leading-none tabular-nums text-white">{formatScore(stats.score)}</span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" onClick={toggleMute} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'} className="grid h-8 w-8 place-items-center rounded-lg border border-white/25 bg-[#071a2d]/95 text-sky-100">
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button type="button" onClick={togglePause} disabled={phase === 'intro' || evaluating} aria-label="Jeda permainan" className="grid h-8 w-8 place-items-center rounded-lg border border-white/25 bg-[#071a2d]/95 text-sky-100 disabled:opacity-40">
                  <Pause className="h-4 w-4" />
                </button>
              </div>
            </div>

            {questionCard}
            {optionStrip}
            <div className="mx-auto mt-0.5 flex w-fit items-center gap-1 rounded-full border border-sky-200/25 bg-[#04182a]/85 px-2 py-[2px] backdrop-blur-sm sm:hidden">
              <span className="text-[6.5px] font-bold uppercase tracking-[0.12em] text-sky-100/70">LAJUR</span>
              {OPTION_LETTERS.map((letter, i) => (
                <button
                  key={letter}
                  type="button"
                  disabled={phase !== 'playing' || lane === i}
                  onClick={() => {
                    if (phaseRef.current !== 'playing') return;
                    releaseAll();
                    engineRef.current?.setLane(i);
                  }}
                  aria-label={`Pindah cepat ke gerbang ${letter}, jalur ${i + 1}`}
                  className={`grid h-[15px] w-[15px] place-items-center rounded-[3px] font-display text-[8px] font-extrabold leading-none transition active:scale-90 disabled:opacity-45 ${
                    lane === i ? 'text-[#08131f] shadow-[0_0_5px_rgba(255,255,255,.5)]' : 'text-white/75'
                  }`}
                  style={{ backgroundColor: lane === i ? OPTION_COLORS[i] : `${OPTION_COLORS[i]}66` }}
                >
                  {letter}
                </button>
              ))}
              <span className="ml-0.5 text-[6.5px] font-medium text-sky-100/45">tap cepat</span>
            </div>
          </div>

          <div className="hidden w-[150px] shrink-0 sm:block lg:w-[168px]">
            <TimerCard timeLeft={timeLeft} />
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <div className="hud-frame rounded-lg px-1 py-1 text-center">
                <p className="flex items-center justify-center gap-1 text-[7.5px] font-bold uppercase tracking-wider text-sky-100/60">
                  <Heart className="h-2.5 w-2.5 fill-[#ff5566] text-[#ff9ca7]" /> NYAWA
                </p>
                <div className="mt-0.5 flex items-center justify-center gap-0.5">
                  {Array.from({ length: MAX_LIVES }).map((_, i) => (
                    <Heart key={i} className={`h-3.5 w-3.5 ${i < stats.lives ? 'fill-[#ff4d62] text-[#ffd0d6]' : 'fill-transparent text-white/25'}`} strokeWidth={2.4} />
                  ))}
                </div>
              </div>
              <div className="hud-frame rounded-lg px-1 py-1 text-center">
                <p className="flex items-center justify-center gap-1 text-[7.5px] font-bold uppercase tracking-wider text-sky-100/60">
                  <Trophy className="h-2.5 w-2.5 text-[#ffd24a]" /> SKOR
                </p>
                <p className="font-display text-[16px] font-extrabold leading-tight tabular-nums text-white">{formatScore(stats.score)}</p>
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-end gap-1">
              <button type="button" onClick={toggleMute} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'} className="hud-frame grid h-8 w-8 place-items-center rounded-md text-sky-100 transition hover:brightness-125">
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button type="button" onClick={openSettings} aria-label="Pengaturan suara" className="hud-frame grid h-8 w-8 place-items-center rounded-md text-sky-100 transition hover:brightness-125">
                <Sparkles className="h-4 w-4" />
              </button>
              <button type="button" onClick={togglePause} disabled={phase === 'intro' || evaluating} aria-label="Jeda permainan" className="hud-frame grid h-8 w-8 place-items-center rounded-md text-sky-100 transition hover:brightness-125 disabled:opacity-40">
                <Pause className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* center "GO" flash */}
      {flash && !evaluating && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
          <div className="animate-pop-in flex flex-col items-center">
            <span className="race-title-gold text-[64px] leading-none drop-shadow-[0_6px_18px_rgba(0,0,0,.6)] sm:text-[96px]">GO!</span>
            <span className="mt-1 rounded-full border border-white/25 bg-[#04182a]/85 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-sky-100">
              Gas! Lewati gerbang jawabanmu
            </span>
          </div>
        </div>
      )}

      {/* ============ CONTROLS ============ */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-0 pb-[max(4px,env(safe-area-inset-bottom))] sm:px-4 sm:pb-4">
        <div className="mx-auto flex max-w-[1540px] items-end justify-between gap-1 sm:gap-4">
          {/* left/right */}
          <div className="pointer-events-auto">
            <div className="mb-1 flex items-center justify-center gap-1 sm:justify-start">
              <span className="hidden rounded border border-white/20 bg-[#04121f]/80 px-1 py-[1px] text-[8px] font-bold text-sky-100/60 sm:block">← →</span>
              <span className="font-display text-[8px] font-bold uppercase tracking-[0.14em] text-sky-100/75 sm:text-[9px]">Belok</span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Belok kiri"
                disabled={controlsDisabled}
                {...holdProps('left')}
                className={`control-pad relative h-[58px] w-[58px] disabled:opacity-60 min-[400px]:h-[64px] min-[400px]:w-[64px] sm:h-[72px] sm:w-[72px] lg:h-[78px] lg:w-[78px] ${pressed.left ? 'is-active' : ''}`}
              >
                <ArrowLeft className="h-7 w-7 sm:h-9 sm:w-9" strokeWidth={2.7} />
                <span className="absolute bottom-0.5 font-display text-[6.5px] font-extrabold tracking-[0.12em] text-white/80">KIRI</span>
              </button>
              <button
                type="button"
                aria-label="Belok kanan"
                disabled={controlsDisabled}
                {...holdProps('right')}
                className={`control-pad relative h-[58px] w-[58px] disabled:opacity-60 min-[400px]:h-[64px] min-[400px]:w-[64px] sm:h-[72px] sm:w-[72px] lg:h-[78px] lg:w-[78px] ${pressed.right ? 'is-active' : ''}`}
              >
                <ArrowRight className="h-7 w-7 sm:h-9 sm:w-9" strokeWidth={2.7} />
                <span className="absolute bottom-0.5 font-display text-[6.5px] font-extrabold tracking-[0.12em] text-white/80">KANAN</span>
              </button>
            </div>
            <p className="mt-1 hidden max-w-[168px] text-center text-[8px] leading-tight text-sky-100/50 sm:block">
              Tekan &amp; tahan untuk berpindah jalur
            </p>
          </div>

          {/* speedometer */}
          <div className="pointer-events-none mb-1 flex flex-1 justify-center">
            <Speedometer speed={speed} lane={lane} />
          </div>

          {/* gas / brake */}
          <div className="pointer-events-auto flex flex-col items-end gap-1.5">
            <button
              type="button"
              aria-label="Gas, mempercepat mobil"
              disabled={controlsDisabled}
              {...holdProps('up')}
              className={`control-pad control-gas h-[58px] w-[72px] flex-col gap-0 disabled:opacity-60 sm:h-[64px] sm:w-[86px] lg:h-[68px] lg:w-[94px] ${pressed.up ? 'is-active' : ''}`}
            >
              <ArrowUp className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.8} />
              <span className="font-display text-[8px] font-extrabold tracking-[0.16em] sm:text-[9px]">GAS</span>
            </button>
            <button
              type="button"
              aria-label="Rem, memperlambat mobil"
              disabled={controlsDisabled}
              {...holdProps('down')}
              className={`control-pad control-brake h-[58px] w-[72px] flex-col gap-0 disabled:opacity-60 sm:h-[64px] sm:w-[86px] lg:h-[68px] lg:w-[94px] ${pressed.down ? 'is-active' : ''}`}
            >
              <ArrowDown className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.8} />
              <span className="font-display text-[8px] font-extrabold tracking-[0.16em] sm:text-[9px]">REM</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============ START LIGHTS ============ */}
      {phase === 'intro' && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-[#020b15]/45 px-3 backdrop-blur-[2px]">
          <div className="animate-pop-in w-full max-w-md overflow-hidden rounded-2xl border-2 border-sky-300/50 bg-gradient-to-b from-[#0a2742]/97 to-[#041322]/98 shadow-[0_22px_60px_rgba(0,0,0,.65)]">
            <div className="ribbon-red flex items-center justify-between px-3 py-1.5">
              <span className="font-display text-[15px] font-extrabold italic tracking-wide text-white">LAMPU START</span>
              <span className="rounded bg-black/25 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white/80">Sirkuit Jejak Pahlawan</span>
            </div>
            <div className="p-4 text-center">
              <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-[#07182a] px-3 py-2 shadow-inner">
                {[0, 1, 2, 3, 4].map((i) => {
                  const on = countdown <= 0 ? true : i < (countdown === 3 ? 2 : countdown === 2 ? 3 : 4);
                  return (
                    <span
                      key={i}
                      className={`h-7 w-7 rounded-full border-2 transition-all duration-300 sm:h-9 sm:w-9 ${
                        on
                          ? countdown <= 0
                            ? 'border-[#a7f3c9] bg-[#38e27c] shadow-[0_0_16px_#38e27c]'
                            : 'border-[#ffb3b9] bg-[#ff3049] shadow-[0_0_16px_#ff3049]'
                          : 'border-white/20 bg-[#2a1820]'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="font-display text-[11px] font-bold uppercase tracking-[0.24em] text-sky-100/70">
                {countdown <= 0 ? 'BALAPAN DIMULAI!' : 'BERSIAP DI POSISI P2'}
              </p>
              <p className="race-title-gold my-1 text-[64px] leading-none sm:text-[82px]">{countdown <= 0 ? 'GO!' : countdown}</p>
              <div className="mx-auto grid max-w-sm grid-cols-3 gap-1.5 text-center">
                <div className="rounded-lg border border-white/15 bg-white/5 p-1.5">
                  <p className="font-display text-[16px] font-extrabold leading-none text-[#ffd24a]">20</p>
                  <p className="text-[8px] font-semibold uppercase tracking-wide text-sky-100/60">Soal</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/5 p-1.5">
                  <p className="font-display text-[16px] font-extrabold leading-none text-[#ff8c96]">3</p>
                  <p className="text-[8px] font-semibold uppercase tracking-wide text-sky-100/60">Nyawa</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/5 p-1.5">
                  <p className="font-display text-[16px] font-extrabold leading-none text-[#7ed6ff]">20s</p>
                  <p className="text-[8px] font-semibold uppercase tracking-wide text-sky-100/60">Per soal</p>
                </div>
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-sky-100/75">
                <Zap className="h-3.5 w-3.5 text-[#ffd24a]" /> Mobil melaju otomatis. GAS untuk sprint, arahkan ke jawaban benar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============ EVALUATION ============ */}
      {evaluating && outcome && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#020b15]/38 px-2.5 backdrop-blur-[1px]">
          {outcome.type === 'correct' && <Confetti count={44} />}
          <div className="animate-pop-in relative w-full max-w-[480px] overflow-hidden rounded-2xl border-2 border-white/25 bg-gradient-to-b from-[#082237]/98 to-[#03101d]/99 shadow-[0_24px_70px_rgba(0,0,0,.75)]">
            <div
              className={`relative overflow-hidden px-4 py-3 text-center ${
                outcome.type === 'correct'
                  ? 'bg-[linear-gradient(120deg,#0b7a42,#20c969_45%,#0a5f34)]'
                  : 'bg-[linear-gradient(120deg,#8d0f1c,#e11d2e_45%,#790713)]'
              }`}
            >
              <div className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0_18px,rgba(255,255,255,.07)_18px_36px)]" />
              <div className="relative flex items-center justify-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white/85 bg-white/15 shadow">
                  {outcome.type === 'correct' ? <Check className="h-6 w-6 text-white" strokeWidth={3.4} /> : <X className="h-6 w-6 text-white" strokeWidth={3.4} />}
                </span>
                <div className="text-left">
                  <p className="font-display text-[30px] font-extrabold italic leading-[0.9] tracking-wide text-white drop-shadow-[0_2px_2px_rgba(0,0,0,.4)] sm:text-[38px]">
                    {outcome.type === 'correct' ? 'BENAR!' : outcome.type === 'wrong' ? 'SALAH!' : 'WAKTU HABIS!'}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/95 sm:text-[11.5px]">
                    {outcome.type === 'correct'
                      ? 'KAMU BERHASIL MEMIMPIN!'
                      : outcome.type === 'wrong'
                        ? 'LAWAN BERHASIL MENYUSUL!'
                        : 'KAMU KEHILANGAN SATU NYAWA!'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4">
              {outcome.type === 'correct' ? (
                <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-[#ffd24a]/40 bg-[#3b2b07]/70 px-2.5 py-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#ffe08a]">
                    <Zap className="h-4 w-4 fill-[#ffe08a]" /> TURBO AKTIF · POSISI NAIK
                  </span>
                  <span className="rounded bg-gradient-to-b from-[#ffe57a] to-[#e0a108] px-2 py-0.5 font-display text-[16px] font-extrabold text-[#3a2500] shadow">
                    +{outcome.points} Poin
                  </span>
                </div>
              ) : (
                <div className="mb-2 space-y-1.5">
                  <div className="flex items-center justify-between rounded-lg border border-[#ff7385]/40 bg-[#3a1017]/70 px-2.5 py-1.5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#ffbcc4]">
                      <Heart className="h-4 w-4 fill-[#ff5566] text-[#ffb3bd]" /> NYAWA BERKURANG
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: MAX_LIVES }).map((_, i) => (
                        <Heart key={i} className={`h-4 w-4 ${i < outcome.newLives ? 'fill-[#ff4d62] text-[#ffd0d6]' : 'fill-transparent text-white/25'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="rounded-lg border border-[#ffd24a]/30 bg-[#0a2842] px-2.5 py-1.5 text-[10px] leading-snug text-sky-50/90">
                    <span className="font-bold text-[#ffe08a]">Jawaban yang benar: </span>
                    Gerbang {OPTION_LETTERS[outcome.correct]} — {question.options[outcome.correct]}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-lg border border-white/15 bg-white/[0.05] px-1 py-1.5 text-center">
                  <p className="text-[7px] font-bold uppercase tracking-wide text-sky-100/55">Posisi</p>
                  <p className="font-display text-[16px] font-extrabold leading-none text-[#ffd24a]">{ordinal(outcome.newRank)}</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/[0.05] px-1 py-1.5 text-center">
                  <p className="text-[7px] font-bold uppercase tracking-wide text-sky-100/55">Skor</p>
                  <p className="font-display text-[16px] font-extrabold leading-none text-white">{formatScore(stats.score)}</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/[0.05] px-1 py-1.5 text-center">
                  <p className="text-[7px] font-bold uppercase tracking-wide text-sky-100/55">Nyawa</p>
                  <div className="mt-0.5 flex justify-center gap-0.5">
                    {Array.from({ length: MAX_LIVES }).map((_, i) => (
                      <Heart key={i} className={`h-3 w-3 ${i < outcome.newLives ? 'fill-[#ff4d62] text-[#ffd0d6]' : 'fill-transparent text-white/25'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${outcome.type === 'correct' ? 'bg-[#48e58d]' : 'bg-[#ff5566]'}`} style={{ animation: 'grow-bar 3s linear forwards', width: '100%', transformOrigin: 'left' }} />
                </div>
                <button
                  type="button"
                  onClick={skipResult}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/25 bg-[#0c2c49] px-2.5 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-[#154a76] active:translate-y-0.5"
                >
                  {outcome.newLives <= 0 ? 'Lihat Hasil' : 'Lanjut'} <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ PAUSE ============ */}
      {pause && (
        <div className="absolute inset-0 z-40 grid place-items-center overflow-y-auto bg-[#020b15]/72 px-3 py-4 backdrop-blur-md">
          <div className="animate-pop-in w-full max-w-sm overflow-hidden rounded-2xl border-2 border-sky-300/50 bg-gradient-to-b from-[#0a2742] to-[#04121f] shadow-[0_24px_70px_rgba(0,0,0,.7)]">
            <div className="ribbon-red flex items-center justify-center gap-2 px-3 py-2">
              <Pause className="h-5 w-5 text-white" />
              <h2 className="font-display text-[24px] font-extrabold italic tracking-wide text-white">BALAPAN DIJEDA</h2>
            </div>
            <div className="p-3">
              <div className="mb-2 grid grid-cols-3 gap-1.5">
                <div className="rounded-lg border border-white/15 bg-white/[0.05] p-1.5 text-center">
                  <p className="text-[7px] font-bold uppercase tracking-wider text-sky-100/55">Soal</p>
                  <p className="font-display text-[16px] font-extrabold leading-none text-white">{String(qIndex + 1).padStart(2, '0')}/20</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/[0.05] p-1.5 text-center">
                  <p className="text-[7px] font-bold uppercase tracking-wider text-sky-100/55">Skor</p>
                  <p className="font-display text-[16px] font-extrabold leading-none text-[#ffd24a]">{formatScore(stats.score)}</p>
                </div>
                <div className="rounded-lg border border-white/15 bg-white/[0.05] p-1.5 text-center">
                  <p className="text-[7px] font-bold uppercase tracking-wider text-sky-100/55">Posisi</p>
                  <p className="font-display text-[16px] font-extrabold leading-none text-[#7ed6ff]">{ordinal(stats.rank)}</p>
                </div>
              </div>
              <div className="mb-2.5 rounded-lg border border-white/15 bg-[#061a2e] p-2 text-[10px] leading-relaxed text-sky-100/70">
                Waktu berhenti selama jeda. Gunakan tombol di bawah untuk melanjutkan atau mengatur suara.
                <div className="mt-1 flex items-center gap-1.5">
                  <Heart className="h-3 w-3 fill-[#ff5566] text-[#ff9ca7]" />
                  <span>Nyawa tersisa: {stats.lives} dari 3</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <RaceButton onClick={togglePause} icon={<Play className="h-4.5 w-4.5 fill-current" />} className="w-full py-2 text-[18px]">
                  LANJUTKAN
                </RaceButton>
                <RaceButton variant="blue" onClick={openSettings} icon={<Volume2 className="h-4.5 w-4.5" />} className="w-full py-2 text-[16px]">
                  PENGATURAN SUARA
                </RaceButton>
                <div className="grid grid-cols-2 gap-1.5">
                  <RaceButton variant="ghost" onClick={onRestart} icon={<RotateCcw className="h-4 w-4" />} className="w-full py-2 text-[13px]">
                    ULANGI
                  </RaceButton>
                  <RaceButton variant="danger" onClick={onQuit} icon={<Home className="h-4 w-4" />} className="w-full py-2 text-[13px]">
                    MENU
                  </RaceButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SettingsModal open={settingsOpen} settings={settings} onChange={onSettingsChange} onClose={() => setSettingsOpen(false)} />

      {/* live region for accessibility */}
      <p className="sr-only" aria-live="polite">
        Soal {qIndex + 1} dari 20. Waktu tersisa {Math.ceil(timeLeft)} detik. Nyawa {stats.lives}. Skor {stats.score}. Posisi {ordinal(stats.rank)}.
      </p>
      <p className="sr-only" aria-live="assertive">
        {outcome
          ? outcome.type === 'correct'
            ? 'Jawaban benar. Kamu berhasil memimpin. Seratus poin.'
            : outcome.type === 'wrong'
              ? 'Jawaban salah. Lawan berhasil menyusul. Satu nyawa berkurang.'
              : 'Waktu habis. Satu nyawa berkurang.'
          : ''}
      </p>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 hidden -translate-y-1/2 justify-between px-1 lg:flex">
        <span className="h-24 w-1 rounded bg-white/15" />
        <span className="h-24 w-1 rounded bg-white/15" />
      </div>
      <span className="sr-only">{playing ? 'Balapan berlangsung' : ''}</span>
    </main>
  );
}
