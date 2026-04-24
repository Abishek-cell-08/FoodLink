import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, InfoPopover } from "../UI";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../api/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportPoint {
  label: string;
  saved: number;
  pending: number;
  wasted: number;
  total: number;
  completionRate: number;
}

interface ReportSummary {
  totalDonations: number;
  saved: number;
  pending: number;
  wasted: number;
  peakLabel: string;
  peakTotal: number;
  granularity: "day" | "week" | "month";
}

interface ReportPayload {
  points: ReportPoint[];
  summary: ReportSummary;
}

const chartPalette = {
  saved: "#10b981",
  pending: "#f59e0b",
  wasted: "#ef4444",
  total: "#0f172a",
};

const formatGranularityLabel = (granularity?: ReportSummary["granularity"]) => {
  if (granularity === "week") {
    return "weekly";
  }
  if (granularity === "month") {
    return "monthly";
  }
  return "daily";
};

const CustomTooltip = ({
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

  const valueMap = payload.reduce<Record<string, number>>((acc, entry) => {
    if (entry.name && typeof entry.value === "number") {
      acc[entry.name] = entry.value;
    }
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="mb-2 text-sm font-bold text-slate-900">{label}</div>
      <div className="space-y-2 text-xs text-slate-600">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}</span>
            </div>
            <span className="font-bold text-slate-900">{entry.value ?? 0}</span>
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

const AdminReports: React.FC = () => {
  const [report, setReport] = useState<ReportPayload | null>(null);
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

      const payload = res.data?.data as ReportPayload | undefined;
      setReport({
        points: Array.isArray(payload?.points) ? payload?.points : [],
        summary: payload?.summary ?? {
          totalDonations: 0,
          saved: 0,
          pending: 0,
          wasted: 0,
          peakLabel: "-",
          peakTotal: 0,
          granularity: "day",
        },
      });
    } catch (err) {
      console.error("Failed to load reports", err);
      setError("Failed to load reports");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, sector, foodType]);

  const points = report?.points ?? [];
  const summary = report?.summary;
  const completionRate = summary?.totalDonations
    ? Math.round((summary.saved / summary.totalDonations) * 100)
    : 0;
  const chartNarrative = useMemo(() => {
    if (!summary || summary.totalDonations === 0) {
      return "No donation activity is available for this filter yet.";
    }

    return `${summary.totalDonations} donations tracked in this view, with ${summary.saved} completed and the busiest ${formatGranularityLabel(summary.granularity)} window on ${summary.peakLabel}.`;
  }, [summary]);

  const exportCSV = () => {
    if (!points.length) {
      alert("No data to export");
      return;
    }

    const headers = ["Period", "Completed", "Pending", "Missed", "Total", "Completion Rate"];
    const rows = points.map((point) => [
      point.label,
      point.saved,
      point.pending,
      point.wasted,
      point.total,
      `${point.completionRate}%`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "wastefoodlink_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!points.length) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("WasteFoodLink - Donation Flow Report", 14, 20);

    doc.setFontSize(10);
    doc.text(`Range: ${range} | Sector: ${sector} | Food Type: ${foodType}`, 14, 28);
    doc.text(`Completion Rate: ${completionRate}% | Peak Window: ${summary?.peakLabel ?? "-"}`, 14, 34);

    const tableData = points.map((point) => [
      point.label,
      point.saved,
      point.pending,
      point.wasted,
      point.total,
      `${point.completionRate}%`,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Period", "Completed", "Pending", "Missed", "Total", "Completion Rate"]],
      body: tableData,
    });

    doc.save("wastefoodlink_report.pdf");
  };

  return (
    <div className="mobile-page space-y-6 pb-20 animate-in fade-in duration-500 sm:space-y-8">
      <div className="mobile-section-head flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Impact & Evidence</h2>
          <p className="text-sm text-slate-500">
            Clear donation trends, grouped by time range, so the admin team can spot what needs action
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={exportCSV}>
            CSV Export
          </Button>
          <Button size="sm" className="w-full sm:w-auto" onClick={exportPDF}>
            Download PDF Report
          </Button>
        </div>
      </div>

      <Card className="mobile-toolbar flex flex-wrap gap-3 border-slate-200 bg-slate-50 p-4">
        <select
          className="mobile-select min-h-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="30D">Last 30 Days</option>
          <option value="90D">Last Quarter</option>
          <option value="ALL">All Time</option>
        </select>

        <select
          className="mobile-select min-h-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
        >
          <option value="ALL">All Sectors</option>
          <option value="Downtown">Downtown</option>
          <option value="East Wing">East Wing</option>
        </select>

        <select
          className="mobile-select min-h-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold outline-none"
          value={foodType}
          onChange={(e) => setFoodType(e.target.value)}
        >
          <option value="ALL">All Food Types</option>
          <option value="Cooked">Cooked Meals</option>
          <option value="Groceries">Groceries</option>
        </select>
      </Card>

      {loading ? (
        <div className="py-20 text-center font-medium text-slate-400">Loading reports...</div>
      ) : error ? (
        <div className="py-20 text-center font-medium text-red-500">{error}</div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="relative border-slate-200 p-5">
              <InfoPopover
                className="absolute right-4 top-4"
                title="Total Donations"
                description="The number of donations included in the current report filters and date range."
              />
              <div className="mb-1 pr-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Donations</div>
              <div className="text-xl font-black text-slate-900 sm:text-2xl">{summary?.totalDonations ?? 0}</div>
              <div className="mt-2 text-xs text-slate-500 capitalize">
                {formatGranularityLabel(summary?.granularity)} view
              </div>
            </Card>
            <Card className="relative border-slate-200 p-5">
              <InfoPopover
                className="absolute right-4 top-4"
                title="Completed"
                description="Donations successfully fulfilled in this report view. This is a core indicator of impact delivered."
              />
              <div className="mb-1 pr-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Completed</div>
              <div className="text-xl font-black text-emerald-600 sm:text-2xl">{summary?.saved ?? 0}</div>
              <div className="mt-2 text-xs text-slate-500">{completionRate}% completion rate</div>
            </Card>
            <Card className="relative border-slate-200 p-5">
              <InfoPopover
                className="absolute right-4 top-4"
                title="Awaiting Action"
                description="Donations still pending allocation, confirmation, or pickup. A rising number here usually means operational backlog."
              />
              <div className="mb-1 pr-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Awaiting Action</div>
              <div className="text-xl font-black text-amber-500 sm:text-2xl">{summary?.pending ?? 0}</div>
              <div className="mt-2 text-xs text-slate-500">Pending allocation or pickup</div>
            </Card>
            <Card className="relative border-slate-200 p-5">
              <InfoPopover
                className="absolute right-4 top-4"
                title="Peak Window"
                description="The busiest time bucket in the selected report range, based on total donation volume."
              />
              <div className="mb-1 pr-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Peak Window</div>
              <div className="text-lg font-black text-slate-900">{summary?.peakLabel ?? "-"}</div>
              <div className="mt-2 text-xs text-slate-500">{summary?.peakTotal ?? 0} donations logged</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.9fr)] xl:gap-8">
            <Card className="relative overflow-hidden border-slate-200">
              <InfoPopover
                className="absolute right-6 top-6 z-10"
                title="Donation Flow Over Time"
                description="This chart helps admins compare completion, pending backlog, missed donations, and total activity for each reporting period."
              />
              <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,_#ffffff,_#f8fafc)] p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="pr-12">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">Donation Flow Over Time</h3>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">
                      Stacked bars show completed, pending, and missed donations, while the line tracks total activity for each period.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/90 px-4 py-3 text-right shadow-sm ring-1 ring-slate-200">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Insight</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{chartNarrative}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="h-[360px] min-h-[360px]">
                  <ResponsiveContainer width="100%" height={360}>
                    <ComposedChart data={points}>
                      <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={18}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 12 }} />
                      <Bar
                        name="Completed"
                        dataKey="saved"
                        stackId="donations"
                        fill={chartPalette.saved}
                        radius={[8, 8, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        name="Pending"
                        dataKey="pending"
                        stackId="donations"
                        fill={chartPalette.pending}
                        maxBarSize={36}
                      />
                      <Bar
                        name="Missed"
                        dataKey="wasted"
                        stackId="donations"
                        fill={chartPalette.wasted}
                        radius={[0, 0, 8, 8]}
                        maxBarSize={36}
                      />
                      <Line
                        type="monotone"
                        name="Total"
                        dataKey="total"
                        stroke={chartPalette.total}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: chartPalette.total }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        name="Completion %"
                        dataKey="completionRate"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="relative border-none bg-slate-900 p-6 text-white shadow-xl">
                <InfoPopover
                  className="absolute right-6 top-6"
                  title="How to read this"
                  description="Use this guide to interpret whether the platform is improving or accumulating delay. More green and less amber usually signals healthier operations."
                  tone="dark"
                />
                <h3 className="pr-10 text-base font-bold sm:text-lg">How to read this</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  A healthy pattern shows taller green sections, a shrinking amber backlog, and a steady completion line. If amber rises while the total line climbs, the team is receiving donations faster than it is resolving them.
                </p>
              </Card>

              <Card className="relative border-slate-200 p-6">
                <InfoPopover
                  className="absolute right-6 top-6"
                  title="Status Breakdown"
                  description="These bars convert the current report totals into quick proportions so admins can see where donations are getting resolved or delayed."
                />
                <h3 className="mb-4 pr-10 text-base font-bold text-slate-900 sm:text-lg">Status Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-500">Completed</span>
                      <span className="font-bold text-slate-900">{summary?.saved ?? 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${summary?.totalDonations ? (summary.saved / summary.totalDonations) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-500">Pending</span>
                      <span className="font-bold text-slate-900">{summary?.pending ?? 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-amber-500"
                        style={{ width: `${summary?.totalDonations ? (summary.pending / summary.totalDonations) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-500">Missed</span>
                      <span className="font-bold text-slate-900">{summary?.wasted ?? 0}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-red-500"
                        style={{ width: `${summary?.totalDonations ? (summary.wasted / summary.totalDonations) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      <Card className="relative overflow-hidden border-none bg-emerald-900 p-8 text-white">
        <div className="relative z-10 max-w-2xl">
          <h3 className="mb-2 text-xl font-black tracking-tight underline decoration-emerald-500 decoration-4 sm:text-2xl">
            Evidence of Impact
          </h3>
          <p className="text-sm leading-relaxed text-emerald-100">
            This report now highlights real donation flow instead of placeholder prediction data, making it easier to see where the system is succeeding and where donations are getting stuck.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminReports;
