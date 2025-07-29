// Purchase Order and Billing types

export interface BillingContact {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface InvoiceItem {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  category: "KYC" | "WALLET" | "OTHER";
  serviceDate?: string;
  metadata?: {
    kycProfileId?: string;
    walletId?: string;
    bridgeCustomerId?: string;
    [key: string]: unknown;
  };
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  profileId: string;
  userId: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";

  // Billing information
  billTo: BillingContact;
  billFrom: BillingContact;

  // Order details
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;

  // Dates
  orderDate: string;
  dueDate: string;
  paidDate?: string;

  // Payment terms
  paymentTerms: string;
  notes?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  generatedBy: string; // Admin user ID who generated this order
}

export interface PurchaseOrderFilters {
  search?: string;
  status?: string;
  profileId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface GeneratePurchaseOrderRequest {
  profileId: string;
  userId: string;

  // Date range for services to include
  startDate?: string;
  endDate?: string;

  // Optional overrides
  billTo?: Partial<BillingContact>;
  paymentTerms?: string;
  notes?: string;
  dueDate?: string; // If not provided, defaults to 30 days from order date
}

export interface GeneratePurchaseOrderResponse {
  purchaseOrder: PurchaseOrder;
  pdfUrl?: string; // Optional PDF download URL
}

// Constants for billing
export const BILLING_CONSTANTS = {
  DEFAULT_PAYMENT_TERMS: "Net 30",
  DEFAULT_TAX_RATE: 0, // No tax by default
  DEFAULT_CURRENCY: "USD",
  COMPANY_INFO: {
    name: "Peyo Pagos",
    email: "billing@peyopagos.com",
    phone: "+1 (555) 123-4567",
    address: {
      street: "123 Business St",
      city: "Business City",
      state: "BC",
      zipCode: "12345",
      country: "United States",
    },
  },
} as const;
