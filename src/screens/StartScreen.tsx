import { useState } from 'react';
import { BookOpen, Flag, Gauge, Heart, Play, Route, Settings2, Sparkles, Timer, Trophy, Volume2 } from 'lucide-react';
import GameLogo, { CheckerFlag } from '../components/GameLogo';
import { CheckerBand, CreatorCredit, RaceButton, SettingsModal, SoundButton } from '../components/ui';
import type { AudioSettings } from '../types';

interface StartScreenProps {
  settings: AudioSettings;
  onSettingsChange: (s: AudioSettings) => void;
  onStart: () => void;
  onGuide: () => void;
  bestScore: number;
}

const FEATURES = [
  { icon: BookOpen, title: '20 SOAL', sub: 'IPAS Kelas 6', color: 'text-[#7ed6ff]', ring: 'border-[#3f9fd8]' },
  { icon: Route, title: '4 GERBANG', sub: 'Pilih jawabanmu', color: 'text-[#ffd24a]', ring: 'border-[#c9a12f]' },
  { icon: Heart, title: '3 NYAWA', sub: 'Berpikir cepat', color: 'text-[#ff7385]', ring: 'border-[#c04153]' },
];

export default function StartScreen({ settings, onSettingsChange, onStart, onGuide, bestScore }: StartScreenProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[#04101f]">
      {/* Hero circuit background */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-f1.jpg"
          alt=""
          aria-hidden="true"
          className="hero-pan h-full w-full object-cover object-[74%_48%] lg:object-[center_45%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#03101f]/92 via-[#03101f]/55 to-[#03101f]/96 lg:bg-gradient-to-r lg:from-[#03101f] lg:via-[#041424]/86 lg:to-[#051526]/8" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_78%_30%,transparent_0%,rgba(3,15,28,0.35)_72%,rgba(2,10,19,0.85)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#03101f] to-transparent" />
        {/* moving speed lines */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
          {[18, 36, 55, 71, 83].map((top, i) => (
            <span
              key={top}
              className="absolute h-px w-40 bg-gradient-to-r from-transparent via-sky-200/80 to-transparent"
              style={{ top: `${top}%`, left: `${8 + i * 9}%`, animation: `speed-line ${5 + i * 0.7}s linear ${i * 1.3}s infinite` }}
            />
          ))}
        </div>
      </div>

      <CheckerBand className="relative z-20 h-2.5 opacity-95" />

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5 sm:py-3.5 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-sky-200/40 bg-gradient-to-br from-[#133a5e] to-[#061727] shadow-inner">
            <CheckerFlag className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[11px] font-bold uppercase tracking-[0.24em] text-[#b6dcff] sm:text-[13px]">
              Race Academy
            </p>
            <p className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-white/50 sm:text-[10px]">
              IPAS Kelas VI · Bab 3 Jejak Sang Pahlawan
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-[#ffd24a]/40 bg-[#38290a]/70 px-2.5 py-1 text-[10px] font-bold text-[#ffe08a] sm:flex">
            <Trophy className="h-3.5 w-3.5" />
            REKOR {bestScore.toLocaleString('id-ID')}
          </div>
          <SoundButton settings={settings} onClick={() => setSettingsOpen(true)} />
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-20 mx-auto flex w-full max-w-[1480px] flex-1 flex-col justify-center px-3 pb-3 pt-2 sm:px-5 lg:px-8">
        <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,600px)_1fr]">
          <section className="animate-slide-up">
            <div className="mb-2 hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#ffd24a]/50 bg-[#0a1e33]/90 px-2.5 py-1 font-display text-[11px] font-bold tracking-[0.18em] text-[#ffe08a]">
                <Sparkles className="h-3.5 w-3.5" /> EDUKASI BALAP IPAS
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-2.5 py-1 font-display text-[11px] font-bold tracking-[0.18em] text-sky-100/80">
                <Flag className="h-3.5 w-3.5" /> 20 LINTASAN · 1 JUARA
              </span>
            </div>

            <GameLogo size="lg" />

            <div className="mt-4 grid max-w-[330px] gap-2 sm:mt-5 sm:max-w-[380px]">
              <RaceButton onClick={onStart} icon={<Play className="h-5 w-5 fill-current sm:h-6 sm:w-6" />} className="w-full py-3 text-[20px] sm:text-[25px]">
                MULAI BALAPAN
              </RaceButton>
              <RaceButton variant="blue" onClick={onGuide} icon={<BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5" />} className="w-full text-[17px] sm:text-[21px]">
                PETUNJUK PERMAINAN
              </RaceButton>
              <RaceButton variant="blue" onClick={() => setSettingsOpen(true)} icon={<Settings2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />} className="w-full text-[17px] sm:text-[21px]">
                PENGATURAN SUARA
              </RaceButton>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-semibold text-sky-100/70 sm:text-[11px]">
              <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5 text-[#7ed6ff]" /> 20 detik / soal</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5 text-[#7ed6ff]" /> Auto drive · keyboard &amp; sentuh</span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1"><Volume2 className="h-3.5 w-3.5 text-[#7ed6ff]" /> Suara imersif</span>
            </div>
          </section>

          <aside className="hidden h-full flex-col items-end justify-between gap-4 self-stretch py-2 lg:flex">
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#041828]/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100/85 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5ee89a] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5ee89a]" />
                </span>
                Sirkuit siap · balapan edukasi
              </span>
              <p className="max-w-[300px] text-[11px] leading-relaxed text-sky-100/60">
                Bukan sekadar balapan, tetapi balapan pengetahuan. Taklukkan 20 gerbang jawaban dan jadilah juara sirkuit.
              </p>
            </div>

            <div className="w-full max-w-[330px] rounded-2xl border border-sky-200/30 bg-[#041526]/72 p-3 shadow-[0_18px_44px_rgba(0,0,0,.45)] backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-display text-[12px] font-bold tracking-[0.18em] text-[#9fd0f5]">RINGKASAN MISI</span>
                <Flag className="h-4 w-4 text-[#ffd24a]" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {FEATURES.map((f) => (
                  <div key={f.title} className={`rounded-lg border ${f.ring}/40 bg-white/[0.045] p-2 text-center`}>
                    <f.icon className={`mx-auto mb-1 h-4 w-4 ${f.color}`} />
                    <p className="font-display text-[13px] font-bold leading-none text-white">{f.title}</p>
                    <p className="mt-1 truncate text-[8.5px] font-medium text-sky-100/60">{f.sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg border border-[#ffd24a]/30 bg-[#3a2b08]/50 px-2.5 py-1.5">
                <span className="text-[10px] font-semibold text-[#ffe08a]">Mulai dari P2, kejar P1!</span>
                <span className="rounded bg-[#ffd24a] px-1.5 py-0.5 font-display text-[10px] font-extrabold text-[#3b2803]">GO!</span>
              </div>
            </div>
          </aside>
        </div>

        {/* mobile mission chips */}
        <div className="mt-4 grid grid-cols-3 gap-2 lg:hidden">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-white/15 bg-[#041526]/78 p-2 text-center backdrop-blur">
              <f.icon className={`mx-auto h-4 w-4 ${f.color}`} />
              <p className="mt-1 font-display text-[12px] font-bold leading-none text-white">{f.title}</p>
              <p className="mt-1 truncate text-[8px] font-medium text-sky-100/55">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="relative z-20 mt-auto">
        <CheckerBand className="h-2.5 opacity-90" />
        <div className="flex flex-col items-center justify-between gap-1 bg-[#03101e]/95 px-3 py-2 sm:flex-row sm:gap-3 sm:px-6">
          <p className="text-center font-display text-[10px] font-semibold italic tracking-wider text-sky-100/80 sm:text-left sm:text-[13px]">
            &ldquo;BUKAN SEKADAR BALAPAN, <span className="text-[#ffd24a]">TETAPI BALAPAN PENGETAHUAN!</span>&rdquo;
          </p>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <p className="hidden items-center gap-1 text-[10px] font-semibold text-sky-100/45 md:flex">
              <Trophy className="h-3.5 w-3.5" /> IPAS Kelas VI
            </p>
            <span className="hidden h-3 w-px bg-white/20 md:block" />
            <CreatorCredit />
          </div>
        </div>
      </footer>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onChange={onSettingsChange}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
  );
}
