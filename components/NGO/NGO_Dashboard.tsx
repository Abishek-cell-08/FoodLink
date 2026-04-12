import React, { useEffect, useState } from "react";
import { Button, Card } from "../../components/UI";
import api from "../../api/client";

interface DonationItem {
  id: number;
  foodType: string;
  quantity: string;
  expiresAt: string;
  distanceKm?: number;
  donorName?: string;
  location?: string;
  priorityScore: number;
  priorityTier?: string;
  decisionSignals?: string[];
}

interface NGODashboardProps {
  onScanClick: () => void;
}

const NGODashboard: React.FC<NGODashboardProps> = ({ onScanClick }) => {
  const [items, setItems] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/ngo/dashboard");
      setItems(res.data.data || []);
    } catch (err: any) {
      console.error("Failed to load NGO dashboard", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleClaim = async (id: number) => {
    try {
      await api.post(`/api/ngo/claim/${id}`);
      alert("Donation claimed successfully!");
      fetchDashboard();
    } catch (err: any) {
      console.error("Failed to claim donation", err);
      alert(err.response?.data?.message || "Failed to claim donation");
    }
  };

  const timeLeft = (expiresAt: string) => {
    const now = Date.now();
    const expires = new Date(expiresAt + "Z").getTime();
    const diff = expires - now;
    if (diff <= 0) return "Expired";
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">NGO Hub</h2>
          <p className="text-slate-500">
            Smart-ranked food surplus based on operational urgency and execution feasibility
          </p>
        </div>
        <Button variant="secondary" onClick={onScanClick}>
          Scan & Verify
        </Button>
      </div>

      {loading && <div className="py-20 text-center font-medium text-slate-400">Loading dashboard...</div>}
      {error && <div className="py-10 text-center font-medium text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="group relative flex h-full flex-col border-slate-200 p-4 transition-all hover:border-emerald-300 hover:shadow-md sm:p-6"
            >
              <div className="absolute -right-3 -top-3 rounded-full border bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                {item.priorityScore}
              </div>

              <div className="mb-4 flex items-start justify-between">
                <span className="text-xs font-medium text-slate-400">
                  {item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km away` : "Distance unknown"}
                </span>
                {item.priorityTier && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    {item.priorityTier}
                  </span>
                )}
              </div>

              <h3 className="mb-1 text-base font-bold text-slate-900 sm:text-lg">{item.foodType}</h3>
              <p className="mb-4 text-sm text-slate-600">{item.donorName ?? "Donor"} • {item.location ?? "Location"}</p>

              {item.decisionSignals && item.decisionSignals.length > 0 && (
                <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {item.decisionSignals.slice(0, 2).join(" • ")}
                </div>
              )}

              <div className="mt-auto space-y-3">
                <div className="flex justify-between border-y border-slate-100 py-2 text-sm">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="font-bold text-slate-900">{item.quantity}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-2 text-sm">
                  <span className="text-slate-500">Time Window:</span>
                  <span className="font-bold text-slate-900">{timeLeft(item.expiresAt)}</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button fullWidth size="sm" variant="secondary" onClick={() => handleClaim(item.id)}>
                    Claim Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="col-span-full py-20 text-center font-medium text-slate-400">
              No pending donations available.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NGODashboard;
