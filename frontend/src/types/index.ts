export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  active: boolean;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  inStock: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  productSku: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  inStock: boolean;
  availableStock: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  totalItemsCount: number;
  totalAmount: number;
}

export interface Address {
  id: number;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  userEmail: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
  idempotencyKey?: string;
  items: OrderItem[];
  totalItemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentIntent {
  paymentReference: string;
  orderNumber: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface PaymentReceipt {
  id: number;
  orderNumber: string;
  paymentReference: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  gatewayResponse?: string;
  createdAt: string;
}

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  categoryName: string;
  price: number;
  currentStock: number;
  imageUrl?: string;
}

export interface InventoryLog {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  changeType: string;
  quantityChange: number;
  resultingQuantity: number;
  referenceId: string;
  createdAt: string;
}
