import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import { Button, Card, StatusBadge } from "../../components/UI";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Donation {
  id: number;
  foodType: string;
  quantity: string;
  expiryWindow: string;
  status: string;
  createdAt?: string;
}

interface TimelinePoint {
  label: string;
  completed: number;
  active: number;
  missed: number;
  total: number;
  completionRate: number;
}

interface TimelineSummary {
  completed: number;
  active: number;
  missed: number;
  peakLabel: string;
  peakTotal: number;
  granularity?: "day" | "week" | "month";
  range?: "7D" | "30D" | "ALL";
}

interface TimelinePayload {
  points: TimelinePoint[];
  summary: TimelineSummary;
}

interface DonorOverviewProps {
  onViewAll: () => void;
  onAddClick: () => void;
}

const chartColors = {
  completed: "#10b981",
  active: "#f59e0b",
  missed: "#ef4444",
  total: "#0f172a",
};

const rangeOptions: Array<{ value: "7D" | "30D" | "ALL"; label: string }> = [
  { value: "7D", label: "7D" },
  { value: "30D", label: "30D" },
  { value: "ALL", label: "All Time" },
];

const rangeLabelMap: Record<"7D" | "30D" | "ALL", string> = {
  "7D": "last 7 days",
  "30D": "last 30 days",
  "ALL": "all time",
};

const DonorTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  const valueMap = payload.reduce<Record<string, number>>((acc, item) => {
    if (item.name && typeof item.value === "number") {
      acc[item.name] = item.value;
    }
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="mb-2 text-sm font-bold text-slate-900">{label}</div>
      <div className="space-y-2 text-xs text-slate-600">
        {payload.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
            </div>
            <span className="font-bold text-slate-900">{item.value ?? 0}</span>
          </div>
        ))}
        <div className="border-t border-slate-100 pt-2 text-[11px]">
          Completion rate:{" "}
          <span className="font-bold text-slate-900">
            {valueMap["Completion %"] ?? 0}%
          </span>
        </div>
      </div>
    </div>
  );
};

