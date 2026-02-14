import React, { useState, useEffect } from "react";
import api from "../../api/client";
import { Button, Card, StatusBadge, Input } from "../UI";
import { DonationStatus } from "../../types";

interface Donation {
  id: number;
  foodType: string;
  quantity: string;
  expiryWindow: string;
  distanceKm?: number;
  status: DonationStatus;
  createdAt: string;
}

interface DonorDonationsProps {
  onAddClick: () => void;
}

const DonorDonations: React.FC<DonorDonationsProps> = ({ onAddClick }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DonationStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Donation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const perPage = 10;

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/donor/donations", {
        params: {
          search,
          status: filter,
          page,
        },
      });

      setItems(res.data.data.items || []);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      console.error("Failed to load donations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, page]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Donations</h2>
          <p className="text-slate-500 text-sm">
            Manage and track your active surplus listings
          </p>
        </div>
        <Button onClick={onAddClick}>+ New Donation</Button>
      </div>

      {/* Filter Header */}
      <Card className="p-4 flex flex-col md:flex-row items-center gap-4 bg-slate-50 border-slate-200">
        <div className="w-full md:w-72">
          <Input
            placeholder="Search food type..."
            value={search}
            onChange={(e: any) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="bg-white"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {(["ALL", ...Object.values(DonationStatus)] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setPage(1);
                setFilter(s);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                filter === s
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </Card>

      {/* Full Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Food Type</th>
                <th className="px-6 py-4 font-bold text-slate-700">Quantity</th>
                <th className="px-6 py-4 font-bold text-slate-700">Expiry</th>
                <th className="px-6 py-4 font-bold text-slate-700">Distance</th>
                <th className="px-6 py-4 font-bold text-slate-700">Status</th>
                <th className="px-6 py-4 font-bold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Loading...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {d.foodType}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{d.quantity}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-medium">
                          {d.expiryWindow}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Listed: {new Date(d.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {d.distanceKm ?? "-"} km
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8">
                          Details
                        </Button>
                        {d.status !== DonationStatus.PICKED_UP && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-emerald-200 text-emerald-600"
                          >
                            View QR
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No donations found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-between items-center px-2">
        <div className="text-xs text-slate-500 font-medium">
          Showing {items.length} of {total} entries
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DonorDonations;
