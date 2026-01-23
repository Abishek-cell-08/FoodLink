
import React from 'react';
import { User, UserRole } from '../types';
import { Button } from './UI';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate }) => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">WasteFoodLink</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <button onClick={() => onNavigate('dashboard')} className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors">Dashboard</button>
                {user.role === UserRole.DONOR && (
                  <button onClick={() => onNavigate('add-donation')} className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors">Donate Food</button>
                )}
                {user.role === UserRole.NGO && (
                  <button onClick={() => onNavigate('scan')} className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors">Scan QR</button>
                )}
                <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                    <span className="text-xs text-slate-500 font-medium">{user.role}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={onLogout}>Logout</Button>
                </div>
              </>
            ) : (
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => onNavigate('login')}>Login</Button>
                <Button onClick={() => onNavigate('login')}>Get Started</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
