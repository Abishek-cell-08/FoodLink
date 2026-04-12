import React, { useState } from "react";
import axios from "axios";
import { User, UserRole } from "../types";
import { Button, Input, Card } from "./UI";
import api from "../api/client";
import { appStorage, getApiBaseUrl, getGeolocation, isAndroidAppShell } from "../utils/platform";

interface LoginPageProps {
  onLogin: (user: User) => void;
  onRegisterClick: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegisterClick }) => {
  const [role, setRole] = useState<UserRole>(UserRole.DONOR);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMyLocation = async () => {
    const geolocation = getGeolocation();
    if (!geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        try {
          await api.post("/api/auth/me/location", {
            lat: latitude,
            lng: longitude,
          });
        } catch (locationError) {
          console.error("Failed to save location", locationError);
        }
      },
      (positionError) => {
        console.warn("Geolocation denied or failed", positionError);
      }
    );
  };

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

      if (user.role !== role) {
        setError(`You are registered as ${user.role}, not ${role}`);
        setLoading(false);
        return;
      }

      appStorage.set("token", token);
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
          setError("Invalid email or password");
        } else {
          setError(err.response.data?.message ?? "Login failed. Please try again.");
        }
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-16">
      <Card className="space-y-6 p-5 sm:p-7">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Welcome Back</h2>
          <p className="text-slate-500 text-sm font-medium">
            Please sign in to your dashboard
          </p>
        </div>

        <div className="flex rounded-2xl bg-slate-100 p-1">
          {Object.values(UserRole).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-bold uppercase tracking-[0.06em] transition-all sm:text-xs ${
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
            placeholder="........"
            required
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
          />
          <Button fullWidth disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
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
            onClick={onRegisterClick}
          >
            Register Now
          </button>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
