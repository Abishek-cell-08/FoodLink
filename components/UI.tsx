
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DonationStatus } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = 'ui-button inline-flex touch-manipulation items-center justify-center gap-2 rounded-full border font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]';
  
  const variants = {
    primary: 'border-emerald-500 bg-emerald-500 text-white shadow-[0_16px_36px_-18px_rgba(16,185,129,0.9)] hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-[0_22px_48px_-20px_rgba(16,185,129,0.82)] focus:ring-emerald-500/40',
    secondary: 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.65)] hover:-translate-y-0.5 hover:bg-slate-800 focus:ring-slate-900/25',
    outline: 'border-slate-200 bg-white/82 text-slate-700 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.4)] hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white focus:ring-slate-400/30',
    danger: 'border-red-500 bg-red-500 text-white shadow-[0_16px_36px_-20px_rgba(239,68,68,0.85)] hover:-translate-y-0.5 hover:bg-red-400 focus:ring-red-500/35'
  };

  const sizes = {
    sm: 'min-h-10 px-4 py-2 text-xs sm:text-sm',
    md: 'min-h-11 px-5 py-2.5 text-sm sm:text-[15px]',
    lg: 'min-h-12 px-6 py-3 text-sm sm:px-7 sm:text-base'
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button 
      data-size={size}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const StatusBadge: React.FC<{ status: DonationStatus }> = ({ status }) => {
  const styles = {
    [DonationStatus.PENDING]: 'border-amber-200 bg-amber-50 text-amber-700',
    [DonationStatus.ALLOCATED]: 'border-sky-200 bg-sky-50 text-sky-700',
    [DonationStatus.PICKED_UP]: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    [DonationStatus.REJECTED]: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`ui-card glass-surface overflow-hidden rounded-[24px] border border-white/70 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.22)] sm:rounded-[28px] ${className}`}>
    {children}
  </div>
);

interface InfoPopoverProps {
  title: string;
  description: string;
  className?: string;
  tone?: 'light' | 'dark';
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  title,
  description,
  className = 'absolute right-4 top-4',
  tone = 'light',
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const popoverId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current) {
        return;
      }

      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = Math.min(320, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 12));
      const top = Math.min(rect.bottom + 10, window.innerHeight - 140);

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const toneClasses = tone === 'dark'
    ? {
        button: 'border-white/20 bg-white/10 text-white hover:bg-white/20 focus:ring-white/40',
        panel: 'border-white/10 bg-slate-900 text-slate-100 shadow-2xl',
        description: 'text-slate-300',
      }
    : {
        button: 'border-slate-200 bg-white/90 text-slate-500 shadow-sm hover:bg-slate-50 focus:ring-emerald-500/30',
        panel: 'border-slate-200 bg-white/95 text-slate-900 shadow-xl backdrop-blur-xl',
        description: 'text-slate-500',
      };

  return (
    <div ref={containerRef} className={className}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`About ${title}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${toneClasses.button}`}
      >
        i
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          id={popoverId}
          role="dialog"
          aria-label={title}
          className={`fixed z-[999] w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border p-4 ${toneClasses.panel}`}
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <div className="pr-8 text-sm font-bold leading-5">{title}</div>
          <p className={`mt-2 text-xs leading-6 ${toneClasses.description}`}>
            {description}
          </p>
          <button
            type="button"
            aria-label="Close info"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 text-xs font-bold opacity-60 transition-opacity hover:opacity-100"
          >
            x
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="flex w-full flex-col gap-2">
    {label && <label className="text-sm font-semibold text-slate-700">{label}</label>}
    <input 
      className={`ui-input min-h-12 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/12 sm:px-4 ${className}`}
      {...props}
    />
  </div>
);
