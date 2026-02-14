import React, { useState } from "react";
import { Button, Input, Card } from "../UI";
import api from "../../api/client";

interface AddFoodFormProps {
  onCancel: () => void;
}

const AddFoodForm: React.FC<AddFoodFormProps> = ({ onCancel }) => {
  const [foodType, setFoodType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryHours, setExpiryHours] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });

      alert("Donation posted successfully!");
      onCancel(); // go back / close form
    } catch (err: any) {
      console.error("Failed to create donation", err);
      setError(err.response?.data?.message || "Failed to create donation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        List Surplus Food
      </h2>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            label="Pickup Location"
            placeholder="Kitchen Entrance B"
            required
            value={pickupAddress}
            onChange={(e: any) => setPickupAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Dietary Information & Storage
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[100px]"
            placeholder="Allergens, refrigeration needs, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm font-medium">{error}</div>
        )}

        <div className="flex gap-4">
          <Button className="flex-1" size="lg" type="submit" disabled={loading}>
            {loading ? "Posting..." : "Post Donation"}
          </Button>
          <Button variant="outline" size="lg" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddFoodForm;
