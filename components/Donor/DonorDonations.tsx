import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { Button, Card, Input, StatusBadge } from "../UI";
import { DonationStatus } from "../../types";
import DonorDonationDetails from "./DonorDonationDetails";
import DonorDonationQR from "./DonorDonationQR";
import LivePickupTracker from "../Tracking/LivePickupTracker";
import { isNativeAppShell } from "../../utils/platform";

interface Donation {
  id: number;
  foodType: string;
  quantity: string;
  status: DonationStatus;
  createdAt: string;
  expiresAt: string;
  distanceKm?: number;
}

interface DonorDonationsProps {
  onAddClick: () => void;
}

type SortOrder = "recent" | "old";
type DateRange = "7D" | "30D" | "ALL";

const DonorDonations: React.FC<DonorDonationsProps> = ({ onAddClick }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DonationStatus | "ALL">("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [dateRange, setDateRange] = useState<DateRange>("ALL");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Donation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDetailsId, setShowDetailsId] = useState<number | null>(null);
  const [showQrId, setShowQrId] = useState<number | null>(null);
  const [showTrackingId, setShowTrackingId] = useState<number | null>(null);

  const perPage = 10;
  const useMobileCards = isNativeAppShell();

  const parseUTC = (iso: string) => new Date(iso + "Z");

  const formatTimeLeft = (expiresAt: string) => {
    if (!expiresAt) {
      return { text: "-", isCritical: false, isExpired: false };
    }

    const nowMs = Date.now();
    const expMs = parseUTC(expiresAt).getTime();
    const diffMs = expMs - nowMs;

    if (diffMs <= 0) {
      return { text: "Expired", isCritical: false, isExpired: true };
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const text = hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;

    return { text, isCritical: totalMinutes <= 60, isExpired: false };
  };

  const formatPostedTime = (createdAt: string) => {
    if (!createdAt) return "-";

    return parseUTC(createdAt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchDonations = async () => {
    setLoading(true);

    try {
      const res = await api.get("/api/donor/donations", {
        params: {
          search,
          status: filter,
          sort: sortOrder,
          range: dateRange,
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
  }, [search, filter, sortOrder, dateRange, page]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">My Donations</h2>
          <p className="text-slate-500 text-sm">
            Manage and track your active surplus listings
          </p>
        </div>
        <Button size="sm" onClick={onAddClick}>New Donation</Button>
      </div>

      <Card className="flex flex-col gap-4 border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center">
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
          {(["ALL", ...Object.values(DonationStatus)] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setPage(1);
                setFilter(status);
              }}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] whitespace-nowrap transition-all ${
                filter === status
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 md:ml-auto">
          <div className="flex rounded-full border border-slate-200 bg-white p-1">
            {([
              { value: "recent", label: "Recent" },
              { value: "old", label: "Old" },
            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setPage(1);
                  setSortOrder(option.value);
                }}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] transition-all ${
                  sortOrder === option.value
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {([
              { value: "7D", label: "7D" },
              { value: "30D", label: "30D" },
              { value: "ALL", label: "All Time" },
            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setPage(1);
                  setDateRange(option.value);
                }}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] whitespace-nowrap transition-all ${
                  dateRange === option.value
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {useMobileCards ? (
        <div className="space-y-4">
          {loading ? (
            <Card className="p-6 text-center text-slate-400">Loading...</Card>
          ) : items.length > 0 ? (
            items.map((donation) => {
              const { text, isCritical, isExpired } = formatTimeLeft(
                donation.expiresAt
              );

              return (
                <Card
                  key={donation.id}
                  className="overflow-hidden border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        {donation.foodType}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {donation.quantity}
                      </div>
                    </div>
                    <StatusBadge status={donation.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-sm">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Expiry
                      </div>
                      <div
                        className={`mt-1 font-semibold ${
                          isExpired
                            ? "text-red-600"
                            : isCritical
                              ? "text-amber-600"
                              : "text-slate-900"
                        }`}
                      >
                        {text}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Date
                      </div>
                      <div className="mt-1 font-medium text-slate-600">
                        {formatPostedTime(donation.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowDetailsId(donation.id)}
                    >
                      Details
                    </Button>

                    {donation.status === DonationStatus.ALLOCATED ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-emerald-200 text-emerald-600"
                          onClick={() => setShowQrId(donation.id)}
                        >
                          View QR
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-indigo-200 text-indigo-600"
                          onClick={() => setShowTrackingId(donation.id)}
                        >
                          Live Track
                        </Button>
                      </>
                    ) : (
                      <div className="text-xs font-medium text-slate-400">
                        Waiting for NGO
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-6 text-center text-slate-400">
              No donations found matching your search criteria.
            </Card>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-700">Food Type</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Quantity</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Expiry</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Date</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Status</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400 font-medium"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((donation) => {
                    const { text, isCritical, isExpired } = formatTimeLeft(
                      donation.expiresAt
                    );

                    return (
                      <tr
                        key={donation.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {donation.foodType}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {donation.quantity}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span
                              className={`font-medium ${
                                isExpired
                                  ? "text-red-600"
                                  : isCritical
                                    ? "text-amber-600"
                                    : "text-slate-900"
                              }`}
                            >
                              {text}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Listed: {formatPostedTime(donation.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatPostedTime(donation.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={donation.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => setShowDetailsId(donation.id)}
                            >
                              Details
                            </Button>
                            {donation.status === DonationStatus.ALLOCATED ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-emerald-200 text-emerald-600"
                                  onClick={() => setShowQrId(donation.id)}
                                >
                                  View QR
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 border-indigo-200 text-indigo-600"
                                  onClick={() => setShowTrackingId(donation.id)}
                                >
                                  Live Track
                                </Button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">
                                Waiting for NGO
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400 font-medium"
                    >
                      No donations found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500 font-medium">
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

      {showDetailsId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <DonorDonationDetails
            donationId={showDetailsId}
            onClose={() => setShowDetailsId(null)}
          />
        </div>
      )}

      {showQrId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <DonorDonationQR
            donationId={showQrId}
            onClose={() => setShowQrId(null)}
          />
        </div>
      )}

      {showTrackingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <LivePickupTracker
            role="DONOR"
            donationId={showTrackingId}
            onClose={() => setShowTrackingId(null)}
          />
        </div>
      )}
    </div>
  );
};

export default DonorDonations;
