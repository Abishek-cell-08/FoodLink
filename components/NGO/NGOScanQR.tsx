import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../../api/client";
import { Button, Card } from "../../components/UI";

interface NGOScanQRProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const NGOScanQR: React.FC<NGOScanQRProps> = ({ onSuccess, onCancel }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      async (decodedText) => {
        console.log("Scanned:", decodedText);

        // Expecting: REQUEST:12
        if (!decodedText.startsWith("REQUEST:")) {
          alert("Invalid QR code");
          return;
        }

        const requestId = decodedText.replace("REQUEST:", "").trim();

        try {
          await api.post(`/api/ngo/verify/${requestId}`);
          alert("Pickup verified successfully!");
          await scanner.clear();
          onSuccess();
        } catch (err: any) {
          console.error(err);
          alert(err.response?.data?.message || "Verification failed");
        }
      },
      (error) => {
        // ignore scan errors spam
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onSuccess]);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Scan Pickup QR</h2>

        <div id="qr-reader" className="w-full" />

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
