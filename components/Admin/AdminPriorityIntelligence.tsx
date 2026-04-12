import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { Button, Card } from "../UI";

interface NgoOption {
  id: number;
  name: string;
  location?: string;
  verified: boolean;
}

interface PriorityItem {
  id: number;
  foodType: string;
  quantity: string;
  donorName: string;
  donorLocation?: string;
  distanceKm?: number;
  priorityTier: string;
  finalScore: number;
  heuristicScore?: number;
  mlScore?: number | null;
  scoreBreakdown: Record<string, number>;
  decisionSignals: string[];
  explainability: {
    remainingHours: number;
    estimatedMeals: number;
    foodProfile: string;
    heuristicScore?: number;
    mlScore?: number | null;
    mlEnabled?: boolean;
  };
}

interface PriorityPayload {
  selectedNgo: {
    id: number;
    name: string;
    location?: string;
    verified: boolean;
    performanceScore?: number;
  } | null;
  ngos: NgoOption[];
  summary: {
    pendingDonations: number;
    strategicCount: number;
    avgFinalScore: number;
    avgMlLift: number;
    mlEnabled: boolean;
  };
  model?: {
    type: string;
    metrics: {
      mae?: number;
      rmse?: number;
    };
    trainingRows?: number;
    testRows?: number;
  } | null;
  items: PriorityItem[];
}

const scoreLabelMap: Record<string, string> = {
  urgency: "Urgency",
  travel_feasibility: "Travel Fit",
  food_risk: "Food Risk",
  quantity_utility: "Quantity",
  demand_pressure: "Demand",
  ngo_capability: "NGO Fit",
  donor_reliability: "Donor Trust",
};

const AdminPriorityIntelligence: React.FC = () => {
  const [selectedNgoId, setSelectedNgoId] = useState<number | "">("");
  const [payload, setPayload] = useState<PriorityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (ngoId?: number | "") => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/admin/priority-insights", {
        params: ngoId ? { ngoId } : {},
      });
      const data = res.data?.data as PriorityPayload;
      setPayload(data);
      setSelectedNgoId(data?.selectedNgo?.id ?? "");
    } catch (err) {
      console.error("Failed to load priority intelligence", err);
      setError("Failed to load priority intelligence");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const selectedNgo = payload?.selectedNgo;
  const topItems = payload?.items ?? [];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 sm:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Priority Intelligence</h2>
          <p className="text-sm text-slate-500">
            Audit the ranking engine across heuristic logic, ML prediction, and final recommendation order
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="min-h-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium outline-none"
            value={selectedNgoId}
            onChange={(e) => {
              const value = e.target.value ? Number(e.target.value) : "";
              setSelectedNgoId(value);
              fetchInsights(value);
            }}
          >
            {(payload?.ngos ?? []).map((ngo) => (
              <option key={ngo.id} value={ngo.id}>
                {ngo.name} {ngo.verified ? "" : "(Pending)"}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => fetchInsights(selectedNgoId)}>
            Refresh
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="p-5 border-slate-200">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Active NGO</div>
          <div className="text-lg font-black text-slate-900">{selectedNgo?.name ?? "-"}</div>
          <div className="mt-2 text-xs text-slate-500">{selectedNgo?.location ?? "No location"}</div>
        </Card>
        <Card className="p-5 border-slate-200">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pending Ranked</div>
          <div className="text-xl font-black text-slate-900 sm:text-2xl">{payload?.summary.pendingDonations ?? 0}</div>
          <div className="mt-2 text-[10px] font-bold text-slate-500">Top 20 shown</div>
        </Card>
        <Card className="p-5 border-slate-200">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Average Final Score</div>
          <div className="text-xl font-black text-slate-900 sm:text-2xl">{payload?.summary.avgFinalScore ?? 0}</div>
          <div className="mt-2 text-[10px] font-bold text-emerald-600">
            {payload?.summary.mlEnabled ? `ML lift ${payload?.summary.avgMlLift ?? 0}` : "Heuristic only"}
          </div>
        </Card>
        <Card className="p-5 border-slate-200">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Model Health</div>
          <div className="text-lg font-black text-slate-900">
            {payload?.model?.metrics?.mae != null ? `MAE ${payload.model.metrics.mae}` : "No model"}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {payload?.model?.type ?? "Priority model not loaded"}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {loading ? (
            <div className="py-20 text-center font-medium text-slate-400">Loading ranking audit...</div>
          ) : topItems.length === 0 ? (
            <div className="py-20 text-center font-medium text-slate-400">No ranked donations available.</div>
          ) : (
            <div className="space-y-4">
              {topItems.map((item, index) => (
                <Card key={item.id} className="border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                          Rank #{index + 1}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          {item.priorityTier}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 sm:text-lg">{item.foodType}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.quantity} • {item.donorName} • {item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km` : "Distance unknown"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.decisionSignals.map((signal) => (
                          <span key={signal} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                            {signal}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid min-w-0 grid-cols-3 gap-3 sm:min-w-[230px]">
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Heuristic</div>
                        <div className="text-lg font-black text-slate-900 sm:text-xl">{item.heuristicScore ?? "-"}</div>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-3 text-center">
                        <div className="text-[10px] font-bold uppercase text-emerald-600">ML</div>
                        <div className="text-lg font-black text-emerald-700 sm:text-xl">{item.mlScore ?? "-"}</div>
                      </div>
                      <div className="rounded-xl bg-slate-900 p-3 text-center">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Final</div>
                        <div className="text-lg font-black text-white sm:text-xl">{item.finalScore}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="mb-3 text-sm font-bold text-slate-900">Score Breakdown</div>
                      <div className="space-y-2">
                        {Object.entries(item.scoreBreakdown).map(([key, rawValue]) => {
                          const value = Number(rawValue);
                          return (
                          <div key={key}>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="font-medium text-slate-500">{scoreLabelMap[key] ?? key}</span>
                              <span className="font-bold text-slate-900">{value}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-emerald-500"
                                style={{ width: `${Math.max(6, Math.min(100, value))}%` }}
                              />
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                      <div className="mb-3 text-sm font-bold text-slate-900">Operational Evidence</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">Time Left</div>
                          <div className="font-bold text-slate-900">{item.explainability.remainingHours} h</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">Estimated Meals</div>
                          <div className="font-bold text-slate-900">{item.explainability.estimatedMeals}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">Food Profile</div>
                          <div className="font-bold text-slate-900">{item.explainability.foodProfile}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-400">ML Status</div>
                          <div className="font-bold text-slate-900">
                            {item.explainability.mlEnabled ? "Enabled" : "Fallback"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-slate-900 p-6 text-white shadow-xl">
            <h3 className="mb-3 font-bold">Audit Narrative</h3>
            <p className="text-sm text-slate-300">
              This panel compares the heuristic engine and ML predictor before the final blended score is used for NGO suggestions.
            </p>
          </Card>

          <Card className="p-6 border-slate-200">
            <h3 className="mb-4 font-bold text-slate-900">Model Snapshot</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-bold text-slate-900">{payload?.model?.type ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">MAE</span>
                <span className="font-bold text-slate-900">{payload?.model?.metrics?.mae ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">RMSE</span>
                <span className="font-bold text-slate-900">{payload?.model?.metrics?.rmse ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Training Rows</span>
                <span className="font-bold text-slate-900">{payload?.model?.trainingRows ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Test Rows</span>
                <span className="font-bold text-slate-900">{payload?.model?.testRows ?? "-"}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPriorityIntelligence;
