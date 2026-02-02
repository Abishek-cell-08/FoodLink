
import React from 'react';
import { Button, Input, Card } from '../UI';

interface AddFoodFormProps {
  onCancel: () => void;
}

const AddFoodForm: React.FC<AddFoodFormProps> = ({ onCancel }) => (
  <Card className="p-8 max-w-2xl mx-auto">
    <h2 className="text-2xl font-bold text-slate-900 mb-6">List Surplus Food</h2>
    <form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Food Description" placeholder="e.g. Mixed Vegetarian Lunch" required />
        <Input label="Quantity" placeholder="e.g. 15 kg or 40 packets" required />
        <Input label="Expiry/Time Window (Hours)" type="number" placeholder="e.g. 3" required />
        <Input label="Pickup Location" placeholder="Kitchen Entrance B" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Dietary Information & Storage</label>
        <textarea 
          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[100px]"
          placeholder="Allergens, refrigeration needs, etc."
        />
      </div>
      <div className="flex gap-4">
        <Button className="flex-1" size="lg" type="button" onClick={onCancel}>Post Donation</Button>
        <Button variant="outline" size="lg" type="button" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  </Card>
);

export default AddFoodForm;
