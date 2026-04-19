import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { Button, Card, InfoPopover } from "../UI";

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
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const perPage = 5;

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
      setPage(1);
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
  const totalPages = Math.ceil(topItems.length / perPage);
  const visibleItems = topItems.slice((page - 1) * perPage, page * perPage);

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
              setPage(1);
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="relative p-5 border-slate-200">
          <InfoPopover
            className="absolute right-4 top-4"
            title="Active NGO"
            description="The currently selected NGO whose ranking recommendations and model context are being audited."
          />
          <div className="mb-1 pr-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Active NGO</div>
          <div className="text-lg font-black text-slate-900">{selectedNgo?.name ?? "-"}</div>
          <div className="mt-2 text-xs text-slate-500">{selectedNgo?.location ?? "No location"}</div>
        </Card>
        <Card className="relative p-5 border-slate-200">
          <InfoPopover
            className="absolute right-4 top-4"
            title="Pending Ranked"
            description="The number of pending donations the engine evaluated for this NGO before producing the ranked list."
          />
          <div className="mb-1 pr-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pending Ranked</div>
          <div className="text-xl font-black text-slate-900 sm:text-2xl">{payload?.summary.pendingDonations ?? 0}</div>
          <div className="mt-2 text-[10px] font-bold text-slate-500">Top 20 shown</div>
        </Card>
        <Card className="relative p-5 border-slate-200">
          <InfoPopover
            className="absolute right-4 top-4"
            title="Average Final Score"
            description="The mean blended ranking score across the evaluated donations. Higher values usually indicate stronger operational fit."
          />
          <div className="mb-1 pr-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Average Final Score</div>
          <div className="text-xl font-black text-slate-900 sm:text-2xl">{payload?.summary.avgFinalScore ?? 0}</div>
          <div className="mt-2 text-[10px] font-bold text-emerald-600">
            {payload?.summary.mlEnabled ? `ML lift ${payload?.summary.avgMlLift ?? 0}` : "Heuristic only"}
          </div>
        </Card>
        <Card className="relative p-5 border-slate-200">
          <InfoPopover
            className="absolute right-4 top-4"
            title="Model Health"
            description="A quick diagnostic for the prediction model. Lower error values generally mean the model is estimating ranking usefulness more reliably."
          />
          <div className="mb-1 pr-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Model Health</div>
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
              {visibleItems.map((item, index) => (
                <Card key={item.id} className="relative border-slate-200 p-5">
                  <InfoPopover
                    className="absolute right-5 top-5"
                    title={`${item.foodType} ranking audit`}
                    description="This audit card explains why a donation appears at its current rank by showing its signals, sub-scores, and final blended recommendation score."
                  />
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 pr-10 xl:pr-6">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                          Rank #{(page - 1) * perPage + index + 1}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          {item.priorityTier}
                        </span>
                      </div>
                      <h3 className="break-words text-base font-bold text-slate-900 sm:text-lg">{item.foodType}</h3>
                      <p className="mt-1 break-words text-sm text-slate-500">
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

                    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[230px]">
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

                  <div className="mt-5 grid grid-cols-1 gap-4 2xl:grid-cols-2">
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
                      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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

              {topItems.length > perPage && (
                <div className="flex flex-col gap-3 px-1 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs font-medium text-slate-500">
                    Showing {visibleItems.length} of {topItems.length} ranked items
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="relative border-none bg-slate-900 p-6 text-white shadow-xl">
            <InfoPopover
              className="absolute right-6 top-6"
              title="Audit Narrative"
              description="This panel explains how to interpret the comparison between heuristic scoring, ML prediction, and the final blended ranking shown to admins."
              tone="dark"
            />
            <h3 className="mb-3 pr-10 font-bold">Audit Narrative</h3>
            <p className="text-sm text-slate-300">
              This panel compares the heuristic engine and ML predictor before the final blended score is used for NGO suggestions.
            </p>
          </Card>

          <Card className="relative p-6 border-slate-200">
            <InfoPopover
              className="absolute right-6 top-6"
              title="Model Snapshot"
              description="A compact technical summary of the current model version and its training or evaluation statistics."
            />
            <h3 className="mb-4 pr-10 font-bold text-slate-900">Model Snapshot</h3>
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
