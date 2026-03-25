export type UserType = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  type: UserType;
  avatarUrl?: string;
  description?: string;
  wishlist?: string[];
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  logoUrl: string;
  coverUrl: string;
  images?: string[];
  phone?: string;
  location?: string;
  city?: string;
  followers?: string[];
  shippingPolicy?: string;
  featuredProductIds?: string[];
  views?: number;
}

export interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  reviews?: Review[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  buyerId: string;
  storeId: string;
  items: CartItem[];
  total: number;
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  buyerPhone?: string;
  buyerAddress?: string;
}

export interface Subscription {
  sellerId: string;
  status: 'active' | 'inactive' | 'pending';
  renewalDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'review';
  title: string;
  message: string;
  date: string;
  read: boolean;
  relatedId?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  storeId?: string; // Optional: link chat to a specific store context
}

export interface Offer {
  id: string;
  storeId: string;
  name: string;
  type: 'discount' | 'coupon';
  discountType: 'percentage' | 'fixed';
  value: number;
  code?: string;
  startDate: string;
  endDate: string;
  isFollowersOnly: boolean;
  productIds?: string[];
  isActive: boolean;
}
