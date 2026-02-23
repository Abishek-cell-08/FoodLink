import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { Card, Button, StatusBadge } from "../UI";

interface Props {
  donationId: number;
  onClose: () => void;
}

const DonorDonationDetails: React.FC<Props> = ({ donationId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      const res = await api.get(`/api/donor/donations/${donationId}`);
      setData(res.data.data);
      setLoading(false);
    };
    fetchDetails();
  }, [donationId]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-bold">Donation Details</h3>

      <div><b>Food:</b> {data.foodType}</div>
      <div><b>Quantity:</b> {data.quantity}</div>
      <div><b>Status:</b> <StatusBadge status={data.status} /></div>
      <div><b>Posted:</b> {new Date(data.createdAt).toLocaleString()}</div>
      <div><b>Expires:</b> {new Date(data.expiresAt).toLocaleString()}</div>

      <div className="pt-4 text-right">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </Card>
  );
};

export default DonorDonationDetails;
