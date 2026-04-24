import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Button } from '../UI';

interface Props {
  donationId: number;
  onClose: () => void;
}

const DonorDonationQR: React.FC<Props> = ({ donationId, onClose }) => {
  const [qr, setQr] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await api.get(`/api/donor/donations/${donationId}/qr`);
        setQr(res.data.data.qrBase64 ?? null);
        setRequestId(String(res.data.data.requestId ?? ''));
      } finally {
        setLoading(false);
      }
    };

    fetchQR();
  }, [donationId]);

  const handleCopy = async () => {
    if (!requestId || !navigator?.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error('Failed to copy request id', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading QR...</div>;
  }

  return (
    <Card className="w-full max-w-lg max-h-[calc(100vh-1.5rem)] overflow-y-auto text-center sm:max-h-[calc(100vh-4rem)]">
      <div className="space-y-6 p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4 text-left">
        <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="premium-kicker">Pickup verification</div>
        <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">
          Pickup QR Code
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          Show this QR to the NGO at pickup time. If scanning is unavailable, they can verify the pickup using the manual request code below.
        </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close QR view"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-semibold leading-none text-slate-500 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.45)] transition-all hover:border-slate-300 hover:text-slate-900"
        >
          X
        </button>
      </div>

      {qr && (
        <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_18px_48px_-32px_rgba(15,23,42,0.28)]">
          <img
            src={`data:image/png;base64,${qr}`}
            alt="QR Code"
            className="mx-auto h-56 w-56"
          />
        </div>
      )}

      <div className="rounded-[28px] bg-slate-50/90 p-5 text-left">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Manual request code
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-2xl bg-white px-4 py-3 text-2xl font-black tracking-[0.08em] text-slate-950 ring-1 ring-slate-100">
            {requestId || '-'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!requestId}
          >
            {copied ? 'Copied' : 'Copy Code'}
          </Button>
        </div>
        <p className="mt-3 text-xs leading-6 text-slate-500">
          The NGO can enter this code in the manual verification field if the camera scanner does not work.
        </p>
      </div>
      </div>

      <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/95 p-4 backdrop-blur">
        <Button variant="outline" onClick={onClose} fullWidth>
          Close
        </Button>
      </div>
    </Card>
  );
};

export default DonorDonationQR;
