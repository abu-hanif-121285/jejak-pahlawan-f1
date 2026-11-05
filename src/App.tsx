import { useCallback, useEffect, useRef, useState } from 'react';
import StartScreen from './screens/StartScreen';
import GuideScreen from './screens/GuideScreen';
import RaceScreen from './screens/RaceScreen';
import { FinishScreen, GameOverScreen } from './screens/Results';
import { audio } from './game/audio';
import type { AudioSettings, RaceStats, Screen } from './types';
import { EMPTY_STATS } from './types';

const SETTINGS_KEY = 'f1rq:settings:v1';
const BEST_KEY = 'f1rq:best:v1';

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AudioSettings>;
      return {
        music: typeof parsed.music === 'boolean' ? parsed.music : true,
        sfx: typeof parsed.sfx === 'boolean' ? parsed.sfx : true,
      };
    }
  } catch {
    /* storage unavailable */
  }
  return { music: true, sfx: true };
}

function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.min(2000, Math.round(value)) : 0;
  } catch {
    return 0;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [settings, setSettings] = useState<AudioSettings>(() => loadSettings());
  const [bestScore, setBestScore] = useState<number>(() => loadBest());
  const [result, setResult] = useState<RaceStats>({ ...EMPTY_STATS });
  const [raceKey, setRaceKey] = useState(0);
  const settingsRef = useRef(settings);
  const prevScreenRef = useRef<Screen>('menu');

  settingsRef.current = settings;

  // Persist + push audio settings to the synth engine.
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore quota/privacy errors */
    }
    audio.setSettings(settings);
  }, [settings]);

  // Unlock WebAudio on the first real user gesture (browser autoplay policy).
  useEffect(() => {
    const unlock = () => {
      audio.unlock();
      audio.setSettings(settingsRef.current);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Result ambience, once per screen change.
  useEffect(() => {
    if (screen === 'gameover' && prevScreenRef.current !== 'gameover') {
      audio.gameOver();
      audio.stopEngine();
    }
    prevScreenRef.current = screen;
  }, [screen]);

  const handleSettingsChange = useCallback((next: AudioSettings) => {
    setSettings(next);
    audio.unlock();
  }, []);

  const startRace = useCallback(() => {
    audio.unlock();
    audio.click();
    setRaceKey((k) => k + 1);
    setScreen('race');
  }, []);

  const finishRace = useCallback((stats: RaceStats) => {
    setResult(stats);
    setBestScore((prev) => {
      const next = Math.max(prev, stats.score);
      try {
        localStorage.setItem(BEST_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setScreen('finish');
  }, []);

  const gameOver = useCallback((stats: RaceStats) => {
    setResult(stats);
    setBestScore((prev) => {
      const next = Math.max(prev, stats.score);
      try {
        localStorage.setItem(BEST_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setScreen('gameover');
  }, []);

  const goMenu = useCallback(() => {
    audio.unlock();
    audio.click();
    audio.stopEngine();
    setScreen('menu');
  }, []);

  const openGuide = useCallback(() => {
    audio.unlock();
    audio.click();
    setScreen('guide');
  }, []);

  const toggleMute = useCallback(() => {
    setSettings((prev) => {
      const muted = !prev.music && !prev.sfx;
      return muted ? { music: true, sfx: true } : { music: false, sfx: false };
    });
  }, []);

  return (
    <div className="min-h-[100svh] bg-[#03101f] text-white">
      {screen === 'menu' && (
        <StartScreen
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onStart={startRace}
          onGuide={openGuide}
          bestScore={bestScore}
        />
      )}

      {screen === 'guide' && (
        <GuideScreen
          onBack={goMenu}
          onStart={startRace}
          settings={settings}
          onToggleMute={toggleMute}
        />
      )}

      {screen === 'race' && (
        <RaceScreen
          key={raceKey}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onFinish={finishRace}
          onGameOver={gameOver}
          onQuit={goMenu}
          onRestart={startRace}
        />
      )}

      {screen === 'finish' && (
        <FinishScreen stats={result} onRestart={startRace} onMenu={goMenu} />
      )}

      {screen === 'gameover' && (
        <GameOverScreen stats={result} onRestart={startRace} onMenu={goMenu} />
      )}
    </div>
  );
}
