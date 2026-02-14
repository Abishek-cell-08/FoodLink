import React, { useEffect, useState } from "react";
import { Button, Card } from "../UI";
import api from "../../api/client";

interface DonationItem {
  id: number;
  foodType: string;
  quantity: string;
  expiryWindow: string;
  distanceKm?: number;
  donorName?: string;
  priorityScore: number;
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

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get<APIResponse<DonationItem[]>>("/api/ngo/overview");

      console.log("Overview API response:", res.data);

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          NGO Strategic Overview
        </h2>
        <p className="text-slate-500 text-sm">
          Decision support and system-driven recommendations
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
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
              {recommendations.map((d) => (
                <Card
                  key={d.id}
                  className="p-5 flex items-center gap-6 border-slate-100 hover:border-emerald-200 transition-all"
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
                    <h4 className="font-bold text-slate-900">{d.foodType}</h4>
                    <p className="text-xs text-slate-500">
                      {d.donorName ?? "Donor"} • {d.distanceKm ?? "-"} km away
                    </p>
                  </div>

                  <div className="text-right mr-4">
                    <div className="text-xs font-bold text-red-600">
                      {d.expiryWindow}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Time Remaining
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={onBrowse}>
                    View Details
                  </Button>
                </Card>
              ))}

              {recommendations.length === 0 && (
                <div className="py-20 text-center text-slate-400 font-medium">
                  No recommendations right now.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side info card */}
        <Card className="p-6 bg-slate-900 text-white border-none shadow-xl">
          <h3 className="font-bold mb-4">Priority Algorithm</h3>
          <p className="text-sm text-slate-400">
            Rankings are calculated based on expiry urgency, distance, and
            historical performance.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default NGOOverview;
