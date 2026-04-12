import React, { useEffect, useState } from "react";
import { Button, Card } from "../UI";
import api from "../../api/client";

interface DonationItem {
  id: number;
  foodType: string;
  quantity: string;
  createdAt: string;   // ISO
  expiresAt: string;   // ISO
  distanceKm?: number;
  donorName?: string;
  location?: string;
  priorityScore: number;
  priorityTier?: string;
  decisionSignals?: string[];
}

interface APIResponse<T> {
  message: string;
  data: T;
}

interface NGOOverviewProps {
  onBrowse: () => void;
}

const NGOOverview: React.FC<NGOOverviewProps> = ({ onBrowse }) => {
  const [recommendations, setRecommendations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // -------- Time Helpers (same as Donor / Browse) --------
  const parseUTC = (iso: string) => new Date(iso + "Z");

  const getRemainingMs = (expiresAt: string) => {
    const nowMs = Date.now();
    const expMs = parseUTC(expiresAt).getTime();
    return expMs - nowMs;
  };

  const formatTimeLeft = (expiresAt: string) => {
    if (!expiresAt) return "-";

    const diffMs = getRemainingMs(expiresAt);
    if (diffMs <= 0) return "Expired";

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get<APIResponse<DonationItem[]>>("/api/ngo/overview");
      setRecommendations(res.data.data || []);
    } catch (err: any) {
      console.error("Failed to load NGO overview", err?.response || err);
      setError("Failed to load overview data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          NGO Strategic Overview
        </h2>
        <p className="text-slate-500 text-sm">
          Decision support and system-driven recommendations
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              AI-Recommended Picks
            </h3>
            <button
              onClick={onBrowse}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Browse All Food
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 font-medium">
              Loading recommendations...
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((d) => {
                const remaining = formatTimeLeft(d.expiresAt);

                return (
                  <Card
                    key={d.id}
                    className="flex flex-col gap-4 border-slate-100 p-4 transition-all hover:border-emerald-200 sm:flex-row sm:items-center sm:gap-6 sm:p-5"
                  >
                    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-3 min-w-[80px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Priority
                      </span>
                      <span className="text-xl font-black text-emerald-600">
                        {d.priorityScore}
                      </span>
                    </div>

                    <div className="flex-1">
                      <h4 className="text-base font-bold text-slate-900">{d.foodType}</h4>
                      <p className="text-xs text-slate-500">
                        {d.donorName ?? "Donor"} •{" "}
                        {d.distanceKm != null ? `${d.distanceKm.toFixed(1)} km away` : "-"}
                      </p>
                      {d.priorityTier && (
                        <div className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          {d.priorityTier}
                        </div>
                      )}
                      {d.decisionSignals && d.decisionSignals.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          {d.decisionSignals.slice(0, 2).join(" • ")}
                        </p>
                      )}
                    </div>

                    <div className="mr-0 text-left sm:mr-4 sm:text-right">
                      <div
                        className={`text-xs font-bold ${
                          remaining === "Expired" ? "text-red-600" : "text-slate-900"
                        }`}
                      >
                        {remaining}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Time Remaining
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={onBrowse}>
                      View Details
                    </Button>
                  </Card>
                );
              })}

              {recommendations.length === 0 && (
                <div className="py-20 text-center text-slate-400 font-medium">
                  No recommendations right now.
                </div>
              )}
            </div>
          )}
        </div>

        <Card className="border-none bg-slate-900 p-5 text-white shadow-xl sm:p-6">
          <h3 className="font-bold mb-4">Priority Algorithm</h3>
          <p className="text-sm text-slate-400">
            Rankings combine urgency decay, travel feasibility, perishability,
            quantity utility, demand pressure, donor reliability, and NGO execution capacity.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default NGOOverview;
