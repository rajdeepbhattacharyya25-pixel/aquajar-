export type JarStatus = 'available' | 'with_customer' | 'returned' | 'lost' | 'damaged';
export type TransactionType = 'delivery' | 'return' | 'payment' | 'lost' | 'damaged';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  payment_cycle: number;
  credit_limit: number;
  notes: string;
  created_at: number;
  // Computed/Cached fields for fast querying
  total_due: number;
  jars_held: number;
  price_per_jar: number;
}

export interface Jar {
  id: string;
  qr_code: string;
  status: JarStatus;
  current_customer_id: string | null;
  last_updated: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  customer_id: string;
  jar_id: string | null;
  amount: number;
  jar_count: number;
  note: string;
  timestamp: number;
}

export interface DashboardStats {
  totalJars: number;
  jarsAvailable: number;
  jarsWithCustomers: number;
  totalOutstandingDue: number;
  recentDeliveries: number; // Today
  todaysCollection: number; // Today
}
