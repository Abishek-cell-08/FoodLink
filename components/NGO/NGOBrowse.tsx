import React, { useState, useEffect, useMemo } from "react";
import { User, DonationStatus } from "../../types";
import { Button, Card, Input } from "../../components/UI";
import api from "../../api/client";

interface Donation {
  id: number;
  foodType: string;
  quantity: string;
  status: DonationStatus;
  createdAt: string;   // ISO from backend
  expiresAt: string;   // ISO from backend
  distanceKm?: number;
  donorName?: string;
  location?: string;
  priorityScore?: number;
  pickupLat?: number;
  pickupLng?: number;
}

interface NGOBrowseProps {
  user: User;
}

const NGOBrowse: React.FC<NGOBrowseProps> = ({ user }) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"RANK" | "DISTANCE" | "EXPIRY">("RANK");
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------- Time Helpers --------
  const parseUTC = (iso: string) => new Date(iso + "Z");

  const getRemainingMs = (expiresAt: string) => {
    const nowMs = Date.now();
    const expMs = parseUTC(expiresAt).getTime();
    return expMs - nowMs;
  };

  const formatTimeLeft = (expiresAt: string) => {
    if (!expiresAt) return "-";

    const diffMs = getRemainingMs(expiresAt);
    if (diffMs <= 0) return "Expired";

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
  };

  // -------- API --------
  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/ngo/browse", {
        params: { search },
      });
      setItems(res.data.data || []);
    } catch (err: any) {
      console.error("Failed to load marketplace", err);
      setError("Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const processedDonations = useMemo(() => {
    let result = [...items];

    if (sort === "RANK") {
      result.sort(
        (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0)
      );
    }

    if (sort === "DISTANCE") {
      result.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
    }

    if (sort === "EXPIRY") {
      result.sort(
        (a, b) => getRemainingMs(a.expiresAt) - getRemainingMs(b.expiresAt)
      );
    }

    return result;
  }, [items, sort]);

  const handleClaim = async (id: number) => {
    try {
      await api.post(`/api/ngo/claim/${id}`);
      alert("Donation claimed successfully!");
      fetchDonations();
    } catch (err: any) {
      console.error("Failed to claim donation", err);
      alert(err.response?.data?.message || "Failed to claim donation");
    }
  };

  // -------- Map Handler (OpenStreetMap - Free) --------
  const openMap = (d: Donation) => {
    let url = "";

    if (d.pickupLat != null && d.pickupLng != null) {
      url = `https://www.openstreetmap.org/?mlat=${d.pickupLat}&mlon=${d.pickupLng}#map=16/${d.pickupLat}/${d.pickupLng}`;
    } else if (d.location) {
      const q = encodeURIComponent(d.location);
      url = `https://www.openstreetmap.org/search?query=${q}`;
    } else {
      alert("Location not available for this donation");
      return;
    }

    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Food Marketplace</h2>
          <p className="text-slate-500 text-sm">
            Discover and claim available surplus food
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search food type..."
            className="w-full md:w-64"
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
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

      {loading && (
        <div className="text-center py-20 text-slate-400 font-medium">
          Loading marketplace...
        </div>
      )}

      {error && (
        <div className="text-center py-10 text-red-600 font-medium">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedDonations.map((d) => {
            const remaining = formatTimeLeft(d.expiresAt);
            const diffMs = getRemainingMs(d.expiresAt);
            const totalMinutes = Math.floor(diffMs / 60000);

            return (
              <Card
                key={d.id}
                className="group relative p-6 flex flex-col h-full border-slate-200 hover:border-emerald-300 transition-all hover:shadow-lg"
              >
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm group-hover:border-emerald-500">
                  {d.priorityScore ?? "-"}
                </div>

                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      totalMinutes <= 120
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {totalMinutes <= 120 ? "Critical" : "Available"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {d.distanceKm != null
                      ? `${d.distanceKm.toFixed(1)} km away`
                      : "Unknown distance"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {d.foodType}
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  {d.donorName ?? "Donor"} • {d.location ?? "Location"}
                </p>

                <div className="space-y-3 mt-auto pt-4 border-t border-slate-50">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Quantity:</span>
                    <span className="font-bold text-slate-900">
                      {d.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">Expires:</span>
                    <span
                      className={`font-bold ${
                        remaining === "Expired" || totalMinutes <= 120
                          ? "text-red-600"
                          : "text-slate-900"
                      }`}
                    >
                      {remaining}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button fullWidth onClick={() => handleClaim(d.id)}>
                      Claim Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3"
                      onClick={() => openMap(d)}
                      title="Open in map"
                    >
                      📍
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NGOBrowse;