
import React, { useMemo } from 'react';
import { User, DonationStatus } from '../../types';
import { MOCK_DONATIONS } from '../../constants';
import { Button, Card } from '../UI';

interface NGOOverviewProps {
  user: User;
  onBrowse: () => void;
}

const NGOOverview: React.FC<NGOOverviewProps> = ({ user, onBrowse }) => {
  const recommendations = useMemo(() => {
    const weights = { urgency: 0.6, distance: 0.3, performance: 0.1 };
    return MOCK_DONATIONS
      .filter(d => d.status === DonationStatus.PENDING)
      .map(d => {
        const priorityScore = ((weights.urgency * (12 / Math.max(0.5, d.expiryHours))) + 
                             (weights.distance * (10 / Math.max(0.1, d.distanceKm))) + 
                             (weights.performance * (user.performanceScore || 50) / 100)) * 10;
        return { ...d, priorityScore: Math.min(100, Math.round(priorityScore * 10) / 10) };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 3);
  }, [user]);

  const stats = [
    { label: 'Meals Served', val: '1,240', color: 'text-emerald-600' },
    { label: 'Active Pickups', val: '4', color: 'text-indigo-600' },
    { label: 'Fulfillment Rate', val: '94%', color: 'text-blue-600' },
    { label: 'Impact Rank', val: '#12/450', color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">NGO Strategic Overview</h2>
        <p className="text-slate-500 text-sm">Decision support and system-driven recommendations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Card key={i} className="p-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</div>
            <div className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              AI-Recommended Picks
            </h3>
            <button onClick={onBrowse} className="text-xs font-bold text-emerald-600 hover:underline">Browse All Food</button>
          </div>
          
          <div className="space-y-4">
            {recommendations.map((d) => (
              <Card key={d.id} className="p-5 flex items-center gap-6 border-slate-100 hover:border-emerald-200 transition-all">
                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-3 min-w-[80px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Priority</span>
                  <span className="text-xl font-black text-emerald-600">{d.priorityScore}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">{d.foodType}</h4>
                  <p className="text-xs text-slate-500">{d.donorName} • {d.distanceKm}km away</p>
                </div>
                <div className="text-right mr-4">
                  <div className="text-xs font-bold text-red-600">{d.expiryWindow} left</div>
                  <div className="text-[10px] text-slate-400">Critical Window</div>
                </div>
                <Button variant="outline" size="sm" onClick={onBrowse}>View Details</Button>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6 bg-slate-900 text-white border-none shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="font-bold">Priority Algorithm</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Our decision engine analyzes three weighted factors to guide your redistribution efforts efficiently.
          </p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-300">1. Expiry Urgency</span>
                <span className="text-emerald-400">60%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[60%]"></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-300">2. Logistics Distance</span>
                <span className="text-indigo-400">30%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[30%]"></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-300">3. Historical Score</span>
                <span className="text-blue-400">10%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[10%]"></div>
              </div>
            </div>
          </div>
          <div className="mt-8 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-[10px] text-slate-400 italic leading-snug">
              "Explainability ensures NGOs know exactly why certain food is prioritized, improving system trust and adoption."
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NGOOverview;
