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
  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <img
              src={appLogo}
              alt="WasteFoodLink"
              className="h-12 w-auto object-contain sm:h-14"
            />
          </div>

          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors"
                >
                  Dashboard
                </button>

                {user.role === UserRole.DONOR && (
                  <button
                    onClick={() => onNavigate('add-donation')}
                    className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors"
                  >
                    Donate Food
                  </button>
                )}

                {user.role === UserRole.NGO && (
                  <button
                    onClick={() => onNavigate('scan-qr')}
                    className="text-slate-600 hover:text-emerald-600 font-medium text-sm transition-colors"
                  >
                    Scan QR
                  </button>
                )}

                <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-900">
                      {user.name}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {user.role}
                    </span>
                  </div>

                  <Button variant="outline" size="sm" onClick={onLogout}>
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
