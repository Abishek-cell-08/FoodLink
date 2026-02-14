import React, { useEffect, useState } from "react";
import { Button, Card } from "../../components/UI";
import api from "../../api/client";

interface DonationItem {
  id: number;
  foodType: string;
  quantity: string;
  expiryWindow: string;
  distanceKm?: number;
  donorName?: string;
  location?: string;
  priorityScore: number;
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">NGO Hub</h2>
          <p className="text-slate-500">
            Smart-ranked food surplus based on urgency and distance
          </p>
        </div>
        <Button variant="secondary" onClick={onScanClick}>
          Scan & Verify
        </Button>
      </div>

      {loading && (
        <div className="py-20 text-center text-slate-400 font-medium">
          Loading dashboard...
        </div>
      )}

      {error && (
        <div className="py-10 text-center text-red-600 font-medium">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((d) => (
            <Card
              key={d.id}
              className="group relative p-6 flex flex-col h-full border-slate-200 hover:border-emerald-300 transition-all hover:shadow-md"
            >
              <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full border shadow-sm text-xs font-bold bg-emerald-50 text-emerald-700">
                {d.priorityScore}
              </div>

              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-slate-400 font-medium">
                  {d.distanceKm ?? "-"} km away
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {d.foodType}
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {d.donorName ?? "Donor"} • {d.location ?? "Location"}
              </p>

              <div className="space-y-3 mt-auto">
                <div className="flex justify-between text-sm py-2 border-y border-slate-100">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="font-bold text-slate-900">{d.quantity}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-500">Time Window:</span>
                  <span className="font-bold text-slate-900">
                    {d.expiryWindow}
                  </span>
                </div>
                <div className="pt-2 flex gap-3">
                  <Button fullWidth variant="secondary">
                    Claim Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-medium">
              No pending donations available.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NGODashboard;
