import React, { useEffect, useState } from "react";
import { Button, Card, Input } from "../UI";
import api from "../../api/client";

interface NGO {
  id: number;
  name: string;
  area: string;
  capacity: string;
  rate: string;
  status: "VERIFIED" | "PENDING";
  response: string;
}

const AdminNGOManagement: React.FC = () => {
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNGOs = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/admin/ngos", {
        params: {
          search,
          status: status || undefined,
        },
      });

      const list = res.data?.data;
      setNgos(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load NGOs", err);
      setError("Failed to load NGOs");
      setNgos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNGOs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const handleVerify = async (id: number) => {
    try {
      await api.post(`/api/admin/ngos/${id}/verify`);
      await fetchNGOs();

      if (selectedNGO?.id === id) {
        setSelectedNGO({ ...selectedNGO, status: "VERIFIED" });
      }
    } catch (err) {
      console.error("Failed to verify NGO", err);
      alert("Failed to verify NGO");
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      await api.post(`/api/admin/ngos/${id}/suspend`);
      await fetchNGOs();

      if (selectedNGO?.id === id) {
        setSelectedNGO({ ...selectedNGO, status: "PENDING" });
      }
    } catch (err) {
      console.error("Failed to suspend NGO", err);
      alert("Failed to suspend NGO");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Partner Governance</h2>
          <p className="text-slate-500 text-sm">
            Verify and audit NGO performance across the network
          </p>
        </div>
        <Button size="sm">+ Onboard NGO</Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* NGO List */}
        <Card className="lg:col-span-3 overflow-hidden border-slate-200">
          <div className="p-4 border-b border-slate-100 flex gap-4">
            <Input
              placeholder="Search NGOs by name or area..."
              className="text-xs h-9"
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
            />
            <select
              className="border border-slate-300 rounded-lg px-3 text-xs font-bold outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
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
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                ) : ngos.length > 0 ? (
                  ngos.map((ngo) => (
                    <tr
                      key={ngo.id}
                      onClick={() => setSelectedNGO(ngo)}
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${
                        selectedNGO?.id === ngo.id ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {ngo.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{ngo.area}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{ngo.rate}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            ngo.status === "VERIFIED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ngo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" className="h-8">
                          Audit
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No NGOs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Details Panel */}
        <div className="space-y-4">
          <Card className="p-6 border-slate-200 min-h-[400px]">
            {selectedNGO ? (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900">{selectedNGO.name}</h4>
                  <p className="text-xs text-slate-500">
                    {selectedNGO.area} Hub
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Daily Capacity
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {selectedNGO.capacity}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Avg Response
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {selectedNGO.response}
                    </div>
                  </div>
                </div>

                <div className="pt-6 space-y-2">
                  {selectedNGO.status === "PENDING" ? (
                    <Button fullWidth onClick={() => handleVerify(selectedNGO.id)}>
                      Verify Now
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="danger"
                      className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                      onClick={() => handleSuspend(selectedNGO.id)}
                    >
                      Suspend Access
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Select an NGO to view details
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminNGOManagement;
