import React, { useState } from "react";
import { User, UserRole } from "../types";
import { Button, Input, Card } from "./UI";
import api from "../api/client";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.DONOR);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data.data;

// Check role matches selected tab
if (user.role !== role) {
  setError(`You are registered as ${user.role}, not ${role}`);
  return;
}

// Save token
localStorage.setItem("token", token);

// Pass real user to app
onLogin(user);

    } catch (err: any) {
      console.error(err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <Card className="p-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 text-sm font-medium">
            Please sign in to your dashboard
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl">
          {Object.values(UserRole).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                role === r
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
            placeholder="••••••••"
            required
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />
          <Button fullWidth size="lg" disabled={loading}>
            {loading ? "Signing in..." : `Sign In`}
          </Button>
        </form>

        {error && (
          <div className="text-sm text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        <div className="text-center">
          <span className="text-sm text-slate-500">Don't have an account? </span>
          <button
            type="button"
            className="text-sm font-bold text-emerald-600 hover:underline"
            onClick={() => alert("Register page coming next 🙂")}
          >
            Register Now
          </button>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
