import type { ReactNode } from 'react';
import { Check, Heart, Music, Settings, Trophy, Volume2, VolumeX, X, Zap } from 'lucide-react';
import type { AudioSettings } from '../types';
import { MAX_LIVES } from '../types';

export function CheckerBand({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3 w-full bg-[repeating-conic-gradient(#0b1a2b_0%_25%,#f8fafc_0%_50%)] bg-[length:20px_20px] ${className}`}
    />
  );
}

type ButtonVariant = 'gold' | 'blue' | 'ghost' | 'danger';

const variantClass: Record<ButtonVariant, string> = {
  gold: 'btn-race',
  blue: 'btn-race btn-blue',
  ghost: 'btn-race btn-ghost',
  danger: 'btn-race bg-gradient-to-b from-[#ff6a76] to-[#a20d1c] text-white border-[#2b060a] shadow-[0_4px_0_#4a050b,0_8px_18px_rgba(0,0,0,.4),inset_0_2px_0_rgba(255,255,255,.3)]',
};

export function RaceButton({
  children,
  onClick,
  variant = 'gold',
  icon,
  className = '',
  ariaLabel,
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`${variantClass[variant]} group min-h-[46px] px-4 py-2.5 text-[17px] tracking-wide disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[52px] sm:px-5 sm:text-[21px] ${className}`}
    >
      {icon ? <span className="shrink-0 drop-shadow-sm">{icon}</span> : null}
      <span className="drop-shadow-[0_1px_0_rgba(255,255,255,.25)]">{children}</span>
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  label,
  className = '',
  active = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 place-items-center rounded-lg border transition active:scale-95 sm:h-10 sm:w-10 ${
        active
          ? 'border-[#8ee7b4] bg-[#14532d] text-[#c9ffdd]'
          : 'border-white/25 bg-[#071a2d]/90 text-sky-100 hover:border-sky-300/60 hover:bg-[#0c2b47]'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Hearts({ lives, size = 'md' }: { lives: number; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-5 w-5 sm:h-6 sm:w-6';
  return (
    <div className="flex items-center gap-0.5 sm:gap-1" aria-label={`Nyawa tersisa ${lives} dari ${MAX_LIVES}`}>
      {Array.from({ length: MAX_LIVES }).map((_, i) => (
        <Heart
          key={i}
          aria-hidden="true"
          className={`${dim} transition-all duration-300 ${i < lives ? 'scale-100 fill-[#ff4d62] text-[#ffd0d6] drop-shadow-[0_0_5px_rgba(255,77,98,.7)]' : 'scale-90 fill-transparent text-white/25'}`}
          strokeWidth={2.4}
        />
      ))}
    </div>
  );
}

export function StatRow({
  label,
  value,
  highlight = false,
  icon,
}: {
  label: string;
  value: ReactNode;
  highlight?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-dashed border-sky-300/20 px-3 py-1.5 last:border-0 sm:py-2 ${
        highlight ? 'bg-amber-300/10' : ''
      }`}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-100/85 sm:text-[13px]">
        {icon}
        {label}
      </span>
      <span className={`font-display text-[15px] font-bold tabular-nums sm:text-[18px] ${highlight ? 'text-[#ffe072]' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

export function Ribbon({
  children,
  tone = 'red',
  className = '',
}: {
  children: ReactNode;
  tone?: 'red' | 'gold';
  className?: string;
}) {
  return (
    <div className={`${tone === 'red' ? 'ribbon-red' : 'ribbon-gold'} relative inline-flex items-center justify-center gap-2 rounded-[5px] px-5 py-1.5 sm:px-8 sm:py-2 ${className}`}>
      <span className={`font-display text-[22px] font-extrabold italic leading-none tracking-wide sm:text-[30px] ${tone === 'red' ? 'text-white' : 'text-[#2a1a00]'}`}>
        {children}
      </span>
    </div>
  );
}

interface ConfettiProps {
  count?: number;
  className?: string;
}

export function Confetti({ count = 60, className = '' }: ConfettiProps) {
  const colors = ['#ffd24a', '#ef4444', '#3b82f6', '#22c55e', '#ffffff', '#f97316', '#a855f7'];
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 37.7 + 11) % 100;
        const drift = ((i * 53) % 120) - 60;
        const delay = ((i * 17) % 50) / 10;
        const duration = 3.6 + ((i * 13) % 30) / 10;
        const size = 5 + (i % 5) * 2;
        return (
          <span
            key={i}
            className="absolute top-0 block"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * (i % 3 === 0 ? 1 : 1.8)}px`,
              backgroundColor: colors[i % colors.length],
              borderRadius: i % 4 === 0 ? '50%' : '1px',
              animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
              // @ts-expect-error CSS custom property
              '--drift': `${drift}px`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}

export function SoundButton({ settings, onClick }: { settings: AudioSettings; onClick: () => void }) {
  const muted = !settings.music && !settings.sfx;
  return (
    <IconButton
      label={muted ? 'Buka pengaturan suara (suara mati)' : 'Pilih pengaturan suara'}
      onClick={onClick}
      active={!muted}
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Settings className="h-5 w-5" />}
    </IconButton>
  );
}

export function SettingsModal({
  open,
  settings,
  onChange,
  onClose,
}: {
  open: boolean;
  settings: AudioSettings;
  onChange: (next: AudioSettings) => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-[#020a14]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Pengaturan Suara">
      <div className="animate-pop-in w-full max-w-md overflow-hidden rounded-2xl border-2 border-sky-300/50 bg-gradient-to-b from-[#0c2742] to-[#061525] shadow-[0_25px_60px_rgba(0,0,0,.7)]">
        <div className="ribbon-red flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-[#ffe08a]" />
            <h2 className="font-display text-2xl font-extrabold italic tracking-wide text-white">PENGATURAN SUARA</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup pengaturan" className="grid h-8 w-8 place-items-center rounded-md bg-black/25 text-white hover:bg-black/40">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <p className="text-xs leading-relaxed text-sky-100/80">
            Suara mesin, turbo, dan musik dibuat langsung di perangkatmu. Nyalakan atau matikan sesuai kenyamanan.
          </p>
          <ToggleRow
            icon={<Music className="h-5 w-5" />}
            title="Musik Balapan"
            desc="Irama penyemangat selama permainan"
            value={settings.music}
            onChange={(v) => onChange({ ...settings, music: v })}
          />
          <ToggleRow
            icon={<Volume2 className="h-5 w-5" />}
            title="Efek Suara"
            desc="Mesin F1, turbo, rem, dan timer"
            value={settings.sfx}
            onChange={(v) => onChange({ ...settings, sfx: v })}
          />
          <div className="rounded-lg border border-sky-300/25 bg-[#071c30] p-2.5 text-[11px] leading-relaxed text-sky-100/75">
            <Zap className="mr-1 inline h-3.5 w-3.5 text-[#ffd24a]" />
            Suara mulai berbunyi setelah kamu menekan tombol pertama. Gunakan tombol speaker di layar balapan untuk membisukan semuanya.
          </div>
          <RaceButton onClick={onClose} className="w-full" icon={<Check className="h-5 w-5" />}>
            SELESAI
          </RaceButton>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  desc,
  value,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-300/25 bg-[#081e33]/90 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${value ? 'bg-[#14532d] text-[#8ef7c0]' : 'bg-[#1d3145] text-sky-200/50'}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="truncate text-[11px] text-sky-100/65">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={`${title} ${value ? 'aktif' : 'mati'}`}
        onClick={() => onChange(!value)}
        className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition-colors ${value ? 'border-[#5ee89a] bg-[#16a34a]' : 'border-white/25 bg-[#334155]'}`}
      >
        <span className={`absolute top-0.5 grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] shadow transition-all ${value ? 'left-[26px] text-[#15803d]' : 'left-0.5 text-slate-500'}`}>
          {value ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
        </span>
      </button>
    </div>
  );
}

export function CreatorCredit({ className = '' }: { className?: string }) {
  return (
    <p className={`font-body text-[9px] font-semibold tracking-wide text-sky-100/55 sm:text-[10.5px] ${className}`}>
      Created by <span className="font-extrabold text-[#dceeff]">Wiyanto Abu Hanif</span>
    </p>
  );
}

export function TrophyBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-full bg-gradient-to-b from-[#ffe27a] to-[#e09b09] shadow-[0_2px_8px_rgba(0,0,0,.4),inset_0_1px_0_rgba(255,255,255,.6)] ${className}`}>
      <Trophy className="h-[60%] w-[60%] text-[#7a4a04]" />
    </span>
  );
}
