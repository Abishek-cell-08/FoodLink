
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
  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
    secondary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    outline: 'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  const sizes = {
    sm: 'min-h-9 px-3 py-2 text-xs sm:text-sm',
    md: 'min-h-10 px-4 py-2.5 text-sm sm:text-[15px]',
    lg: 'min-h-11 px-4 py-3 text-sm sm:px-5 sm:text-base'
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const StatusBadge: React.FC<{ status: DonationStatus }> = ({ status }) => {
  const styles = {
    [DonationStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [DonationStatus.ALLOCATED]: 'bg-blue-100 text-blue-800 border-blue-200',
    [DonationStatus.PICKED_UP]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [DonationStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl ${className}`}>
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
  className = '',
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
        button: 'border-slate-200 bg-white/90 text-slate-500 hover:bg-slate-50 focus:ring-emerald-500/30',
        panel: 'border-slate-200 bg-white text-slate-900 shadow-xl',
        description: 'text-slate-500',
      };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`About ${title}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-black transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${toneClasses.button}`}
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
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input 
      className={`min-h-11 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 sm:px-4 ${className}`}
      {...props}
    />
  </div>
);
