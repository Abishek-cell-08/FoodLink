import React from 'react';
import { User, UserRole } from '../types';
import { Button } from './UI';
import appLogo from './logo (2).png';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate }) => {
  const navLinks = user
    ? [
        { key: 'dashboard', label: 'Dashboard' },
        ...(user.role === UserRole.DONOR ? [{ key: 'add-donation', label: 'Donate' }] : []),
        ...(user.role === UserRole.NGO ? [{ key: 'scan-qr', label: 'Verify' }] : []),
      ]
    : [
        { key: 'landing', label: 'Home' },
        { key: 'login', label: 'Access' },
      ];

  return (
    <nav className="section-shell sticky top-0 z-50 w-full px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="glass-surface flex h-[68px] items-center justify-between rounded-[24px] px-3.5 sm:h-[76px] sm:rounded-[28px] sm:px-6 lg:px-8">
          <div
            className="flex min-w-0 cursor-pointer items-center gap-2.5 sm:gap-3"
            onClick={() => onNavigate('landing')}
          >
            <img
              src={appLogo}
              alt="WasteFoodLink"
              className="h-9 w-auto object-contain sm:h-12"
            />
            <div className="hidden md:block">
              <div className="text-sm font-black tracking-[-0.03em] text-slate-950">
                WasteFoodLink
              </div>
              <div className="text-xs font-medium text-slate-500">
                Premium food rescue network
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => onNavigate(link.key)}
                className="group relative rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950"
              >
                {link.label}
                <span className="absolute inset-x-4 bottom-1 h-px origin-left scale-x-0 bg-slate-900 transition-transform duration-300 group-hover:scale-x-100" />
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-4 rounded-full border border-white/80 bg-white/60 px-2 py-2 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.45)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#1f7a64)] text-sm font-bold text-white">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">
                      {user.name}
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      {user.role}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={onLogout} className="ml-2">
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-4">
                <Button variant="outline" size="sm" onClick={() => onNavigate('login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => onNavigate('login')}>
                  Get Started
                </Button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant={user ? 'outline' : 'primary'}
              size="sm"
              onClick={() => onNavigate(user ? 'dashboard' : 'login')}
              className={`min-h-11 px-5 text-sm ${user ? '' : 'bg-emerald-500 hover:bg-emerald-400'}`}
            >
              {user ? 'Open App' : 'Start'}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
