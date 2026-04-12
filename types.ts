
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
  id: number | string;
  donorId?: string;
  donorName?: string;
  foodType: string;
  quantity: string;
  expiryWindow: string;   // e.g. "3 hrs"
  expiryHours?: number;
  status: DonationStatus;
  createdAt: string;      // ISO string from backend
  location?: string;
  allocatedTo?: string;
  qrCodeData?: string;
  distanceKm?: number | null; // computed later, may be null
}

export interface AnalyticsData {
  totalFoodSaved: number; // in kg
  activeDonors: number;
  partnerNGOs: number;
  mealsServed: number;
}
