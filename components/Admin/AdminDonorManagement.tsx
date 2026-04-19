import React, { useEffect, useState } from "react";
import { Card, Input } from "../UI";
import api from "../../api/client";

interface DonorItem {
  id: number;
  name: string;
  email: string;
  location: string;
  totalDonations: number;
}

const AdminDonorManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const [donors, setDonors] = useState<DonorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/admin/donors", {
        params: {
          search: search || undefined,
        },
      });

      setDonors(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error("Failed to load donors", err);
      setError("Failed to load donors");
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [search]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Donor Directory</h2>
        <p className="text-sm text-slate-500">
          View all donor accounts and their contribution footprint
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card className="border-slate-200 p-4">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search donors by name, email, or location..."
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
            className="bg-white"
          />
        </div>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Donor Name</th>
                <th className="px-6 py-4 font-bold text-slate-700">Email</th>
                <th className="px-6 py-4 font-bold text-slate-700">Location</th>
                <th className="px-6 py-4 font-bold text-slate-700">Total Donations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center font-medium text-slate-400">
                    Loading donors...
                  </td>
                </tr>
              ) : donors.length > 0 ? (
                donors.map((donor) => (
                  <tr key={donor.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-semibold text-slate-900">{donor.name}</td>
                    <td className="px-6 py-4 text-slate-600">{donor.email}</td>
                    <td className="px-6 py-4 text-slate-500">{donor.location}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{donor.totalDonations}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center font-medium text-slate-400">
                    No donors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminDonorManagement;
