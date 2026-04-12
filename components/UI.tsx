
import React from 'react';
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

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input 
      className={`min-h-11 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 sm:px-4 ${className}`}
      {...props}
    />
  </div>
);
