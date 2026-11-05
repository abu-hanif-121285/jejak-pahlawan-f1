import { Flag } from 'lucide-react';

function CheckerFlag({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M14 6v52" stroke="#e8eef5" strokeWidth="5" strokeLinecap="round" />
      <path d="M18 8h38l-8 11 8 11H18z" fill="#fff" stroke="#0a1729" strokeWidth="1.5" />
      <g fill="#0a1729">
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) =>
            (r + c) % 2 === 0 ? <rect key={`${r}-${c}`} x={20 + c * 8.5} y={10 + r * 6.6} width="8.5" height="6.6" /> : null,
          ),
        )}
      </g>
      <path d="M18 30h38l-8 11 8 11H18z" fill="#e11d2e" />
    </svg>
  );
}

export default function GameLogo({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
  const titleSize = size === 'sm' ? 'text-[34px] sm:text-[42px]' : size === 'md' ? 'text-[52px] sm:text-[64px]' : 'text-[62px] sm:text-[84px] lg:text-[104px]';
  const subSize = size === 'sm' ? 'text-[13px] sm:text-[15px]' : size === 'md' ? 'text-[18px] sm:text-[22px]' : 'text-[22px] sm:text-[30px] lg:text-[34px]';
  const taglineSize = size === 'sm' ? 'text-[12px]' : size === 'md' ? 'text-[15px]' : 'text-[17px] sm:text-[21px]';

  return (
    <div className="relative select-none">
      {/* checkered + F1 ambient decoration */}
      <div className="pointer-events-none absolute -top-4 right-2 hidden h-16 w-28 opacity-80 sm:block lg:-top-7 lg:h-24 lg:w-40">
        <div className="absolute right-0 top-0 h-full w-full -skew-x-12 rounded-sm border border-white/15 bg-[repeating-conic-gradient(#f8fafc_0%_25%,#0b1a2b_0%_50%)] bg-[length:22px_22px] opacity-25" />
        <Flag className="absolute -right-1 top-0 h-12 w-12 rotate-[-16deg] text-white drop-shadow-[0_3px_6px_rgba(0,0,0,.5)] lg:h-16 lg:w-16" strokeWidth={1.6} />
      </div>

      <div className="flex items-end gap-2 sm:gap-3">
        <div className="relative">
          <div className="race-title-red title-outline text-[52px] leading-[0.72] sm:text-[68px] lg:text-[86px]">
            F<span className="text-[0.82em]">1</span>
          </div>
          <div className="absolute -bottom-1 left-1 hidden gap-[2px] sm:flex">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-1.5 w-2.5 ${i % 2 ? 'bg-[#c3d2e2]' : 'bg-[#e11d2e]'}`} />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#9fd0f5] to-transparent" />
            <span className="font-display text-[8px] font-semibold uppercase tracking-[0.34em] text-[#bfe2ff] sm:text-[10px]">
              Formula One Racing Quiz
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#9fd0f5] to-transparent" />
          </div>
          <div className={`race-title title-outline whitespace-nowrap ${titleSize}`}>
            RACING <span className="text-[#ffd24a] [-webkit-text-fill-color:#ffd24a]">QUIZ</span>
          </div>
        </div>
      </div>

      <div className="mt-1 flex items-stretch sm:mt-2">
        <div className={`ribbon-red relative flex -skew-x-6 items-center gap-2 rounded-[3px] px-3 py-1.5 sm:px-5 sm:py-2 ${subSize}`}>
          <span className="inline-block h-[0.72em] w-[0.1em] shrink-0 skew-x-6 bg-white/80" />
          <span className="skew-x-6 font-display font-extrabold italic tracking-[0.04em] text-white drop-shadow-[0_2px_2px_rgba(70,0,0,.6)]">
            JEJAK SANG PAHLAWAN
          </span>
          <span className="inline-block h-[0.72em] w-[0.1em] shrink-0 skew-x-6 bg-white/80" />
        </div>
        <div className="hidden w-8 -skew-x-6 bg-[repeating-linear-gradient(90deg,#f8fafc_0_4px,#0b1a2b_4px_8px)] opacity-90 sm:block" />
      </div>

      <p className={`mt-3 font-display font-bold italic tracking-wide text-[#ffe57a] drop-shadow-[0_2px_3px_rgba(0,0,0,.65)] sm:mt-4 ${taglineSize}`}>
        Gas Pol! Taklukkan Tantangan, <span className="text-white">Jadilah Juara!</span>
      </p>
    </div>
  );
}

export { CheckerFlag };
