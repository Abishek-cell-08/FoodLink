import React, { useEffect, useState } from "react";
import { Button, Card, InfoPopover } from "../UI";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import api from "../../api/client";

interface AdminOverviewProps {
  onViewReports: () => void;
  onManageNGOs: () => void;
  onViewDonors: () => void;
}

interface KPI {
  label: string;
  val: string;
  change: string;
  help?: string;
}

interface Alert {
  type: "CRITICAL" | "WARNING" | "INFO";
  msg: string;
  time: string;
}

interface TrendPoint {
  name: string;
  val: number;
}

const AdminOverview: React.FC<AdminOverviewProps> = ({
  onViewReports,
  onManageNGOs,
  onViewDonors,
}) => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [miniData, setMiniData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/admin/overview");
      const data = res.data?.data || {};

      setKpis(
        (Array.isArray(data.kpis) ? data.kpis : []).map((kpi: KPI) => ({
          ...kpi,
          help:
            kpi.label === "Total Donations"
              ? "The platform-wide number of donations currently visible in this admin overview."
              : kpi.label === "Active NGOs"
                ? "The number of NGO accounts actively participating or available for platform operations."
                : kpi.label === "Pending Allocation"
                  ? "Donations that still need assignment or operational action before completion."
                  : kpi.label === "System Status"
                    ? "A quick health signal showing whether the main platform workflows appear stable."
                    : "This KPI tracks an important admin-level system metric for monitoring platform performance.",
        }))
      );
      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
      setMiniData(Array.isArray(data.trend) ? data.trend : []);
    } catch (err) {
      console.error("Failed to load admin overview", err);
      setError("Failed to load admin overview");
      setKpis([]);
      setAlerts([]);
      setMiniData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">System Health</h2>
          <p className="text-slate-500 text-sm">
            Real-time platform monitoring and proactive risk management
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onManageNGOs}>
            Audit NGOs
          </Button>
          <Button size="sm" onClick={onViewReports}>
            Full Reports
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 text-center text-slate-400">
            Loading KPIs...
          </div>
        ) : kpis.length > 0 ? (
          kpis.map((stat, i) => (
            <Card
              key={i}
              className={`relative border-slate-200 p-5 ${
                stat.label === "Total Donors" || stat.label === "Total NGOs"
                  ? "cursor-pointer transition-all hover:border-emerald-300 hover:shadow-md"
                  : ""
              }`}
            >
              <InfoPopover
                className="absolute right-4 top-4"
                title={stat.label}
                description={stat.help ?? "This KPI helps admins understand current platform performance."}
              />
              <button
                type="button"
                onClick={() => {
                  if (stat.label === "Total Donors") {
                    onViewDonors();
                  }
                  if (stat.label === "Total NGOs") {
                    onManageNGOs();
                  }
                }}
                className={`w-full text-left ${
                  stat.label === "Total Donors" || stat.label === "Total NGOs"
                    ? "cursor-pointer"
                    : "cursor-default"
                }`}
              >
                <div className="mb-1 pr-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {stat.label}
                </div>
                <div className="text-xl font-black text-slate-900 sm:text-2xl">
                  {stat.val}
                </div>
                <div
                  className={`mt-2 text-[10px] font-bold ${
                    stat.change?.startsWith("+") || stat.change === "Active"
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  {stat.change}
                </div>
              </button>
            </Card>
          ))
        ) : (
          <div className="col-span-4 text-center text-slate-400">
            No KPI data available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-slate-900 sm:text-lg">
            Critical System Flags
          </h3>
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border flex items-start gap-4 ${
                    alert.type === "CRITICAL"
                      ? "bg-red-50 border-red-100 text-red-900"
                      : alert.type === "WARNING"
                      ? "bg-amber-50 border-amber-100 text-amber-900"
                      : "bg-blue-50 border-blue-100 text-blue-900"
                  }`}
                >
                  <div className="flex-1 text-sm font-medium">{alert.msg}</div>
                  <div className="text-[10px] font-bold uppercase opacity-60">
                    {alert.time}
                  </div>
                </div>
              ))
            ) : !loading ? (
              <div className="text-slate-400 text-sm">No alerts 🎉</div>
            ) : null}
          </div>
        </div>

        {/* Mini Chart */}
        <div className="space-y-6">
          <Card className="relative p-6">
            <InfoPopover
              className="absolute right-6 top-6"
              title="Fulfillment Trend"
              description="This mini chart gives a quick visual signal of how donation fulfillment is moving over time, helping admins notice rising or falling operational performance."
            />
            <h4 className="mb-4 pr-10 text-sm font-bold text-slate-900">
              Fulfillment Trend
            </h4>
            <div className="h-32 min-h-[128px]">
              <ResponsiveContainer width="100%" height={128}>
                <AreaChart data={miniData.length ? miniData : []}>
                  <defs>
                    <linearGradient id="colAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colAdmin)"
                    strokeWidth={2}
                  />
                  <Tooltip />
                  <XAxis dataKey="name" hide />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
