
import { FoodDonation, DonationStatus, UserRole } from './types';

export const MOCK_DONATIONS: FoodDonation[] = [
  {
    id: 'don-1',
    donorId: 'u-1',
    donorName: 'Grand Hyatt Kitchen',
    foodType: 'Cooked Meals (Rice & Curry)',
    quantity: '25 kg',
    expiryWindow: '2 hours',
    expiryHours: 2,
    distanceKm: 1.5,
    location: 'Downtown, Sector 5',
    status: DonationStatus.PENDING,
    createdAt: new Date().toISOString(),
    qrCodeData: 'WFL-DON-1-SECRET'
  },
  {
    id: 'don-2',
    donorId: 'u-1',
    donorName: 'Grand Hyatt Kitchen',
    foodType: 'Fresh Bread & Pastries',
    quantity: '10 kg',
    expiryWindow: '12 hours',
    expiryHours: 12,
    distanceKm: 4.2,
    location: 'Downtown, Sector 5',
    status: DonationStatus.ALLOCATED,
    allocatedTo: 'ngo-1',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    qrCodeData: 'WFL-DON-2-SECRET'
  },
  {
    id: 'don-3',
    donorId: 'u-2',
    donorName: 'City Supermarket',
    foodType: 'Canned Goods & Milk',
    quantity: '50 units',
    expiryWindow: '72 hours',
    expiryHours: 72,
    distanceKm: 12.0,
    location: 'East Wing Plaza',
    status: DonationStatus.PICKED_UP,
    allocatedTo: 'ngo-2',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    qrCodeData: 'WFL-DON-3-SECRET'
  },
  {
    id: 'don-4',
    donorId: 'u-3',
    donorName: 'Catering Express',
    foodType: 'Sandwiches & Salads',
    quantity: '15 kg',
    expiryWindow: '1 hour',
    expiryHours: 1,
    distanceKm: 0.8,
    location: 'West Side Corporate Hub',
    status: DonationStatus.PENDING,
    createdAt: new Date().toISOString(),
    qrCodeData: 'WFL-DON-4-SECRET'
  },
  {
    id: 'don-5',
    donorId: 'u-4',
    donorName: 'Local Bakery',
    foodType: 'Assorted Muffins',
    quantity: '5 kg',
    expiryWindow: '6 hours',
    expiryHours: 6,
    distanceKm: 2.1,
    location: 'Suburban Lane',
    status: DonationStatus.PENDING,
    createdAt: new Date().toISOString(),
    qrCodeData: 'WFL-DON-5-SECRET'
  }
];

export const APP_THEME = {
  primary: 'emerald-600',
  primaryHover: 'emerald-700',
  secondary: 'indigo-600',
  secondaryHover: 'indigo-700',
  bg: 'slate-50',
};
