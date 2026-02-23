import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { Card, Button } from "../UI";

interface Props {
  donationId: number;
  onClose: () => void;
}

const DonorDonationQR: React.FC<Props> = ({ donationId, onClose }) => {
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQR = async () => {
      const res = await api.get(`/api/donor/donations/${donationId}/qr`);
      setQr(res.data.data.qrBase64);
      setLoading(false);
    };
    fetchQR();
  }, [donationId]);

  if (loading) return <div className="p-6">Loading QR...</div>;

  return (
    <Card className="p-6 text-center space-y-4">
      <h3 className="text-lg font-bold">Pickup QR Code</h3>

      {qr && (
        <img
          src={`data:image/png;base64,${qr}`}
          alt="QR Code"
          className="mx-auto w-48 h-48"
        />
      )}

      <p className="text-xs text-slate-500">
        Show this QR to the NGO at pickup time
      </p>

      <Button variant="outline" onClick={onClose}>Close</Button>
    </Card>
  );
};

export default DonorDonationQR;
