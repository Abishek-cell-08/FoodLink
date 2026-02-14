import React, { useEffect, useState } from "react";
import { Button, Card } from "../UI";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import api from "../../api/client";

interface AdminOverviewProps {
  onViewReports: () => void;
  onManageNGOs: () => void;
}

interface KPI {
  label: string;
  val: string;
  change: string;
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

      setKpis(Array.isArray(data.kpis) ? data.kpis : []);
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Health</h2>
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
            <Card key={i} className="p-5 border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {stat.label}
              </div>
              <div className="text-2xl font-black text-slate-900">
                {stat.val}
              </div>
              <div
                className={`text-[10px] font-bold mt-2 ${
                  stat.change?.startsWith("+") || stat.change === "Active"
                    ? "text-emerald-600"
                    : "text-slate-500"
                }`}
              >
                {stat.change}
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-4 text-center text-slate-400">
            No KPI data available
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-900">
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
                  <div className="text-[10px] font-bold opacity-60 uppercase whitespace-nowrap">
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
          <Card className="p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-4">
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
