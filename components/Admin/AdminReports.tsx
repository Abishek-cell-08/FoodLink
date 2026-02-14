import React, { useEffect, useState } from "react";
import { Button, Card } from "../UI";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import api from "../../api/client";

interface ReportRow {
  name: string;
  saved: number;
  wasted: number;
  predicted: number;
}

const AdminReports: React.FC = () => {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [range, setRange] = useState("30D");
  const [sector, setSector] = useState("ALL");
  const [foodType, setFoodType] = useState("ALL");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/admin/reports", {
        params: { range, sector, foodType },
      });

      const rows = res.data?.data;

      setData(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("Failed to load reports", err);
      setError("Failed to load reports");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, sector, foodType]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Impact & Evidence</h2>
          <p className="text-slate-500 text-sm">
            Historical performance data and predictive accuracy tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            CSV Export
          </Button>
          <Button size="sm">Download PDF Report</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-slate-50 border-slate-200 flex flex-wrap gap-4">
        <select
          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="30D">Last 30 Days</option>
          <option value="90D">Last Quarter</option>
          <option value="ALL">All Time</option>
        </select>

        <select
          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
        >
          <option value="ALL">All Sectors</option>
          <option value="Downtown">Downtown</option>
          <option value="East Wing">East Wing</option>
        </select>

        <select
          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
          value={foodType}
          onChange={(e) => setFoodType(e.target.value)}
        >
          <option value="ALL">All Food Types</option>
          <option value="Cooked">Cooked Meals</option>
          <option value="Groceries">Groceries</option>
        </select>
      </Card>

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium">
          Loading reports...
        </div>
      ) : error ? (
        <div className="py-20 text-center text-red-500 font-medium">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Area Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              Prediction vs Actual Surplus
            </h3>
            <div className="h-80 min-h-[320px]">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    name="Actual Saved"
                    dataKey="saved"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorSaved)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    name="AI Predicted"
                    dataKey="predicted"
                    stroke="#6366f1"
                    fillOpacity={0}
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Bar Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              Waste Reduction Efficiency
            </h3>
            <div className="h-80 min-h-[320px]">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar name="Saved (kg)" dataKey="saved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar name="Wasted (kg)" dataKey="wasted" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-8 bg-emerald-900 text-white border-none relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black mb-2 tracking-tight underline decoration-emerald-500 decoration-4">
            Evidence of Impact
          </h3>
          <p className="text-emerald-100 text-sm leading-relaxed">
            WasteFoodLink has significantly reduced food waste using intelligent
            allocation and predictive analytics, improving both response time and
            redistribution efficiency across sectors.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminReports;
