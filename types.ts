
export enum UserRole {
  DONOR = 'DONOR',
  NGO = 'NGO',
  ADMIN = 'ADMIN'
}

export enum DonationStatus {
  PENDING = 'PENDING',
  ALLOCATED = 'ALLOCATED',
  PICKED_UP = 'PICKED_UP',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location?: string;
  verified: boolean;
  performanceScore?: number; // 0 to 100
}

export interface FoodDonation {
  id: string;
  donorId: string;
  donorName: string;
  foodType: string;
  quantity: string; // e.g., "5 kg"
  expiryWindow: string; // e.g., "4 hours"
  expiryHours: number; // Numeric for sorting
  location: string;
  distanceKm: number; // Distance from current NGO
  status: DonationStatus;
  allocatedTo?: string; // NGO ID
  createdAt: string;
  qrCodeData: string;
}

export interface AnalyticsData {
  totalFoodSaved: number; // in kg
  activeDonors: number;
  partnerNGOs: number;
  mealsServed: number;
}
