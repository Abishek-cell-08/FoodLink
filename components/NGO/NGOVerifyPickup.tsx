import React, { useState } from "react";
import api from "../../api/client";
import { Button, Card, Input } from "../UI";

interface NGOVerifyPickupProps {
  onBack: () => void;
}

const NGOVerifyPickup: React.FC<NGOVerifyPickupProps> = ({ onBack }) => {
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!requestId) {
      setError("Please enter Request ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      await api.post(`/api/ngo/verify/${requestId}`);

      setMessage("✅ Pickup verified successfully!");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Verify Pickup</h2>
        <p className="text-sm text-slate-500 mb-6">
          Scan QR or enter the Request ID provided by the donor.
        </p>

        <Input
          label="Request ID"
          placeholder="e.g. 12"
          value={requestId}
          onChange={(e: any) => setRequestId(e.target.value)}
        />

        {error && <div className="text-sm text-red-600 mt-3">{error}</div>}
        {message && <div className="text-sm text-emerald-600 mt-3">{message}</div>}

        <div className="flex gap-3 mt-6">
          <Button onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify Pickup"}
          </Button>
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NGOVerifyPickup;
