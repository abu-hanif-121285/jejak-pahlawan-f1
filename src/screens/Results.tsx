import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Crown, Flag, Heart, Home, RotateCcw, Sparkles, Star, Trophy, X } from 'lucide-react';
import { CheckerBand, Confetti, CreatorCredit, RaceButton, Ribbon } from '../components/ui';
import type { RaceStats } from '../types';
import { MAX_LIVES, predicateForScore } from '../types';
import { QUESTIONS } from '../data/questions';

function useCountUp(target: number, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatLine({ label, value, tone = 'normal', icon }: { label: string; value: string | number; tone?: 'normal' | 'good' | 'bad' | 'gold'; icon?: React.ReactNode }) {
  const color = tone === 'good' ? 'text-[#8ef7c0]' : tone === 'bad' ? 'text-[#ff9aa4]' : tone === 'gold' ? 'text-[#ffe072]' : 'text-white';
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-sky-200/20 px-2.5 py-[7px] last:border-0 sm:py-2">
      <span className="flex min-w-0 items-center gap-1.5 text-[10.5px] font-semibold text-sky-100/80 sm:text-[12.5px]">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className={`font-display text-[15px] font-extrabold tabular-nums sm:text-[18px] ${color}`}>{value}</span>
    </div>
  );
}

function ScoreRing({ percent }: { percent: number }) {
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  return (
    <div className="relative h-[96px] w-[96px] shrink-0 sm:h-[112px] sm:w-[112px]">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="rgba(4,16,29,0.8)" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(circ * percent) / 100} ${circ}`}
          style={{ filter: 'drop-shadow(0 0 6px rgba(255,210,74,.55))' }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe57a" />
            <stop offset="60%" stopColor="#ffbe2c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[24px] font-extrabold leading-none text-white sm:text-[28px]">{percent}%</span>
        <span className="text-[7px] font-bold uppercase tracking-wider text-sky-100/60 sm:text-[8px]">Keberhasilan</span>
      </div>
    </div>
  );
}

function Podium({ playerName = 'KAMU' }: { playerName?: string }) {
  const blocks = [
    { pos: 2, height: 'h-[54px] sm:h-[68px]', color: 'from-[#dbe8f3] to-[#93aec6]', text: 'text-[#1c3145]', name: 'RIVAL 1' },
    { pos: 1, height: 'h-[78px] sm:h-[96px]', color: 'from-[#ffe680] to-[#e0a108]', text: 'text-[#4a3000]', name: playerName },
    { pos: 3, height: 'h-[42px] sm:h-[54px]', color: 'from-[#f3b98b] to-[#b06c35]', text: 'text-[#3b1c06]', name: 'RIVAL 2' },
  ];
  return (
    <div className="flex items-end justify-center gap-1.5 sm:gap-2.5" aria-label="Podium juara, kamu di posisi pertama">
      {blocks.map((b) => (
        <div key={b.pos} className="flex w-[76px] flex-col items-center sm:w-[92px]">
          {b.pos === 1 && (
            <div className="relative -mb-1">
              <Trophy className="h-10 w-10 fill-[#ffe27a] text-[#a76a04] drop-shadow-[0_4px_6px_rgba(0,0,0,.45)] sm:h-14 sm:w-14" />
              <div className="absolute inset-0 animate-pulse rounded-full bg-[#ffd24a]/35 blur-lg" />
            </div>
          )}
          <p className={`mb-0.5 flex items-center gap-0.5 font-display text-[10px] font-extrabold tracking-wide sm:text-[12px] ${b.pos === 1 ? 'text-[#ffe27a]' : 'text-white/80'}`}>
            {b.pos === 1 && <Crown className="h-3 w-3 fill-[#ffd24a] text-[#ffd24a]" />}
            {b.name}
          </p>
          <div className={`relative w-full overflow-hidden rounded-t-md border border-white/25 bg-gradient-to-b ${b.color} ${b.height} shadow-[0_-4px_18px_rgba(0,0,0,.35)]`}>
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_10px,rgba(255,255,255,.18)_10px_20px)]" />
            <span className={`absolute inset-0 grid place-items-center font-display text-[26px] font-black leading-none ${b.text} sm:text-[32px]`}>P{b.pos}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FinishScreen({ stats, onRestart, onMenu }: { stats: RaceStats; onRestart: () => void; onMenu: () => void }) {
  const predicate = predicateForScore(stats.score);
  const score = useCountUp(stats.score);
  const answered = stats.correct + stats.wrong + stats.missed;
  const percent = Math.round((stats.correct / QUESTIONS.length) * 100);

  return (
    <main className="relative min-h-[100svh] overflow-y-auto bg-circuit thin-scroll">
      <div className="pointer-events-none absolute inset-0">
        <img src="./images/finish.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover opacity-45 object-[60%_45%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#03101f]/85 via-[#041424]/80 to-[#03101f]/97" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,196,49,0.22),transparent_60%)]" />
      </div>
      <Confetti count={55} />
      <CheckerBand className="relative z-10 h-2.5" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-3 pb-5 pt-2 sm:px-5 sm:pt-3">
        <header className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#ffd24a]/40 bg-[#3a2b08]/70">
              <Flag className="h-4 w-4 text-[#ffd24a]" />
            </span>
            <div>
              <p className="font-display text-[12px] font-bold uppercase tracking-[0.22em] text-[#ffe08a]">Race Complete</p>
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-sky-100/55">Sirkuit Jejak Sang Pahlawan</p>
            </div>
          </div>
          <div className="rounded-full border border-[#ffd24a]/40 bg-[#2c2107]/80 px-2.5 py-1 text-[10px] font-bold text-[#ffe08a]">
            20 / 20 SOAL
          </div>
        </header>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.07fr_0.93fr]">
          <section className="animate-slide-up relative overflow-hidden rounded-2xl border-2 border-[#ffd24a]/45 bg-gradient-to-b from-[#08233b]/95 to-[#03111f]/96 shadow-[0_20px_50px_rgba(0,0,0,.55)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#ffd24a] to-transparent" />
            <div className="p-3 text-center sm:p-4">
              <Ribbon className="px-7 sm:px-10">FINISH</Ribbon>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-[#ffd24a] text-[#ffd24a]" />
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.24em] text-sky-100/75">Garis finis dilewati · posisi akhir P{stats.rank}</p>
                <Star className="h-3.5 w-3.5 fill-[#ffd24a] text-[#ffd24a]" />
              </div>
              <div className="relative mt-1 overflow-hidden">
                <h1 className="race-title-gold relative z-10 text-[42px] leading-[0.86] sm:text-[58px]">{predicate.title}</h1>
                <div className="shimmer-text pointer-events-none absolute inset-0 z-20" />
              </div>
              <p className="mx-auto mt-1 max-w-sm text-[10.5px] font-medium leading-snug text-sky-100/80 sm:text-[12px]">{predicate.note}</p>

              <div className="mt-2 sm:mt-3">
                <Podium />
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-[#ffd24a]/45 bg-[#3a2b08]/75 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.2)]">
                  <Trophy className="h-5 w-5 text-[#ffd24a]" />
                  <div className="text-left">
                    <p className="text-[7.5px] font-bold uppercase tracking-[0.18em] text-[#ffe08a]/80">Total Skor</p>
                    <p className="font-display text-[24px] font-extrabold leading-none tabular-nums text-white sm:text-[28px]">
                      {score.toLocaleString('id-ID')}
                      <span className="ml-1 text-[10px] font-semibold text-sky-100/55">/ 2000</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center rounded-xl border border-white/20 bg-white/[0.06] px-2.5 py-1.5">
                  <p className="text-[7.5px] font-bold uppercase tracking-[0.16em] text-sky-100/60">Sisa Nyawa</p>
                  <div className="mt-0.5 flex gap-0.5">
                    {Array.from({ length: MAX_LIVES }).map((_, i) => (
                      <Heart key={i} className={`h-4 w-4 ${i < stats.lives ? 'fill-[#ff4d62] text-[#ffd0d6]' : 'fill-transparent text-white/25'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#041322]/85 p-2.5">
              <div className="flex items-center justify-between rounded-lg border border-[#8ef7c0]/25 bg-[#0b2a25]/60 px-2.5 py-1.5">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#b9ffd9]">
                  <Sparkles className="h-3.5 w-3.5" /> Kamu menuntaskan seluruh 20 soal IPAS.
                </span>
                <span className="font-display text-[11px] font-extrabold text-[#8ef7c0]">{percent}% BENAR</span>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-2.5">
            <div className="overflow-hidden rounded-xl border-2 border-sky-300/45 bg-[#061a2e]/96 shadow-[0_16px_40px_rgba(0,0,0,.5)]">
              <div className="ribbon-gold flex items-center justify-center gap-1.5 py-1">
                <Trophy className="h-4 w-4 text-[#3a2500]" />
                <h2 className="font-display text-[18px] font-extrabold italic tracking-wide text-[#2a1a00]">HASIL AKHIR</h2>
              </div>
              <div className="p-1">
                <StatLine label="Posisi Akhir" value={`P${stats.rank} · ${stats.rank === 1 ? 'JUARA' : 'PEMBALAP'}`} tone="gold" icon={<Crown className="h-3.5 w-3.5 text-[#ffd24a]" />} />
                <StatLine label="Soal Dijawab" value={`${answered}/20`} />
                <StatLine label="Jawaban Benar" value={stats.correct} tone="good" icon={<Check className="h-3.5 w-3.5 text-[#8ef7c0]" />} />
                <StatLine label="Jawaban Salah" value={stats.wrong} tone="bad" icon={<X className="h-3.5 w-3.5 text-[#ff9aa4]" />} />
                <StatLine label="Tidak Terjawab" value={stats.missed} tone="bad" />
                <StatLine label="Total Skor" value={stats.score.toLocaleString('id-ID')} tone="gold" icon={<Trophy className="h-3.5 w-3.5 text-[#ffd24a]" />} />
                <StatLine label="Persentase" value={`${percent}%`} tone="good" />
              </div>
            </div>

            <div className="rounded-xl border border-white/20 bg-[#061a2e]/92 p-2.5">
              <div className="flex items-center gap-3">
                <ScoreRing percent={percent} />
                <div className="min-w-0">
                  <p className="font-display text-[14px] font-extrabold uppercase tracking-wide text-[#ffd24a]">Kartu Pembalap</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-sky-100/70">
                    Setiap jawaban benar memberimu <span className="font-bold text-white">+100 poin</span> dan menyalip satu rival.
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="rounded border border-[#8ef7c0]/30 bg-[#0b2a25]/60 px-1.5 py-0.5 text-[8px] font-bold text-[#8ef7c0]">+100 / BENAR</span>
                    <span className="rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-bold text-sky-100/70">3 NYAWA</span>
                    <span className="rounded border border-white/15 bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-bold text-sky-100/70">20 SOAL</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto grid gap-1.5 sm:grid-cols-2">
              <RaceButton onClick={onRestart} icon={<RotateCcw className="h-4.5 w-4.5" />} className="w-full py-2 text-[17px]">
                MAIN LAGI
              </RaceButton>
              <RaceButton variant="blue" onClick={onMenu} icon={<Home className="h-4.5 w-4.5" />} className="w-full py-2 text-[17px]">
                KEMBALI KE MENU
              </RaceButton>
            </div>
            <button
              type="button"
              onClick={onMenu}
              className="mx-auto flex items-center gap-1 text-[9.5px] font-semibold text-sky-100/45 transition hover:text-sky-100"
            >
              <ArrowLeft className="h-3 w-3" /> selesai &amp; kembali ke beranda
            </button>
          </aside>
        </div>

        <footer className="mt-3 flex flex-col items-center justify-center gap-1.5">
          <div className="flex items-center justify-center gap-2">
            <CheckerBand className="h-1 w-14 sm:w-24" />
            <p className="text-center font-display text-[9.5px] font-semibold uppercase tracking-[0.18em] text-sky-100/45 sm:text-[11px]">
              Bukan sekadar balapan, tetapi balapan pengetahuan
            </p>
            <CheckerBand className="h-1 w-14 sm:w-24" />
          </div>
          <CreatorCredit />
        </footer>
      </div>
    </main>
  );
}

