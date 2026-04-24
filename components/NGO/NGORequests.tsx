import React, { useEffect, useState } from 'react';
import { DonationStatus } from '../../types';
import { Button, Card, StatusBadge } from '../../components/UI';
import api from '../../api/client';
import LivePickupTracker from '../Tracking/LivePickupTracker';
import { openExternalUrl } from '../../utils/platform';

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
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingRequestId, setTrackingRequestId] = useState<number | null>(null);
  const perPage = 10;

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/ngo/requests', {
        params: { page },
      });
      setItems(res.data.data?.items || []);
      setTotal(res.data.data?.total || 0);
    } catch (err: any) {
      console.error('Failed to load requests', err);
      setError('Failed to load active requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const totalPages = Math.ceil(total / perPage);

  const openMap = (item: NGORequestItem) => {
    let url = '';

    if (item.pickupLat != null && item.pickupLng != null) {
      url = `https://www.openstreetmap.org/?mlat=${item.pickupLat}&mlon=${item.pickupLng}#map=16/${item.pickupLat}/${item.pickupLng}`;
    } else if (item.location) {
      url = `https://www.openstreetmap.org/search?query=${encodeURIComponent(item.location)}`;
    } else {
      alert('Location not available for this donation');
      return;
    }

    openExternalUrl(url);
  };

  return (
    <div className="mobile-page page-fade space-y-8">
      <div className="glass-surface rounded-[28px] p-5 sm:rounded-[32px] sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="premium-kicker">NGO requests</div>
            <h2 className="section-title mt-5 text-3xl font-black text-slate-950 sm:text-4xl">
              Pickup coordination, designed for clarity
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Track active claims, open pickup locations, launch verification, and follow live
              movement from a wider, more operationally focused workspace.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <div className="rounded-[24px] border border-white/70 bg-white/70 px-5 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Active items</div>
              <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{total}</div>
            </div>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={onScan}>
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scan QR Code
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <Card className="rounded-[32px] p-10 text-center text-slate-400">
          Loading active requests...
        </Card>
      )}

      {error && (
        <Card className="rounded-[32px] border border-rose-100 bg-rose-50 p-8 text-center text-rose-700">
          {error}
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-5">
          {items.map((item) => (
            <Card key={item.requestId} className="rounded-[32px] p-5 sm:p-6">
              <div className="grid gap-5 xl:grid-cols-[1.45fr_0.8fr_0.8fr_1fr] xl:items-center">
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] text-lg font-black ${
                      item.status === DonationStatus.PICKED_UP
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    {item.foodType.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="truncate text-lg font-black tracking-[-0.03em] text-slate-950">
                        {item.foodType}
                      </h4>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                      {item.donorName ?? 'Donor'} • {item.location ?? 'Location unavailable'}
                    </p>
                    <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Request ID {item.requestId}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-slate-50/90 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Quantity
                  </div>
                  <div className="mt-3 text-lg font-black tracking-[-0.03em] text-slate-950">
                    {item.quantity}
                  </div>
                </div>

                <div className="rounded-[24px] bg-slate-50/90 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Pickup window
                  </div>
                  <div className="mt-3 text-lg font-black tracking-[-0.03em] text-slate-950">
                    {item.expiryWindow ?? '-'}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 xl:items-end">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {item.status === DonationStatus.ALLOCATED ? 'Pending fulfillment' : 'Successfully redistributed'}
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
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
            </Card>
          ))}

          {items.length === 0 && (
            <Card className="rounded-[32px] p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="mt-5 text-base font-semibold text-slate-600">
                No active requests found.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Claimed donations will appear here once your NGO starts pickup coordination.
              </p>
            </Card>
          )}

          {items.length > 0 && (
            <div className="glass-surface mobile-pagination flex flex-col gap-4 rounded-[28px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium text-slate-500">
                Showing {items.length} of {total} requests
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

      {trackingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md">
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
