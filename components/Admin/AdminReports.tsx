
import React from 'react';
import { Button, Card } from '../UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';

const AdminReports: React.FC = () => {
  const data = [
    { name: 'Week 1', saved: 400, wasted: 240, predicted: 420 },
    { name: 'Week 2', saved: 300, wasted: 139, predicted: 350 },
    { name: 'Week 3', saved: 500, wasted: 98, predicted: 480 },
    { name: 'Week 4', saved: 600, wasted: 80, predicted: 590 },
    { name: 'Week 5', saved: 750, wasted: 45, predicted: 720 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Impact & Evidence</h2>
          <p className="text-slate-500 text-sm">Historical performance data and predictive accuracy tracking</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">CSV Export</Button>
          <Button size="sm">Download PDF Report</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-slate-50 border-slate-200 flex flex-wrap gap-4">
         <select className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>All Time</option>
         </select>
         <select className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
            <option>All Sectors</option>
            <option>Downtown</option>
            <option>East Wing</option>
         </select>
         <select className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
            <option>All Food Types</option>
            <option>Cooked Meals</option>
            <option>Groceries</option>
         </select>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Prediction vs Actual Surplus</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip />
                <Legend iconType="circle" />
                <Area type="monotone" name="Actual Saved" dataKey="saved" stroke="#10b981" fillOpacity={1} fill="url(#colorSaved)" strokeWidth={3} />
                <Area type="monotone" name="AI Predicted" dataKey="predicted" stroke="#6366f1" fillOpacity={0} strokeDasharray="5 5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Waste Reduction Efficiency</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip />
                <Legend iconType="circle" />
                <Bar name="Saved (kg)" dataKey="saved" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Wasted (kg)" dataKey="wasted" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-8 bg-emerald-900 text-white border-none relative overflow-hidden">
         <div className="relative z-10 max-w-2xl">
            <h3 className="text-2xl font-black mb-2 tracking-tight underline decoration-emerald-500 decoration-4">Evidence of Impact</h3>
            <p className="text-emerald-100 text-sm leading-relaxed">
              WasteFoodLink has successfully reduced per-capita food waste in the pilot sector by <strong>34.2%</strong> over the last 6 months. 
              The intelligent prioritization algorithm has improved average food distribution speed by <strong>18 minutes</strong>, preventing spoilage of critical cooked meals.
            </p>
         </div>
         <div className="absolute top-0 right-0 w-64 h-full opacity-10 flex items-center justify-center transform translate-x-12 translate-y-4">
            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"/></svg>
         </div>
      </Card>
    </div>
  );
};

export default AdminReports;
