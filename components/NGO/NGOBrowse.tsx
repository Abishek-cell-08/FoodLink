
import React, { useState, useMemo } from 'react';
import { User, DonationStatus } from '../../types';
import { MOCK_DONATIONS } from '../../constants';
import { Button, Card, Input } from '../../components/UI';

interface NGOBrowseProps {
  user: User;
  onClaim: (id: string) => void;
}

const NGOBrowse: React.FC<NGOBrowseProps> = ({ user, onClaim }) => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'RANK' | 'DISTANCE' | 'EXPIRY'>('RANK');

  const processedDonations = useMemo(() => {
    const weights = { urgency: 0.6, distance: 0.3, performance: 0.1 };
    
    let result = MOCK_DONATIONS
      .filter(d => d.status === DonationStatus.PENDING)
      .filter(d => d.foodType.toLowerCase().includes(search.toLowerCase()))
      .map(d => {
        const priorityScore = ((weights.urgency * (12 / Math.max(0.5, d.expiryHours))) + 
                             (weights.distance * (10 / Math.max(0.1, d.distanceKm))) + 
                             (weights.performance * (user.performanceScore || 50) / 100)) * 10;
        return { ...d, priorityScore: Math.min(100, Math.round(priorityScore * 10) / 10) };
      });

    if (sort === 'RANK') result.sort((a, b) => b.priorityScore - a.priorityScore);
    if (sort === 'DISTANCE') result.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === 'EXPIRY') result.sort((a, b) => a.expiryHours - b.expiryHours);

    return result;
  }, [search, sort, user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Food Marketplace</h2>
          <p className="text-slate-500 text-sm">Discover and claim available surplus food</p>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Search food type..." 
            className="w-full md:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium outline-none"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="RANK">Sort by AI Rank</option>
            <option value="DISTANCE">Sort by Nearest</option>
            <option value="EXPIRY">Sort by Expiry</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedDonations.map((d) => (
          <Card key={d.id} className="group relative p-6 flex flex-col h-full border-slate-200 hover:border-emerald-300 transition-all hover:shadow-lg">
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm group-hover:border-emerald-500">
               {d.priorityScore}
            </div>
            
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${d.expiryHours <= 2 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {d.expiryHours <= 2 ? 'Critical' : 'Available'}
              </span>
              <span className="text-xs text-slate-400 font-medium">{d.distanceKm} km away</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">{d.foodType}</h3>
            <p className="text-xs text-slate-500 mb-6">{d.donorName} • {d.location}</p>

            <div className="space-y-3 mt-auto pt-4 border-t border-slate-50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Quantity:</span>
                <span className="font-bold text-slate-900">{d.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Expires:</span>
                <span className={`font-bold ${d.expiryHours <= 2 ? 'text-red-600' : 'text-slate-900'}`}>{d.expiryWindow}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button fullWidth onClick={() => onClaim(d.id)}>Claim Now</Button>
                <Button variant="outline" size="sm" className="px-3">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NGOBrowse;
