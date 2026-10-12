// ─── Expense ──────────────────────────────────────────────────────────────────
export type ExpenseCategory =
  | 'Petrol'
  | 'Loading'
  | 'Food'
  | 'Repair'
  | 'Salary'
  | 'Rent'
  | 'Utility'
  | 'Other';

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummaryBreakdown {
  _id: ExpenseCategory;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  breakdown: ExpenseSummaryBreakdown[];
  grandTotal: number;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'customer';

export interface User {
  _id: string;
  name: string;
  username: string;
  role: UserRole;
  shopId: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  shop: Shop | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Shop ─────────────────────────────────────────────────────────────────────
export interface Shop {
  _id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  userId: string;
  openingBalance: number;
  isActive: boolean;
  currentBalance?: number;
  username?: string;
  summary?: ShopSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ShopSummary {
  totalOrders: number;
  totalPurchased: number;
  totalPaid: number;
  currentBalance: number;
}

export interface ShopBalance {
  shopId: string;
  shopName: string;
  ownerName: string;
  phone: string;
  currentBalance: number;
}

export interface AllBalancesResponse {
  shops: ShopBalance[];
  totalOutstanding: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export type ProductUnit = 'KG' | 'Packet' | 'Bag' | 'Box' | 'Piece';

export interface Product {
  _id: string;
  name: string;
  unit: ProductUnit;
  defaultRate: number;
  costPrice: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  costPrice: number;
  costTotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  shopId: string | Shop;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: 'confirmed' | 'cancelled';
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
  // populated by aggregation
  shop?: { name: string; ownerName: string };
  itemCount?: number;
  // Bill features
  billImageUrl?: string;
  billDescription?: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Other';

export interface Payment {
  _id: string;
  shopId: string | Shop;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

// ─── Ledger ───────────────────────────────────────────────────────────────────
export type LedgerType = 'OPENING_BALANCE' | 'ORDER' | 'PAYMENT';

export interface LedgerTransaction {
  _id: string;
  shopId: string;
  type: LedgerType;
  referenceId: string | null;
  description: string;
  debit: number;
  credit: number;
  balanceAfter: number;
  createdBy: string | null;
  createdAt: string;
}

// ─── Supplier ─────────────────────────────────────────────────────────────────
export type SupplierTransactionType =
  | 'OPENING_BALANCE'
  | 'PURCHASE'
  | 'PAYMENT_SENT'
  | 'PAYMENT_RECEIVED'
  | 'ADJUSTMENT';

export interface Supplier {
  _id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  description: string;
  openingBalance: number;
  isActive: boolean;
  currentBalance?: number;  // computed — positive = payable (hum unhe dete hain)
  createdAt: string;
  updatedAt: string;
}

export interface SupplierTransaction {
  _id: string;
  supplierId: string;
  type: SupplierTransactionType;
  amount: number;
  debit: number;
  credit: number;
  balanceAfter: number;
  description: string;
  referenceNote: string;
  createdBy: string | null;
  createdAt: string;
}

export interface SupplierLedgerResponse {
  transactions: SupplierTransaction[];
  currentBalance: number;
}

export interface SuppliersSummary {
  totalPayable: number;    // hum unhe dete hain (we owe suppliers)
  totalReceivable: number; // woh hume dete hain (suppliers owe us)
  netBalance: number;
}

// ─── Bill ─────────────────────────────────────────────────────────────────────
export type BillPartyType = 'shop' | 'supplier';
export type BillSource = 'manual' | 'auto_order' | 'auto_purchase';

export interface Bill {
  _id: string;
  partyType: BillPartyType;
  partyId: string;
  partyName: string;
  title: string;
  description: string;
  amount: number;
  billDate: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  source: BillSource;
  referenceId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillsResponse {
  data: Bill[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Profit & Loss ────────────────────────────────────────────────────────────
export interface ProductProfitBreakdown {
  productId: string;
  productName: string;
  unit: string;
  totalQty: number;
  avgSellingRate: number;
  avgCostPrice: number;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  margin: number;
}

export interface ProfitLossReport {
  since: string;
  until: string;
  filter: string;
  totalOrders: number;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  grossMargin: number;
  totalExpenses: number;
  netProfit: number;
  netMargin: number;
  productBreakdown: ProductProfitBreakdown[];
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ─── Navigation Params ────────────────────────────────────────────────────────

// Admin Tab roots (for bottom tab navigator)
export type AdminTabParamList = {
  HomeTab: undefined;
  ShopsTab: undefined;
  OrdersTab: undefined;
  SuppliersTab: undefined;
  ReportsTab: undefined;
  MoreTab: undefined;
};

// Customer Tab roots
export type CustomerTabParamList = {
  DashboardTab: undefined;
  OrdersTab: undefined;
  PaymentsTab: undefined;
  LedgerTab: undefined;
  ProfileTab: undefined;
};

export type AdminStackParamList = {
  AdminDashboard: undefined;
  Shops: undefined;
  AddShop: undefined;
  EditShop: { shopId: string };
  ShopProfile: { shopId: string; shopName: string };
  Products: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  NewOrder: { shopId: string; shopName: string };
  OrderDetails: { orderId: string };
  AllOrders: undefined;
  AllPayments: undefined;
  AddPayment: { shopId: string; shopName: string; currentBalance: number };
  AllBalances: undefined;
  ShopLedger: { shopId: string; shopName: string };
  PaymentDetails: { paymentId: string };
  AdminProfile: undefined;
  // Expense screen
  Expenses: undefined;
  // Profit & Loss
  ProfitLoss: undefined;
  // Supplier screens
  Suppliers: undefined;
  AddSupplier: undefined;
  EditSupplier: { supplierId: string };
  SupplierDetail: { supplierId: string; supplierName: string };
  // Bills
  Bills: { partyType: 'shop' | 'supplier'; partyId: string; partyName: string };
};

export type CustomerStackParamList = {
  CustomerDashboard: undefined;
  MyOrders: undefined;
  OrderDetails: { orderId: string };
  MyPayments: undefined;
  AccountHistory: undefined;
  MyProfile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  AdminRoot: undefined;
  CustomerRoot: undefined;
};
