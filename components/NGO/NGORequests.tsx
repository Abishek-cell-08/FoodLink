
import React from 'react';
import { DonationStatus } from '../../types';
import { MOCK_DONATIONS } from '../../constants';
// Update the import path below to the correct location of your UI components.
// For example, if they are in '../../components/UI', use that path:
import { Button, Card, StatusBadge } from '../../components/UI';

interface NGORequestsProps {
  onScan: () => void;
}

const NGORequests: React.FC<NGORequestsProps> = ({ onScan }) => {
  const activeRequests = MOCK_DONATIONS.filter(d => 
    d.status === DonationStatus.ALLOCATED || d.status === DonationStatus.PICKED_UP
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Active Requests</h2>
          <p className="text-slate-500 text-sm">Track claimed donations and verify pickups</p>
        </div>
        <Button variant="secondary" onClick={onScan}>
           <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
           Scan QR Code
        </Button>
      </div>

      <div className="space-y-4">
        {activeRequests.map((d) => (
          <Card key={d.id} className="p-0 overflow-hidden border-slate-200">
            <div className="grid grid-cols-1 lg:grid-cols-5 items-center">
              <div className="p-6 col-span-2">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${d.status === DonationStatus.PICKED_UP ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                    {d.foodType.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{d.foodType}</h4>
                    <p className="text-xs text-slate-500">{d.donorName} • {d.location}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50/50 h-full flex flex-col justify-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity</div>
                <div className="text-sm font-bold text-slate-900">{d.quantity}</div>
              </div>

              <div className="p-6 bg-slate-50/50 h-full flex flex-col justify-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pickup Window</div>
                <div className="text-sm font-bold text-slate-900">{d.expiryWindow}</div>
              </div>

              <div className="p-6 flex items-center justify-between lg:justify-end gap-6">
                <StatusBadge status={d.status} />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-9">Location</Button>
                  {d.status === DonationStatus.ALLOCATED && (
                    <Button variant="secondary" size="sm" className="h-9" onClick={onScan}>Scan QR</Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${d.status === DonationStatus.PICKED_UP ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                   {d.status === DonationStatus.ALLOCATED ? 'Pending Fulfillment' : 'Successfully Redistributed'}
                 </span>
               </div>
               <span className="text-[10px] text-slate-400 font-medium">Request ID: {d.id}</span>
            </div>
          </Card>
        ))}

        {activeRequests.length === 0 && (
          <div className="py-20 text-center space-y-4">
             <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-300">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             </div>
             <div>
               <p className="text-slate-500 font-medium">No active requests found.</p>
               <button onClick={() => {}} className="text-sm font-bold text-emerald-600 hover:underline">Explore the Marketplace</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGORequests;
