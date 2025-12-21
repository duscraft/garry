export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface Warranty {
  id: string;
  user_id: string;
  product_name: string;
  brand: string;
  category: string;
  purchase_date: string;
  warranty_end_date: string;
  warranty_months: number;
  store: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWarrantyRequest {
  product_name: string;
  brand: string;
  category: string;
  purchase_date: string;
  warranty_months: number;
  store: string;
  receipt_url?: string;
  notes?: string;
}

export interface Stats {
  total_warranties: number;
  active_warranties: number;
  expired_warranties: number;
  expiring_soon_warranties: number;
}
