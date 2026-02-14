import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/client";
import { Button, Card, StatusBadge } from "../../components/UI";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Donation {
  id: number;
  foodType: string;
  quantity: string;
  expiryWindow: string;
  status: string;
  createdAt?: string;
}

interface DonorOverviewProps {
  onViewAll: () => void;
  onAddClick: () => void;
}

const DonorOverview: React.FC<DonorOverviewProps> = ({
  onViewAll,
  onAddClick,
}) => {
  const [loading, setLoading] = useState(true);
  const [totalDonations, setTotalDonations] = useState(0);
  const [statusDistribution, setStatusDistribution] =
    useState<Record<string, number>>({});
  const [recentActivity, setRecentActivity] = useState<Donation[]>([]);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get("/api/donor/overview");
        const data = res.data.data;

        setTotalDonations(data.totalDonations || 0);
        setStatusDistribution(data.statusDistribution || {});
        setRecentActivity(data.recentActivity || []);
      } catch (err) {
        console.error("Failed to load donor overview", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const chartData = useMemo(() => {
    if (!recentActivity.length) return [];

    const map: Record<string, number> = {};

    recentActivity.forEach((d, i) => {
      const key = d.createdAt
        ? new Date(d.createdAt).toLocaleDateString()
        : `Day ${i + 1}`;
      map[key] = (map[key] || 0) + 1;
    });

    return Object.keys(map).map((k) => ({
      name: k,
      count: map[k],
    }));
  }, [recentActivity]);

  if (loading) {
    return <div className="p-6">Loading overview...</div>;
  }

  const stats = [
    { label: "Total Donations", val: String(totalDonations) },
    { label: "Pending", val: String(statusDistribution["PENDING"] ?? 0) },
    { label: "Allocated", val: String(statusDistribution["ALLOCATED"] ?? 0) },
    { label: "Picked Up", val: String(statusDistribution["PICKED_UP"] ?? 0) },
    { label: "Active Tasks", val: String(statusDistribution["PENDING"] ?? 0) },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Impact Overview
          </h2>
          <p className="text-slate-500 text-sm">
            Your contribution to SDG 12 (Responsible Consumption)
          </p>
        </div>
        <Button onClick={onAddClick}>+ New Donation</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <Card
            key={i}
            className="p-4 bg-white border border-slate-200 shadow-sm"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {s.label || "—"}
            </div>

            <div className="text-xl font-bold mt-1 text-black">
              {s.val || "0"}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Donations Over Time
          </h3>

          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm border border-dashed rounded-lg">
              No data yet. Your donation trends will appear here 📈
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="donorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    fill="url(#donorGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">
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

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 italic">
              "Small acts, when multiplied by millions of people, can transform
              the world."
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DonorOverview;
