
import React, { useState } from 'react';
import { Button, Card, StatusBadge, Input } from '../UI';

const AdminNGOManagement: React.FC = () => {
  const [selectedNGO, setSelectedNGO] = useState<any>(null);

  const ngos = [
    { id: 'ngo-1', name: 'Help Hands Foundation', area: 'Downtown', capacity: '50kg/day', rate: '94%', status: 'VERIFIED', response: '12m' },
    { id: 'ngo-2', name: 'Food For All', area: 'West Side', capacity: '30kg/day', rate: '78%', status: 'VERIFIED', response: '28m' },
    { id: 'ngo-3', name: 'Community Kitchen', area: 'East Wing', capacity: '100kg/day', rate: '62%', status: 'PENDING', response: 'N/A' },
    { id: 'ngo-4', name: 'Green Plate NGO', area: 'Suburban', capacity: '20kg/day', rate: '45%', status: 'SUSPENDED', response: '1h+' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Partner Governance</h2>
          <p className="text-slate-500 text-sm">Verify and audit NGO performance across the network</p>
        </div>
        <Button size="sm">+ Onboard NGO</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* NGO List Table */}
        <Card className="lg:col-span-3 overflow-hidden border-slate-200">
          <div className="p-4 border-b border-slate-100 flex gap-4">
             <Input placeholder="Search NGOs by name or area..." className="text-xs h-9" />
             <select className="border border-slate-300 rounded-lg px-3 text-xs font-bold outline-none">
                <option>All Status</option>
                <option>Verified</option>
                <option>Pending</option>
             </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-700">NGO Name</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Area</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Fulfillment</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ngos.map((ngo) => (
                  <tr 
                    key={ngo.id} 
                    onClick={() => setSelectedNGO(ngo)}
                    className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedNGO?.id === ngo.id ? 'bg-emerald-50/30' : ''}`}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">{ngo.name}</td>
                    <td className="px-6 py-4 text-slate-500">{ngo.area}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{ngo.rate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                        ngo.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 
                        ngo.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {ngo.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Button variant="outline" size="sm" className="h-8">Audit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Audit Details Panel */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Performance Insight</h3>
          <Card className="p-6 border-slate-200 min-h-[400px]">
            {selectedNGO ? (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                 <div className="space-y-1">
                    <h4 className="font-bold text-slate-900">{selectedNGO.name}</h4>
                    <p className="text-xs text-slate-500">{selectedNGO.area} Hub</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase">Daily Capacity</div>
                       <div className="text-sm font-bold text-slate-900">{selectedNGO.capacity}</div>
                    </div>
                    <div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Response</div>
                       <div className="text-sm font-bold text-slate-900">{selectedNGO.response}</div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Trust Level</div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500" style={{ width: selectedNGO.rate }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">This NGO is ranked top 10% for redistribution accuracy in Western sectors.</p>
                 </div>

                 <div className="pt-8 space-y-2">
                    {selectedNGO.status === 'PENDING' ? (
                      <Button fullWidth>Verify Now</Button>
                    ) : (
                      <>
                        <Button fullWidth variant="outline">View Full History</Button>
                        <Button fullWidth variant="danger" className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100">Suspend Access</Button>
                      </>
                    )}
                 </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4 opacity-40">
                 <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-400"></div>
                 <p className="text-xs font-medium text-slate-500">Select an NGO to view detailed performance metrics and management controls.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminNGOManagement;
