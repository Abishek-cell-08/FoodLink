import React, { useState } from 'react';
import axios from 'axios';
import { User, UserRole } from '../types';
import { Button, Input, Card } from './UI';
import api from '../api/client';
import { appStorage, getApiBaseUrl, getGeolocation, isAndroidAppShell } from '../utils/platform';

interface LoginPageProps {
  onLogin: (user: User) => void;
  onRegisterClick: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegisterClick }) => {
  const [role, setRole] = useState<UserRole>(UserRole.DONOR);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMyLocation = async () => {
    const geolocation = getGeolocation();
    if (!geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          await api.post('/api/auth/me/location', {
            lat: latitude,
            lng: longitude,
          });
        } catch (locationError) {
          console.error('Failed to save location', locationError);
        }
      },
      (positionError) => {
        console.warn('Geolocation denied or failed', positionError);
      }
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/api/auth/login', {
        email,
        password,
      });

      const { token, user } = res.data.data;

      if (user.role !== role) {
        setError(`You are registered as ${user.role}, not ${role}`);
        setLoading(false);
        return;
      }

      appStorage.set('token', token);
      sendMyLocation();
      onLogin(user);
    } catch (err: any) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        if (!err.response) {
          const baseUrl = getApiBaseUrl();
          setError(
            isAndroidAppShell()
              ? `The Android app cannot reach the backend at ${baseUrl}. Use your computer's LAN IP for VITE_ANDROID_API_BASE_URL, or use adb reverse if testing over USB.`
              : `Cannot reach the backend at ${baseUrl}.`
          );
        } else if (err.response.status === 401) {
          setError('Invalid email or password');
        } else {
          setError(err.response.data?.message ?? 'Login failed. Please try again.');
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-shell px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1440px] items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-surface hidden min-h-[720px] rounded-[36px] p-8 text-white lg:flex lg:flex-col lg:justify-between lg:bg-[linear-gradient(140deg,rgba(15,23,42,0.96),rgba(17,88,72,0.92))]">
          <div>
            <div className="premium-kicker border-white/10 bg-white/10 text-emerald-100">
              Sign in
            </div>
            <h1 className="mt-8 max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.06em]">
              A calmer command center for food rescue.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
              Access the donor, NGO, or admin workspace with a cleaner hierarchy, wide layouts,
              and more polished operational flow.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">Precision</div>
              <div className="mt-3 text-2xl font-black">Unified</div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">Navigation</div>
              <div className="mt-3 text-2xl font-black">Fluid</div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">Experience</div>
              <div className="mt-3 text-2xl font-black">Premium</div>
            </div>
          </div>
        </div>

        <Card className="mx-auto w-full max-w-[560px] rounded-[36px] p-6 sm:p-8">
          <div className="space-y-3">
            <div className="premium-kicker">Workspace access</div>
            <h2 className="section-title text-3xl font-black text-slate-950 sm:text-4xl">
              Welcome back
            </h2>
            <p className="text-sm leading-7 text-slate-500">
              Sign in to continue coordinating food donations with a refined, production-ready interface.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-2 rounded-[26px] bg-slate-100/80 p-2">
            {Object.values(UserRole).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-[20px] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-300 sm:text-xs ${
                  role === r
                    ? 'bg-white text-emerald-700 shadow-[0_16px_30px_-22px_rgba(16,185,129,0.75)]'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              required
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />
            <Button fullWidth size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
            <span className="text-sm text-slate-500">New to WasteFoodLink?</span>
            <button
              type="button"
              className="text-sm font-bold text-emerald-700 transition-colors hover:text-emerald-600"
              onClick={onRegisterClick}
            >
              Create an account
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
