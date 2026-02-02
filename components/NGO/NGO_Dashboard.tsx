
import React, { useMemo } from 'react';
import { User, DonationStatus } from '../../types';
import { MOCK_DONATIONS } from '../../constants';
import { Button, Card } from '../UI';

interface NGO_DashboardProps {
  user: User;
  onScanClick: () => void;
}

const NGO_Dashboard: React.FC<NGO_DashboardProps> = ({ user, onScanClick }) => {
  const rankedDonations = useMemo(() => {
    const weights = { urgency: 0.6, distance: 0.3, performance: 0.1 };
    
    return MOCK_DONATIONS
      .filter(d => d.status === DonationStatus.PENDING)
      .map(d => {
        const urgencyPart = weights.urgency * (12 / Math.max(0.5, d.expiryHours));
        const distancePart = weights.distance * (10 / Math.max(0.1, d.distanceKm));
        const performancePart = weights.performance * (user.performanceScore || 50) / 100;
        
        const priorityScore = (urgencyPart + distancePart + performancePart) * 10;
        return { ...d, priorityScore: Math.min(100, Math.round(priorityScore * 10) / 10) };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }, [user]);

  const getPriorityColor = (score: number) => {
    if (score > 80) return 'text-red-600 bg-red-50 border-red-100';
    if (score > 50) return 'text-orange-600 bg-orange-50 border-orange-100';
    return 'text-blue-600 bg-blue-50 border-blue-100';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">NGO Hub</h2>
          <p className="text-slate-500">Smart-ranked food surplus based on your profile and donation urgency</p>
        </div>
        <Button variant="secondary" onClick={onScanClick}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          Scan & Verify
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rankedDonations.map((d) => (
          <Card key={d.id} className="group relative p-6 flex flex-col h-full border-slate-200 hover:border-emerald-300 transition-all hover:shadow-md">
            <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full border shadow-sm text-xs font-bold flex flex-col items-center justify-center ${getPriorityColor(d.priorityScore)}`}>
              <span className="text-[10px] uppercase opacity-70">Priority</span>
              <span>{d.priorityScore}</span>
            </div>

            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Ranked Choice</div>
              <span className="text-xs text-slate-400 font-medium">{d.distanceKm} km away</span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">{d.foodType}</h3>
            <p className="text-sm text-slate-600 mb-4">{d.donorName}</p>
            
            <div className="space-y-3 mt-auto">
              <div className="flex justify-between text-sm py-2 border-y border-slate-100">
                <span className="text-slate-500">Quantity:</span>
                <span className="font-bold text-slate-900">{d.quantity}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-slate-100">
                <span className="text-slate-500">Time Window:</span>
                <span className={`font-bold ${d.expiryHours <= 2 ? 'text-red-600' : 'text-slate-900'}`}>
                  {d.expiryWindow} {d.expiryHours <= 2 && ' (Critical)'}
                </span>
              </div>
              <div className="pt-2 flex gap-3">
                <Button fullWidth variant="secondary" className="group-hover:scale-[1.02] transition-transform">Claim Now</Button>
                <Button variant="outline" size="sm">View Map</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-12 bg-emerald-50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 border border-emerald-100">
        <div className="flex-1 space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">Dynamic Algorithm V2.0</div>
          <h3 className="text-xl font-bold text-emerald-900">Advanced Ranking Mechanism</h3>
          <p className="text-sm text-emerald-800 leading-relaxed">
            Our priority engine analyzes <strong>real-time expiry</strong>, <strong>logistics distance</strong>, and your <strong>historical fulfillment score</strong> to show you the most impactful donations first. 
            High-score donations are flagged to prevent food waste at the source.
          </p>
          <div className="flex items-center gap-4 text-xs font-bold text-emerald-600">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Urgency Weight: 60%</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Proximity Weight: 30%</span>
          </div>
        </div>
        <div className="w-full md:w-64">
          <Card className="p-5 border-none shadow-lg bg-white">
             <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl mx-auto flex items-center justify-center text-emerald-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Your Impact Rank</div>
                  <div className="text-2xl font-black text-emerald-600">Top 12%</div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Your high pickup rate increases your visibility for urgent surplus.</p>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NGO_Dashboard;