export function GameOverScreen({ stats, onRestart, onMenu }: { stats: RaceStats; onRestart: () => void; onMenu: () => void }) {
  const answered = stats.correct + stats.wrong + stats.missed;
  const percent = Math.round((stats.correct / Math.max(1, answered)) * 100);
  const score = useCountUp(stats.score, 800);

  return (
    <main className="relative min-h-[100svh] overflow-y-auto bg-circuit thin-scroll">
      <div className="pointer-events-none absolute inset-0">
        <img src="./images/hero-f1.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover opacity-30 grayscale-[35%] object-[70%_58%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#03101f]/95 via-[#0a0d18]/92 to-[#03101f]/98" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(225,29,46,0.28),transparent_62%)]" />
      </div>
      <CheckerBand className="relative z-10 h-2.5" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-10px)] w-full max-w-[980px] flex-col justify-center px-3 py-3 sm:px-5">
        <header className="mb-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onMenu}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300/35 bg-[#071c30]/90 px-2.5 py-1.5 text-[10px] font-bold text-sky-100 transition hover:bg-[#0d2c47]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> MENU UTAMA
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff7385]/35 bg-[#2a0c12]/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#ffb4bc]">
            <Flag className="h-3 w-3" /> Balapan berakhir
          </span>
        </header>

        <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-2xl border-2 border-[#ff7385]/35 bg-gradient-to-b from-[#0a1e2f]/98 via-[#071725]/98 to-[#04101d]/99 shadow-[0_26px_70px_rgba(0,0,0,.65)]">
          {/* header */}
          <div className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(ellipse_at_50%_130%,rgba(225,29,46,.5),transparent_72%)] px-3 pb-2.5 pt-3 text-center sm:pb-3 sm:pt-4">
            <div className="burst-bg absolute inset-0 opacity-25" aria-hidden="true" />
            <div className="relative">
              <div className="ribbon-red mx-auto inline-flex items-center gap-2 rounded-md px-5 py-1 sm:px-7">
                <Flag className="h-3.5 w-3.5 text-white/85" />
                <h1 className="font-display text-[30px] font-black italic leading-none tracking-wide text-white drop-shadow-[0_3px_3px_rgba(70,0,0,.6)] sm:text-[42px]">
                  GAME OVER
                </h1>
                <Flag className="h-3.5 w-3.5 text-white/85" />
              </div>
              <p className="mt-1.5 font-display text-[16px] font-extrabold italic leading-tight text-[#ffb4bc] sm:text-[20px]">
                LAWAN BERHASIL MENYUSUL!
              </p>
              <p className="mx-auto mt-1 max-w-md text-[10px] leading-snug text-sky-100/70 sm:text-[12px]">
                Nyawa habis di soal {Math.min(20, answered)} dari 20. Pelajari kembali jawaban yang benar, lalu balapan lagi — kamu pasti bisa!
              </p>
            </div>
          </div>

          <div className="grid gap-2.5 p-2.5 sm:grid-cols-[1fr_1fr] sm:gap-3 sm:p-3">
            {/* summary panel */}
            <section>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="relative overflow-hidden rounded-lg border border-[#ff7385]/30 bg-[#3a1017]/60 p-1.5 text-center">
                  <p className="font-display text-[21px] font-extrabold leading-none text-[#ff8c96]">{stats.wrong + stats.missed}</p>
                  <p className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-sky-100/60">Belum Tepat</p>
                </div>
                <div className="rounded-lg border border-[#8ef7c0]/25 bg-[#0b2a25]/60 p-1.5 text-center">
                  <p className="font-display text-[21px] font-extrabold leading-none text-[#8ef7c0]">{stats.correct}</p>
                  <p className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-sky-100/60">Benar</p>
                </div>
                <div className="rounded-lg border border-[#ffd24a]/30 bg-[#3a2b08]/60 p-1.5 text-center">
                  <p className="font-display text-[21px] font-extrabold leading-none text-[#ffe08a]">{score.toLocaleString('id-ID')}</p>
                  <p className="mt-0.5 text-[7px] font-bold uppercase tracking-wide text-sky-100/60">Skor</p>
                </div>
              </div>
              <div className="relative mt-2 overflow-hidden rounded-lg border border-white/15">
                <img src="./images/hero-f1.jpg" alt="Mobil F1 di sirkuit" className="h-[98px] w-full object-cover object-[60%_62%] opacity-80 sm:h-[118px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#04101d] via-[#04101d]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1.5">
                  <span className="rounded border border-[#ff7385]/40 bg-[#3a1017]/85 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#ff9aa4]">Nyawa habis</span>
                  <span className="flex items-center gap-1 rounded border border-[#ffd24a]/30 bg-[#221a06]/85 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#ffe08a]">
                    <Heart className="h-2.5 w-2.5" /> 0 / 3
                  </span>
                </div>
              </div>
              <div className="mt-2 rounded-lg border border-white/15 bg-[#061a2e]/90 p-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 shrink-0 fill-[#ff5566] text-[#ffb3bd]" />
                  <p className="text-[9.5px] leading-snug text-sky-100/75 sm:text-[10.5px]">
                    <span className="font-bold text-white">Tips:</span> baca empat pilihan di layar, gunakan rem untuk memperlambat, lalu arahkan mobil ke gerbang yang kamu yakini.
                  </p>
                </div>
              </div>
            </section>

            {/* stats */}
            <section className="overflow-hidden rounded-xl border border-sky-300/35 bg-[#061a2e]/96">
              <div className="ribbon-red flex items-center justify-center gap-1.5 py-1">
                <Trophy className="h-4 w-4 text-[#ffe08a]" />
                <h2 className="font-display text-[17px] font-extrabold italic tracking-wide text-white">HASIL PERMAINAN</h2>
              </div>
              <div className="p-1">
                <StatLine label="Soal Dijawab" value={`${answered}/20`} />
                <StatLine label="Jawaban Benar" value={stats.correct} tone="good" icon={<Check className="h-3.5 w-3.5 text-[#8ef7c0]" />} />
                <StatLine label="Jawaban Salah" value={stats.wrong} tone="bad" icon={<X className="h-3.5 w-3.5 text-[#ff9aa4]" />} />
                <StatLine label="Tidak Terjawab" value={stats.missed} tone="bad" />
                <StatLine label="Posisi Akhir" value={`P${stats.rank}`} tone="gold" icon={<Flag className="h-3.5 w-3.5 text-[#ffd24a]" />} />
                <StatLine label="Total Skor" value={stats.score.toLocaleString('id-ID')} tone="gold" icon={<Trophy className="h-3.5 w-3.5 text-[#ffd24a]" />} />
                <StatLine label="Persentase Benar" value={`${percent}%`} tone="good" />
              </div>
            </section>
          </div>

          <div className="border-t border-white/10 bg-[#03101d]/85 p-2.5">
            <div className="grid grid-cols-2 gap-1.5">
              <RaceButton onClick={onRestart} icon={<RotateCcw className="h-4 w-4 sm:h-4.5 sm:w-4.5" />} className="w-full whitespace-nowrap px-2 py-2 text-[15px] sm:text-[18px]">
                MAIN LAGI
              </RaceButton>
              <RaceButton variant="blue" onClick={onMenu} icon={<Home className="h-4 w-4 sm:h-4.5 sm:w-4.5" />} className="w-full whitespace-nowrap px-2 py-2 text-[13.5px] sm:text-[17px]">
                KEMBALI KE MENU
              </RaceButton>
            </div>
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <CheckerBand className="h-1 w-10 sm:w-16" />
              <p className="text-center font-display text-[8.5px] font-semibold uppercase tracking-[0.14em] text-sky-100/45 sm:text-[10px]">
                Bangkit, pelajari, dan menangkan balapan berikutnya!
              </p>
              <CheckerBand className="h-1 w-10 sm:w-16" />
            </div>
            <CreatorCredit className="mt-1.5 text-center" />
          </div>
        </div>
      </div>
    </main>
  );
}
