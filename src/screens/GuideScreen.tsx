import { ArrowLeft, BookOpenCheck, ChevronLeft, Gauge, Heart, Play, ShieldCheck, Timer, Volume2, VolumeX } from 'lucide-react';
import GameLogo from '../components/GameLogo';
import { CheckerBand, CreatorCredit, Hearts, RaceButton, Ribbon } from '../components/ui';
import type { AudioSettings } from '../types';

const CONTROLS = [
  { key: '↑', name: 'GAS', desc: 'Sprint lebih cepat; mobil tetap melaju otomatis', tone: 'from-[#3ddc84] to-[#0c7a3e]', border: 'border-[#8af0b7]' },
  { key: '↓', name: 'REM', desc: 'Memperlambat tanpa berhenti total', tone: 'from-[#ff7b6d] to-[#9d1310]', border: 'border-[#ffb1a8]' },
  { key: '←', name: 'BELOK KIRI', desc: 'Pindah ke jalur gerbang kiri', tone: 'from-[#8ed4ff] to-[#155fae]', border: 'border-[#b9e6ff]' },
  { key: '→', name: 'BELOK KANAN', desc: 'Pindah ke jalur gerbang kanan', tone: 'from-[#8ed4ff] to-[#155fae]', border: 'border-[#b9e6ff]' },
];

const RULES = [
  'Kendalikan mobil menggunakan empat tombol panah.',
  'Mobil melaju otomatis sepanjang balapan. Lepas gas untuk kembali ke kecepatan jelajah; rem hanya memperlambat.',
  'Perhatikan soal yang muncul di bagian atas layar.',
  'Pilih jawaban dengan melewati gerbang A, B, C, atau D. Bukan dengan mengeklik pilihan!',
  'Jawab sebelum 20 detik habis. Timer mulai saat soal tampil.',
  'Kamu memiliki 3 nyawa. Nyawa tidak bertambah.',
  'Jawab benar untuk menyalip lawan dan memimpin balapan.',
  'Jawab salah atau waktu habis, nyawa berkurang 1 dan lawan akan menyusul.',
];

