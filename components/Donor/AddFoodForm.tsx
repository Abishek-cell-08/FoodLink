import React, { useState, useEffect } from "react";
import { Button, Input, Card } from "../UI";
import api from "../../api/client";
import { getGeolocation } from "../../utils/platform";

interface AddFoodFormProps {
  onCancel: () => void;
}

const AddFoodForm: React.FC<AddFoodFormProps> = ({ onCancel }) => {
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryHours, setExpiryHours] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [locStatus, setLocStatus] = useState<string>("Detecting location...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const geolocation = getGeolocation();
    if (!geolocation) {
      setLocStatus("Geolocation not supported");
      return;
    }

    geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPickupLat(latitude);
        setPickupLng(longitude);
        setLocStatus("Location detected");
      },
      (positionError) => {
        console.warn("Location error:", positionError);
        setLocStatus("Location not available, but you can still submit");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      await api.post("/api/donor/donations", {
        foodType,
        quantity,
        expiryHours: Number(expiryHours),
        pickupAddress,
        notes,
        pickupLat,
        pickupLng,
      });

      alert("Donation posted successfully!");
      onCancel();
    } catch (err: any) {
      console.error("Failed to create donation", err);
      setError(err.response?.data?.message || "Failed to create donation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl rounded-[28px] p-5 sm:p-7">
      <h2 className="mb-5 text-xl font-bold text-slate-900 sm:mb-6 sm:text-2xl">
        List Surplus Food
      </h2>

      <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          <Input
            label="Food Description"
            placeholder="e.g. Mixed Vegetarian Lunch"
            required
            value={foodType}
            onChange={(e: any) => setFoodType(e.target.value)}
          />
          <Input
            label="Quantity"
            placeholder="e.g. 15 kg or 40 packets"
            required
            value={quantity}
            onChange={(e: any) => setQuantity(e.target.value)}
          />
          <Input
            label="Expiry/Time Window (Hours)"
            type="number"
            placeholder="e.g. 3"
            required
            value={expiryHours}
            onChange={(e: any) => setExpiryHours(e.target.value)}
          />
          <Input
            label="Pickup Location (Description)"
            placeholder="Kitchen Entrance B"
            required
            value={pickupAddress}
            onChange={(e: any) => setPickupAddress(e.target.value)}
          />
        </div>

        <div className="text-sm text-slate-600">
          {locStatus}
          {pickupLat != null && pickupLng != null && (
            <div className="text-xs text-slate-400">
              Lat: {pickupLat.toFixed(5)}, Lng: {pickupLng.toFixed(5)}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Dietary Information & Storage
          </label>
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 sm:px-4"
            placeholder="Allergens, refrigeration needs, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm font-medium">{error}</div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post Donation"}
          </Button>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddFoodForm;