const DonorOverview: React.FC<DonorOverviewProps> = ({
  onViewAll,
  onAddClick,
}) => {
  const [loading, setLoading] = useState(true);
  const [totalDonations, setTotalDonations] = useState(0);
  const [statusDistribution, setStatusDistribution] =
    useState<Record<string, number>>({});
  const [recentActivity, setRecentActivity] = useState<Donation[]>([]);
  const [range, setRange] = useState<"7D" | "30D" | "ALL">("30D");
  const [timeline, setTimeline] = useState<TimelinePayload>({
    points: [],
    summary: {
      completed: 0,
      active: 0,
      missed: 0,
      peakLabel: "-",
      peakTotal: 0,
      granularity: "day",
      range: "30D",
    },
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get("/api/donor/overview", {
          params: { range },
        });
        const data = res.data.data;

        setTotalDonations(data.totalDonations || 0);
        setStatusDistribution(data.statusDistribution || {});
        setRecentActivity(data.recentActivity || []);
        setTimeline({
          points: Array.isArray(data.timeline?.points) ? data.timeline.points : [],
          summary: data.timeline?.summary ?? {
            completed: 0,
            active: 0,
            missed: 0,
            peakLabel: "-",
            peakTotal: 0,
            granularity: "day",
            range,
          },
        });
      } catch (err) {
        console.error("Failed to load donor overview", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [range]);

  const completionRate = useMemo(() => {
    if (!totalDonations) {
      return 0;
    }
    return Math.round(((statusDistribution["PICKED_UP"] ?? 0) / totalDonations) * 100);
  }, [statusDistribution, totalDonations]);

  const chartNarrative = useMemo(() => {
    if (!timeline.points.some((point) => point.total > 0)) {
      return `Once you start donating, your ${rangeLabelMap[range]} of activity will appear here.`;
    }

    return `${timeline.summary.completed} donations were completed in the ${rangeLabelMap[range]}, and your busiest period was ${timeline.summary.peakLabel}.`;
  }, [range, timeline]);

  if (loading) {
    return <div className="p-6">Loading overview...</div>;
  }

  const stats = [
    { label: "Total Donations", val: String(totalDonations) },
    { label: "Pending", val: String(statusDistribution["PENDING"] ?? 0) },
    { label: "Allocated", val: String(statusDistribution["ALLOCATED"] ?? 0) },
    { label: "Picked Up", val: String(statusDistribution["PICKED_UP"] ?? 0) },
    { label: "Active Tasks", val: String((statusDistribution["PENDING"] ?? 0) + (statusDistribution["ALLOCATED"] ?? 0)) },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Impact Overview
          </h2>
          <p className="text-slate-500 text-sm">
            Your contribution to SDG 12 (Responsible Consumption)
          </p>
        </div>
        <Button size="sm" onClick={onAddClick}>New Donation</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((s, i) => (
          <Card
            key={i}
            className="border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {s.label || "-"}
            </div>

            <div className="mt-1 text-lg font-bold text-black sm:text-xl">
              {s.val || "0"}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 overflow-hidden border-slate-200">
          <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,_#ffffff,_#f8fafc)] p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                  Donation Activity Over Time
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Track how many donations were completed, still active, or missed across {rangeLabelMap[range]}.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                  {rangeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRange(option.value)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                        range === option.value
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl bg-white/90 px-4 py-3 text-right shadow-sm ring-1 ring-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Insight</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{chartNarrative}</div>
                </div>
              </div>
            </div>
          </div>

          {timeline.points.length === 0 || !timeline.points.some((point) => point.total > 0) ? (
            <div className="m-6 flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
              No data yet. Your donation trends will appear here.
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Completed</div>
                  <div className="mt-2 text-xl font-black text-emerald-700 sm:text-2xl">{timeline.summary.completed}</div>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Active</div>
                  <div className="mt-2 text-xl font-black text-amber-700 sm:text-2xl">{timeline.summary.active}</div>
                </div>
                <div className="rounded-2xl bg-slate-900 p-4 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completion Rate</div>
                  <div className="mt-2 text-xl font-black sm:text-2xl">{completionRate}%</div>
                </div>
              </div>

              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timeline.points}>
                    <CartesianGrid
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<DonorTooltip />} />
                    <Bar
                      type="monotone"
                      dataKey="completed"
                      name="Completed"
                      stackId="activity"
                      fill={chartColors.completed}
                      radius={[8, 8, 0, 0]}
                      maxBarSize={30}
                    />
                    <Bar
                      type="monotone"
                      dataKey="active"
                      name="Active"
                      stackId="activity"
                      fill={chartColors.active}
                      maxBarSize={30}
                    />
                    <Bar
                      type="monotone"
                      dataKey="missed"
                      name="Missed"
                      stackId="activity"
                      fill={chartColors.missed}
                      radius={[0, 0, 8, 8]}
                      maxBarSize={30}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke={chartColors.total}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: chartColors.total }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completionRate"
                      name="Completion %"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">
              Recent Activity
            </h3>
            <button
              onClick={onViewAll}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>

                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900 line-clamp-1">
                    {d.foodType}
                  </div>

                  <div className="text-[10px] text-slate-500 font-medium">
                    {d.quantity} • {d.expiryWindow}
                  </div>
                </div>

                <StatusBadge status={d.status as any} />
              </div>
            ))}

            {recentActivity.length === 0 && (
              <div className="text-sm text-slate-400 text-center">
                No recent donations.
              </div>
            )}
          </div>

          <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500">Completed</span>
                <span className="font-bold text-slate-900">{timeline.summary.completed}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${totalDonations ? (timeline.summary.completed / totalDonations) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-500">Active</span>
                <span className="font-bold text-slate-900">{timeline.summary.active}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{ width: `${totalDonations ? (timeline.summary.active / totalDonations) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Busiest Day</div>
              <div className="mt-2 text-lg font-black text-slate-900">{timeline.summary.peakLabel}</div>
              <div className="mt-1 text-xs text-slate-500">{timeline.summary.peakTotal} donations posted</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DonorOverview;