export default function GuideScreen({
  onBack,
  onStart,
  settings,
  onToggleMute,
}: {
  onBack: () => void;
  onStart: () => void;
  settings: AudioSettings;
  onToggleMute: () => void;
}) {
  const muted = !settings.music && !settings.sfx;
  return (
    <main className="relative min-h-[100svh] overflow-y-auto bg-circuit thin-scroll">
      <div className="pointer-events-none absolute inset-0 carbon-grid opacity-50" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-[repeating-conic-gradient(#f8fafc_0%_25%,#0b1a2b_0%_50%)] bg-[length:18px_18px] opacity-70" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-[repeating-conic-gradient(#f8fafc_0%_25%,#0b1a2b_0%_50%)] bg-[length:18px_18px] opacity-70" />
      <div className="pointer-events-none absolute -left-36 top-16 h-80 w-80 rounded-full bg-[#e11d2e]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#2f7cf6]/20 blur-3xl" />

      <CheckerBand className="relative z-10 h-3" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-3 pb-6 pt-3 sm:px-6">
        <header className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-300/40 bg-[#071c30]/90 px-2.5 py-2 text-[11px] font-bold text-sky-100 transition hover:bg-[#0d2c47] active:translate-y-0.5 sm:text-[13px]"
          >
            <ChevronLeft className="h-4 w-4" /> MENU UTAMA
          </button>
          <div className="hidden scale-90 sm:block">
            <GameLogo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'}
              className="grid h-9 w-9 place-items-center rounded-lg border border-sky-300/40 bg-[#071c30]/90 text-sky-100 transition hover:bg-[#0d2c47]"
            >
              {muted ? <VolumeX className="h-4.5 w-4.5" /> : <Volume2 className="h-4.5 w-4.5" />}
            </button>
          </div>
        </header>

        <div className="mt-4 flex flex-col items-center sm:mt-5">
          <Ribbon>PETUNJUK PERMAINAN</Ribbon>
          <p className="mt-2 max-w-lg text-center text-[11px] font-medium leading-relaxed text-sky-100/75 sm:text-[13px]">
            Baca soal, pilih gerbang jawaban, dan kendarai mobilmu melewatinya sebelum waktu habis. Siap jadi juara sirkuit?
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 md:grid-cols-2">
          {/* Control panel */}
          <section className="overflow-hidden rounded-xl border-2 border-sky-300/45 bg-[#061a2e]/95 shadow-[0_16px_40px_rgba(0,0,0,.45)]">
            <div className="border-b border-sky-300/20 bg-[#0a2742] p-2.5 text-center">
              <span className="ribbon-gold inline-flex items-center gap-2 rounded px-4 py-1">
                <Gauge className="h-4 w-4 text-[#3a2503]" />
                <span className="font-display text-[18px] font-extrabold italic tracking-wide text-[#2a1a00] sm:text-[20px]">KONTROL MOBIL</span>
              </span>
            </div>
            <div className="divide-y divide-sky-200/10 p-2 sm:p-3">
              {CONTROLS.map((c) => (
                <div key={c.key} className="flex items-center gap-3 py-2">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 ${c.border} bg-gradient-to-b ${c.tone} font-display text-[22px] font-bold text-white shadow-[0_3px_0_rgba(0,0,0,.45),inset_0_2px_0_rgba(255,255,255,.35)] sm:h-11 sm:w-11`}>
                    {c.key}
                  </div>
                  <span className="rounded-md border border-white/20 bg-[#0a2036] px-1.5 py-0.5 font-display text-[10px] font-bold text-sky-100/65">=</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-bold tracking-wide text-white sm:text-[17px]">{c.name}</p>
                    <p className="text-[10px] leading-snug text-sky-100/65 sm:text-[11.5px]">{c.desc}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-2 pt-2.5 text-[10px] leading-relaxed text-sky-100/65 sm:text-[11px]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8ef0ba]" />
                <p>
                  <span className="font-bold text-white">Komputer:</span> tombol panah keyboard. <span className="font-bold text-white">HP/tablet:</span> tombol besar di layar. Tekan dan tahan untuk bergerak halus.
                </p>
              </div>
            </div>
          </section>

          {/* Rules panel */}
          <section className="overflow-hidden rounded-xl border-2 border-sky-300/45 bg-[#061a2e]/95 shadow-[0_16px_40px_rgba(0,0,0,.45)]">
            <div className="border-b border-sky-300/20 bg-[#0a2742] p-2.5 text-center">
              <span className="ribbon-gold inline-flex items-center gap-2 rounded px-4 py-1">
                <BookOpenCheck className="h-4 w-4 text-[#3a2503]" />
                <span className="font-display text-[18px] font-extrabold italic tracking-wide text-[#2a1a00] sm:text-[20px]">ATURAN PERMAINAN</span>
              </span>
            </div>
            <ol className="space-y-1.5 p-2.5 sm:p-3">
              {RULES.map((rule, i) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#ffd24a]/70 bg-gradient-to-b from-[#ffe27a] to-[#e0a108] font-display text-[11px] font-extrabold text-[#3a2503] shadow-sm">
                    {i + 1}
                  </span>
                  <p className="text-[11px] leading-snug text-sky-50/90 sm:text-[12px]">{rule}</p>
                </li>
              ))}
              <li className="mt-1 flex items-start gap-2 rounded-lg border border-[#ff7385]/35 bg-[#3a1017]/70 p-2">
                <Heart className="mt-0.5 h-4 w-4 shrink-0 fill-[#ff7385] text-[#ffb4bd]" />
                <p className="text-[10.5px] leading-snug text-sky-50/90 sm:text-[11.5px]">
                  <span className="font-bold text-white">Nyawa:</span> <Hearts lives={3} size="sm" /> <span className="ml-1">habis = GAME OVER.</span> Jawab benar = +100 poin dan posisi naik.
                </p>
              </li>
            </ol>
          </section>
        </div>

        {/* Start CTA strip with car visual */}
        <div className="relative mt-3 overflow-hidden rounded-xl border border-[#ffd24a]/35 bg-gradient-to-r from-[#081f37] via-[#0a2740] to-[#071c30] shadow-[0_12px_30px_rgba(0,0,0,.4)] sm:mt-4">
          <div className="absolute inset-y-0 right-0 hidden w-[46%] sm:block">
            <img src="/images/hero-f1.jpg" alt="Mobil F1 merah di lintasan" className="h-full w-full object-cover object-[68%_52%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#082037] via-[#082037]/55 to-transparent" />
          </div>
          <div className="relative z-10 flex flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[9.5px] font-bold text-sky-100/85 sm:text-[10px]">
                <Timer className="h-3.5 w-3.5 text-[#7ed6ff]" /> 20 SOAL
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[9.5px] font-bold text-sky-100/85 sm:text-[10px]">
                <Heart className="h-3.5 w-3.5 text-[#ff8090]" /> 3 NYAWA
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2 py-1 text-[9.5px] font-bold text-sky-100/85 sm:text-[10px]">
                <Gauge className="h-3.5 w-3.5 text-[#ffd24a]" /> 320 KM/JAM
              </span>
            </div>
            <RaceButton onClick={onStart} icon={<Play className="h-5 w-5 fill-current" />} className="w-full px-5 py-2.5 text-[19px] sm:w-auto sm:text-[22px]">
              MULAI BALAPAN
            </RaceButton>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mx-auto mt-3 flex items-center gap-1 text-[10px] font-semibold text-sky-200/55 transition hover:text-sky-100 sm:text-[11px]"
        >
          <ArrowLeft className="h-3 w-3" /> kembali ke menu utama
        </button>
        <CreatorCredit className="mt-2 text-center" />
      </div>
    </main>
  );
}
