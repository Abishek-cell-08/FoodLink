import React, { useEffect, useState } from "react";
import { Button, Card, Input } from "../../components/UI";
import { DonationStatus, User } from "../../types";
import api from "../../api/client";
import { openExternalUrl } from "../../utils/platform";

interface Donation {
  id: number;
  foodType: string;
  quantity: string;
  status: DonationStatus;
  createdAt: string;
  expiresAt: string;
  distanceKm?: number;
  donorName?: string;
  location?: string;
  priorityScore?: number;
  priorityTier?: string;
  decisionSignals?: string[];
  pickupLat?: number;
  pickupLng?: number;
}

interface NGOBrowseProps {
  user: User;
  onClaim?: () => void;
}

const NGOBrowse: React.FC<NGOBrowseProps> = ({ user, onClaim }) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"RANK" | "DISTANCE" | "EXPIRY">("RANK");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const perPage = 10;

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

  const fetchDonations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/ngo/browse", {
        params: { search, sort, page },
      });
      setItems(res.data.data?.items || []);
      setTotal(res.data.data?.total || 0);
    } catch (err: any) {
      console.error("Failed to load marketplace", err);
      setError("Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [search, sort, page]);

  const handleClaim = async (id: number) => {
    try {
      await api.post(`/api/ngo/claim/${id}`);
      alert("Donation claimed successfully!");
      setPage(1);
      fetchDonations();
      onClaim?.();
    } catch (err: any) {
      console.error("Failed to claim donation", err);
      alert(err.response?.data?.message || "Failed to claim donation");
    }
  };

  const totalPages = Math.ceil(total / perPage);

  const openMap = (donation: Donation) => {
    let url = "";

    if (donation.pickupLat != null && donation.pickupLng != null) {
      url = `https://www.openstreetmap.org/?mlat=${donation.pickupLat}&mlon=${donation.pickupLng}#map=16/${donation.pickupLat}/${donation.pickupLng}`;
    } else if (donation.location) {
      const query = encodeURIComponent(donation.location);
      url = `https://www.openstreetmap.org/search?query=${query}`;
    } else {
      alert("Location not available for this donation");
      return;
    }

    openExternalUrl(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Food Marketplace</h2>
          <p className="text-sm text-slate-500">
            Discover and claim surplus food ranked by strategic pickup value
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search food type..."
            className="w-full md:w-64"
            value={search}
            onChange={(e: any) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium outline-none"
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value as "RANK" | "DISTANCE" | "EXPIRY");
            }}
          >
            <option value="RANK">Sort by AI Rank</option>
            <option value="DISTANCE">Sort by Nearest</option>
            <option value="EXPIRY">Sort by Expiry</option>
          </select>
        </div>
      </div>

      {loading && <div className="py-20 text-center font-medium text-slate-400">Loading marketplace...</div>}

      {error && <div className="py-10 text-center font-medium text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((donation) => {
            const remaining = formatTimeLeft(donation.expiresAt);
            const totalMinutes = Math.floor(getRemainingMs(donation.expiresAt) / 60000);

            return (
              <Card
                key={donation.id}
                className="group relative flex h-full flex-col border-slate-200 p-4 transition-all hover:border-emerald-300 hover:shadow-lg sm:p-5"
              >
                <div className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] font-black shadow-sm group-hover:border-emerald-500">
                  {donation.priorityScore ?? "-"}
                </div>

                <div className="mb-4 flex items-start justify-between gap-3 pr-9">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      totalMinutes <= 120 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {totalMinutes <= 120 ? "Critical" : "Available"}
                  </span>
                  <span className="break-words text-xs font-medium text-slate-400">
                    {donation.distanceKm != null ? `${donation.distanceKm.toFixed(1)} km away` : "Unknown distance"}
                  </span>
                </div>

                {donation.priorityTier && (
                  <div className="mb-3 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    {donation.priorityTier} priority
                  </div>
                )}

                <h3 className="mb-1 break-words pr-4 text-base font-bold text-slate-900 sm:text-lg">{donation.foodType}</h3>
                <p className="mb-4 break-words text-xs text-slate-500">{donation.donorName ?? "Donor"} • {donation.location ?? "Location"}</p>

                {donation.decisionSignals && donation.decisionSignals.length > 0 && (
                  <div className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {donation.decisionSignals.slice(0, 2).join(" • ")}
                  </div>
                )}

                <div className="mt-auto space-y-3 border-t border-slate-50 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-400">Quantity:</span>
                    <span className="font-bold text-slate-900">{donation.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-400">Expires:</span>
                    <span
                      className={`font-bold ${
                        remaining === "Expired" || totalMinutes <= 120 ? "text-red-600" : "text-slate-900"
                      }`}
                    >
                      {remaining}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button fullWidth size="sm" onClick={() => handleClaim(donation.id)}>
                      Claim Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3"
                      onClick={() => openMap(donation)}
                      title="Open in map"
                    >
                      Map
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          </div>

          {items.length > 0 && (
            <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-medium text-slate-500">
                Showing {items.length} of {total} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NGOBrowse;
