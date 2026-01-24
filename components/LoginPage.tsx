
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Button, Input, Card } from './UI';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.DONOR);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const names = {
      [UserRole.DONOR]: 'Skyline Restaurant',
      [UserRole.NGO]: 'Help Hands Foundation',
      [UserRole.ADMIN]: 'Platform Super Admin'
    };
    onLogin({
      id: `u-${Math.random()}`,
      name: names[role],
      email: `${role.toLowerCase()}@wfl.com`,
      role,
      verified: true,
      performanceScore: 85
    });
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <Card className="p-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 text-sm font-medium">Please sign in to your dashboard</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl">
          {Object.values(UserRole).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                role === r ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input label="Email Address" type="email" placeholder="john@example.com" required />
          <Input label="Password" type="password" placeholder="••••••••" required />
          <Button fullWidth size="lg">Sign In as {role}</Button>
        </form>

        <div className="text-center">
          <span className="text-sm text-slate-500">Don't have an account? </span>
          <button className="text-sm font-bold text-emerald-600 hover:underline">Register Now</button>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
