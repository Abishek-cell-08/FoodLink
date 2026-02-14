import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { Button, Card, StatusBadge } from "../../components/UI";

interface Donation {
  id: number;
  foodType: string;
  quantity: string;
  expiryWindow: string;
  status: string;
}

const DonorDashboard: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => {
  const [loading, setLoading] = useState(true);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [activeAllocations, setActiveAllocations] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/api/donor/dashboard");
        setRecentDonations(res.data.data.recentDonations);
        setActiveAllocations(res.data.data.activeAllocations);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

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
          <div className="text-emerald-100 text-sm font-medium">Active Allocations</div>
          <div className="text-3xl font-bold mt-1">{activeAllocations}</div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDonations.map((d) => (
                  <tr key={d.id}>
                    <td className="px-6 py-4 font-semibold">{d.foodType}</td>
                    <td className="px-6 py-4">{d.quantity}</td>
                    <td className="px-6 py-4">{d.expiryWindow}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.status as any} />
                    </td>
                  </tr>
                ))}
                {recentDonations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center p-6 text-slate-400">
                      No donations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DonorDashboard;
