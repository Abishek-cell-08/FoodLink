import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../../api/client";
import { Button, Card, Input } from "../../components/UI";

interface NGOScanQRProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const NGOScanQR: React.FC<NGOScanQRProps> = ({ onSuccess, onCancel }) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualRequestId, setManualRequestId] = useState("");

  const verifyPickup = async (requestId: string) => {
    try {
      await api.post(`/api/ngo/verify/${requestId}`);
      alert("Pickup verified successfully!");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Verification failed");
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    try {
      scanner.render(
        async (decodedText) => {
          if (!decodedText.startsWith("REQUEST:")) {
            alert("Invalid QR code");
            return;
          }

          const requestId = decodedText.replace("REQUEST:", "").trim();
          await scanner.clear();
          await verifyPickup(requestId);
        },
        () => {
          return;
        }
      );
    } catch (error) {
      console.error("Failed to start QR scanner", error);
      setScannerError("Camera scanner is unavailable on this device. Use manual verification below.");
    }

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Card className="p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900 sm:text-xl">Scan Pickup QR</h2>

        <div id="qr-reader" className="w-full" />

        {scannerError && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            {scannerError}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <Input
            label="Manual Request ID"
            placeholder="Enter request id"
            value={manualRequestId}
            onChange={(e: any) => setManualRequestId(e.target.value)}
          />
          <Button
            fullWidth
            onClick={() => verifyPickup(manualRequestId.trim())}
            disabled={!manualRequestId.trim()}
          >
            Verify Manually
          </Button>
        </div>

        <div className="mt-4">
          <Button variant="outline" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NGOScanQR;
