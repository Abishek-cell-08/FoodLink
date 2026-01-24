
import React from 'react';
import { MOCK_DONATIONS } from '../constants';
import { Button, Card, StatusBadge } from './UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DonationStatus } from '../types';

interface DonorOverviewProps {
  onViewAll: () => void;
  onAddClick: () => void;
}

const DonorOverview: React.FC<DonorOverviewProps> = ({ onViewAll, onAddClick }) => {
  // Summary Stats Logic
  const stats = [
    { label: 'Total Food Saved', val: '452 kg', color: 'bg-emerald-600 text-white' },
    { label: 'Impact Score', val: '9.4/10', color: 'border-slate-200' },
    { label: 'Meals Served', val: '1,800+', color: 'border-slate-200' },
    { label: 'NGOs Helped', val: '12', color: 'border-slate-200' },
    { label: 'Waste Prevented', val: '98%', color: 'border-slate-200' },
    { label: 'Active Tasks', val: '2 Pending', color: 'border-slate-200' },
  ];

  // Chart Data: Status Distribution
  const chartData = [
    { name: 'Pending', count: MOCK_DONATIONS.filter(d => d.status === DonationStatus.PENDING).length, color: '#f59e0b' },
    { name: 'Allocated', count: MOCK_DONATIONS.filter(d => d.status === DonationStatus.ALLOCATED).length, color: '#3b82f6' },
    { name: 'Picked Up', count: MOCK_DONATIONS.filter(d => d.status === DonationStatus.PICKED_UP).length, color: '#10b981' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Impact Overview</h2>
          <p className="text-slate-500 text-sm">Your contribution to SDG 12 (Responsible Consumption)</p>
        </div>
        <Button onClick={onAddClick}>+ New Donation</Button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className={`p-4 ${s.color}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider opacity-80`}>{s.label}</div>
            <div className="text-xl font-bold mt-1">{s.val}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Donation Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity Mini-list */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
            <button onClick={onViewAll} className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {MOCK_DONATIONS.slice(0, 3).map((d) => (
              <div key={d.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900 line-clamp-1">{d.foodType}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{d.quantity} • {d.expiryWindow}</div>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 italic">"Small acts, when multiplied by millions of people, can transform the world."</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DonorOverview;
