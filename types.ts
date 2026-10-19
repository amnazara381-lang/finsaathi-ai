export type Language = 'en' | 'ur';

export type TransactionType = 'sale_cash' | 'sale_udhaar' | 'expense_supplier' | 'udhaar_recovery';

export interface LineItem {
  id: string;
  name: string;
  nameUrdu: string;
  quantity: number;
  unit: 'kg' | 'g' | 'liter' | 'pack' | 'piece' | 'dozen' | 'carton' | 'bag';
  unitPrice: number;
  total: number;
}

export interface Transaction {
  id: string;
  date: string;
  time: string;
  type: TransactionType;
  partyName?: string;
  partyPhone?: string;
  items: LineItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'udhaar' | 'easypaisa' | 'jazzcash' | 'bank';
  notes?: string;
  receiptNumber?: string;
}

export interface Customer {
  id: string;
  name: string;
  nameUrdu: string;
  phone: string;
  address: string;
  balanceOwed: number; // PKR
  creditLimit: number;
  trustScore: 'A' | 'B' | 'C';
  lastPaymentDate: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  nameUrdu: string;
  category: 'Grains & Pulses' | 'Oils & Ghee' | 'Flour & Bakery' | 'Tea & Beverages' | 'Dairy & Eggs' | 'Spices & Condiments' | 'Household & Soaps';
  categoryUrdu: string;
  currentStock: number;
  unit: 'kg' | 'liter' | 'pack' | 'piece' | 'dozen' | 'carton' | 'bag';
  costPrice: number;
  sellingPrice: number;
  minThreshold: number;
  supplierName: string;
  supplierPhone: string;
  barcode?: string;
}

export interface SupplierOrder {
  id: string;
  supplierName: string;
  supplierPhone: string;
  distributorCompany: string;
  items: {
    productName: string;
    productNameUrdu: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
  }[];
  totalEstimatedCost: number;
  status: 'Draft' | 'Sent via WhatsApp' | 'Delivered' | 'Paid';
  date: string;
}

export interface MicrofinanceOffer {
  id: string;
  institution: string;
  productName: string;
  productNameUrdu: string;
  maxAmount: number;
  tenureMonths: number;
  weeklyInstallment: number;
  profitRate: string;
  features: string[];
  featuresUrdu: string[];
  partnerLogoText: string;
  recommended?: boolean;
}

export interface StoreProfile {
  storeName: string;
  storeNameUrdu: string;
  ownerName: string;
  ownerNameUrdu: string;
  phone: string;
  address: string;
  addressUrdu: string;
  city: string;
  establishedYear: number;
}

export interface UserSession {
  id: string;
  name: string;
  nameUrdu: string;
  email: string;
  phone: string;
  storeName: string;
  storeNameUrdu: string;
  address: string;
  city: string;
  rememberMe: boolean;
  avatarUrl: string;
  role: 'owner' | 'manager' | 'staff';
}

