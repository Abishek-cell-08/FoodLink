import React, { useState } from "react";
import { UserRole } from "../types";
import { Button, Input, Card } from "./UI";
import api from "../api/client";

interface RegisterPageProps {
  onBackToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onBackToLogin }) => {
  const [role, setRole] = useState<UserRole>(UserRole.DONOR);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post("/api/auth/register", {
        name,
        email,
        password,
        role,
        location: location || undefined,
      });

      setSuccess("Registration successful! You can now login.");
      setTimeout(() => {
        onBackToLogin();
      }, 1200);
    } catch (err: any) {
      console.error("Registration failed", err);
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <Card className="p-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
          <p className="text-slate-500 text-sm font-medium">
            Join WasteFoodLink today
          </p>
        </div>

        {/* Role Switch */}
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

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            required
            value={name}
            onChange={(e: any) => setName(e.target.value)}
          />

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

          <Input
            label="Location (optional)"
            placeholder="City / Area"
            value={location}
            onChange={(e: any) => setLocation(e.target.value)}
          />

          <Button fullWidth size="lg" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </Button>
        </form>

        {error && (
          <div className="text-sm text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-emerald-600 text-center font-medium">
            {success}
          </div>
        )}

        <div className="text-center">
          <span className="text-sm text-slate-500">Already have an account? </span>
          <button
            type="button"
            className="text-sm font-bold text-emerald-600 hover:underline"
            onClick={onBackToLogin}
          >
            Sign In
          </button>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;