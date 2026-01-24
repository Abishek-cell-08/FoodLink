
import React from 'react';
import { MOCK_DONATIONS } from '../constants';
import { Button, Card, StatusBadge } from './UI';

interface DonorDashboardProps {
  onAddClick: () => void;
}

const DonorDashboard: React.FC<DonorDashboardProps> = ({ onAddClick }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Donor Dashboard</h2>
          <p className="text-slate-500">Track your contributions and live donation status</p>
        </div>
        <Button onClick={onAddClick}>+ Add Donation</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-emerald-600 text-white">
          <div className="text-emerald-100 text-sm font-medium">Total Food Contributed</div>
          <div className="text-3xl font-bold mt-1">452 kg</div>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">Top 5% Donor</span>
          </div>
        </Card>
        <Card className="p-6 border-slate-200">
          <div className="text-slate-500 text-sm font-medium">Impact Score</div>
          <div className="text-3xl font-bold mt-1 text-slate-900">9.4/10</div>
          <div className="text-emerald-600 text-xs font-bold mt-2">↑ 0.5 this month</div>
        </Card>
        <Card className="p-6 border-slate-200">
          <div className="text-slate-500 text-sm font-medium">Active Allocations</div>
          <div className="text-3xl font-bold mt-1 text-slate-900">2 Pending</div>
          <div className="text-slate-400 text-xs mt-2 italic">Next pickup: Approx 2:00 PM</div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Recent Donations</h3>
        <Card className="overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-700">Food Type</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Quantity</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Time Window</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_DONATIONS.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{d.foodType}</td>
                    <td className="px-6 py-4 text-slate-600">{d.quantity}</td>
                    <td className="px-6 py-4 text-slate-600">{d.expiryWindow}</td>
                    <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                    <td className="px-6 py-4">
                      <Button variant="outline" size="sm">View QR</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DonorDashboard;
