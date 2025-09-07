export * from "@shared/schema";

export interface CartState {
  items: CartItemWithProduct[];
  total: number;
  itemCount: number;
  sessionId: string;
}

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  query?: string;
}
