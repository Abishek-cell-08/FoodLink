import React, { useEffect, useState } from "react";
import { DonationStatus } from "../../types";
import { Button, Card, StatusBadge } from "../../components/UI";
import api from "../../api/client";
import LivePickupTracker from "../Tracking/LivePickupTracker";
import { openExternalUrl } from "../../utils/platform";

interface NGORequestItem {
  requestId: number;
  id: number;
  foodType: string;
  quantity: string;
  expiryWindow?: string;
  donorName?: string;
  location?: string;
  status: DonationStatus;
  pickupLat?: number;
  pickupLng?: number;
  trackingEnabled?: boolean;
  trackingStatus?: string | null;
}

interface NGORequestsProps {
  onScan: () => void;
}

const NGORequests: React.FC<NGORequestsProps> = ({ onScan }) => {
  const [items, setItems] = useState<NGORequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingRequestId, setTrackingRequestId] = useState<number | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/ngo/requests");
      setItems(res.data.data || []);
    } catch (err: any) {
      console.error("Failed to load requests", err);
      setError("Failed to load active requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openMap = (item: NGORequestItem) => {
    let url = "";

    if (item.pickupLat != null && item.pickupLng != null) {
      url = `https://www.openstreetmap.org/?mlat=${item.pickupLat}&mlon=${item.pickupLng}#map=16/${item.pickupLat}/${item.pickupLng}`;
    } else if (item.location) {
      url = `https://www.openstreetmap.org/search?query=${encodeURIComponent(item.location)}`;
    } else {
      alert("Location not available for this donation");
      return;
    }

    openExternalUrl(url);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Active Requests</h2>
          <p className="text-slate-500 text-sm">
            Track claimed donations and verify pickups
          </p>
        </div>
        <Button variant="secondary" onClick={onScan}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          Scan QR Code
        </Button>
      </div>

      {loading && (
        <div className="py-20 text-center text-slate-400 font-medium">
          Loading active requests...
        </div>
      )}

      {error && (
        <div className="py-10 text-center text-red-600 font-medium">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.requestId} className="p-0 overflow-hidden border-slate-200">
              <div className="grid grid-cols-1 items-center lg:grid-cols-5">
                <div className="p-6 col-span-2">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        item.status === DonationStatus.PICKED_UP
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {item.foodType.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.foodType}</h4>
                      <p className="text-xs text-slate-500">
                        {item.donorName ?? "Donor"} • {item.location ?? "Location"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/50 h-full flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Quantity
                  </div>
                  <div className="text-sm font-bold text-slate-900">{item.quantity}</div>
                </div>

                <div className="p-6 bg-slate-50/50 h-full flex flex-col justify-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Pickup Window
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {item.expiryWindow ?? "-"}
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:justify-end">
                  <StatusBadge status={item.status} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMap(item)}
                    >
                      Location
                    </Button>

                    {item.status === DonationStatus.ALLOCATED && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={onScan}
                      >
                        Scan QR
                      </Button>
                    )}
                    {item.trackingEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-200 text-emerald-700"
                        onClick={() => setTrackingRequestId(item.requestId)}
                      >
                        Live Track
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.status === DonationStatus.PICKED_UP
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    {item.status === DonationStatus.ALLOCATED
                      ? "Pending Fulfillment"
                      : "Successfully Redistributed"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Request ID: {item.requestId}
                </span>
              </div>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-300">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-slate-500 font-medium">
                  No active requests found.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {trackingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <LivePickupTracker
            role="NGO"
            requestId={trackingRequestId}
            onClose={() => setTrackingRequestId(null)}
          />
        </div>
      )}
    </div>
  );
};

export default NGORequests;
