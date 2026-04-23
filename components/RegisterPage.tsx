import React, { useState } from 'react';
import { UserRole } from '../types';
import { Button, Input, Card } from './UI';
import api from '../api/client';

interface RegisterPageProps {
  onBackToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onBackToLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.DONOR);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/api/auth/register', {
        name,
        email,
        password,
        role,
        location: location || undefined,
      });

      setSuccess('Registration successful! You can now login.');
      setTimeout(() => {
        onBackToLogin();
      }, 1200);
    } catch (err: any) {
      console.error('Registration failed', err);
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-shell px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1440px] items-stretch gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="order-2 mx-auto w-full max-w-[620px] rounded-[36px] p-6 sm:p-8 lg:order-1">
          <div className="space-y-3">
            <div className="premium-kicker">Create account</div>
            <h2 className="section-title text-3xl font-black text-slate-950 sm:text-4xl">
              Join the network
            </h2>
            <p className="text-sm leading-7 text-slate-500">
              Set up a donor, NGO, or admin account with the same premium experience used across the platform.
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

          <form onSubmit={handleRegister} className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Full Name"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e: any) => setName(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                required
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
              />
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Create a secure password"
              required
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
            />

            <Input
              label="Location"
              placeholder="City / Area"
              value={location}
              onChange={(e: any) => setLocation(e.target.value)}
            />

            <div className="sm:col-span-2">
              <Button fullWidth size="lg" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
            <span className="text-sm text-slate-500">Already have an account?</span>
            <button
              type="button"
              className="text-sm font-bold text-emerald-700 transition-colors hover:text-emerald-600"
              onClick={onBackToLogin}
            >
              Sign in instead
            </button>
          </div>
        </Card>

        <div className="order-1 hidden min-h-[760px] rounded-[36px] bg-[linear-gradient(145deg,rgba(247,250,248,0.98),rgba(226,240,234,0.9))] p-8 shadow-[0_28px_90px_-50px_rgba(15,23,42,0.35)] ring-1 ring-white/80 lg:order-2 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="premium-kicker">Designed to scale</div>
            <h1 className="mt-8 max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950">
              One refined system for every role.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-600">
              Donors, NGOs, and admins all step into the same spacious visual language, with
              consistent actions, elevated surfaces, and lightweight interactions.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[30px] bg-slate-950 p-6 text-white">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">Experience principle</div>
              <div className="mt-3 text-2xl font-black tracking-[-0.04em]">Clarity over clutter</div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Wide layout, softer contrast, and premium surfaces tuned for production use rather than demo styling.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] bg-white p-5 ring-1 ring-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Spacing</div>
                <div className="mt-3 text-2xl font-black text-slate-950">12px rhythm</div>
              </div>
              <div className="rounded-[28px] bg-white p-5 ring-1 ring-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Visual tone</div>
                <div className="mt-3 text-2xl font-black text-slate-950">Minimal</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
