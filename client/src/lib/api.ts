import { apiRequest } from "./queryClient";
import type { 
  Product, 
  Category, 
  CartItem, 
  Order, 
  InsertProduct, 
  InsertCartItem, 
  InsertOrder,
  InsertCategory,
  ProductWithCategory,
  CartItemWithProduct 
} from "@shared/schema";
import { getAdminAuthHeader } from "@/hooks/use-admin-auth";

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const res = await fetch("/api/categories");
  return res.json();
};

export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const res = await fetch(`/api/categories/${slug}`);
  return res.json();
};

export const createCategory = async (category: InsertCategory): Promise<Category> => {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeader(),
    },
    body: JSON.stringify(category),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create category");
  }

  return response.json();
};

export const updateCategory = async (id: number, category: Partial<InsertCategory>): Promise<Category> => {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeader(),
    },
    body: JSON.stringify(category),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update category");
  }

  return response.json();
};

export const deleteCategory = async (id: number): Promise<void> => {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
    headers: getAdminAuthHeader(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete category");
  }
};

// Products
export const getProducts = async (params?: {
  category?: string;
  search?: string;
  featured?: boolean;
}): Promise<Product[]> => {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.append("category", params.category);
  if (params?.search) searchParams.append("search", params.search);
  if (params?.featured) searchParams.append("featured", "true");

  const res = await fetch(`/api/products?${searchParams}`);
  return res.json();
};

export const getProductsWithCategory = async (): Promise<ProductWithCategory[]> => {
  const res = await fetch("/api/products-with-category");
  return res.json();
};

export async function getProduct(id: number): Promise<ProductWithCategory> {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }
  return response.json();
}

export async function getRecommendedProducts(productId: number): Promise<Product[]> {
  const response = await fetch(`/api/products/${productId}/recommendations`);
  if (!response.ok) {
    throw new Error("Failed to fetch recommended products");
  }
  return response.json();
}

export async function createProduct(productData: InsertProduct) {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeader(),
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error("Failed to create product");
  }

  return response.json();
}

export async function updateProduct(id: number, productData: Partial<InsertProduct>) {
  const response = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeader(),
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    throw new Error("Failed to update product");
  }

  return response.json();
}

export async function deleteImage(imageUrl: string) {
  const response = await fetch("/api/delete-image", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete image: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteProduct(id: number) {
  const response = await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: getAdminAuthHeader(),
  });
  if (!response.ok) throw new Error("Failed to delete product");
  return response.json();
}

// Reviews
export async function getProductReviews(productId: number) {
  const response = await fetch(`/api/products/${productId}/reviews`);
  if (!response.ok) throw new Error("Failed to fetch reviews");
  return response.json();
}

export async function getProductReviewStats(productId: number) {
  const response = await fetch(`/api/products/${productId}/review-stats`);
  if (!response.ok) throw new Error("Failed to fetch review stats");
  return response.json();
}

export async function createReview(reviewData: {
  productId: number;
  rating: number;
  title: string;
  comment: string;
}) {
  const sessionId = localStorage.getItem("sessionId");
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionId}`,
    },
    body: JSON.stringify(reviewData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create review");
  }
  return response.json();
}

export async function getUserReviews() {
  const token = localStorage.getItem("auth_token");
  const response = await fetch("/api/users/reviews", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch user reviews");
  return response.json();
}

export async function updateReview(id: number, reviewData: {
  rating?: number;
  title?: string;
  comment?: string;
}) {
  const sessionId = localStorage.getItem("sessionId");
  const response = await fetch(`/api/reviews/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionId}`,
    },
    body: JSON.stringify(reviewData),
  });
  if (!response.ok) throw new Error("Failed to update review");
  return response.json();
}

export async function deleteReview(id: number) {
  const sessionId = localStorage.getItem("sessionId");
  const response = await fetch(`/api/reviews/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${sessionId}`,
    },
  });
  if (!response.ok) throw new Error("Failed to delete review");
  return response.json();
}

export async function uploadImage(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  return response.json();
}

export async function uploadCategoryImage(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload-category-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload category image');
  }

  return response.json();
}

// Cart
export const getCartItems = async (sessionId: string): Promise<CartItemWithProduct[]> => {
  const res = await fetch(`/api/cart/${sessionId}`);
  return res.json();
};

export const addToCart = async (cartItem: InsertCartItem): Promise<CartItem> => {
  const res = await apiRequest("POST", "/api/cart", cartItem);
  return res.json();
};

export const updateCartItem = async (sessionId: string, productId: number, quantity: number): Promise<CartItem> => {
  const res = await apiRequest("PUT", `/api/cart/${sessionId}/${productId}`, { quantity });
  return res.json();
};

export const removeFromCart = async (sessionId: string, productId: number): Promise<void> => {
  await apiRequest("DELETE", `/api/cart/${sessionId}/${productId}`);
};

export const clearCart = async (sessionId: string): Promise<void> => {
  await apiRequest("DELETE", `/api/cart/${sessionId}`);
};

// Orders
export const getOrders = async (): Promise<Order[]> => {
  const res = await fetch("/api/orders");
  return res.json();
};

export const getOrder = async (id: number): Promise<Order> => {
  const res = await fetch(`/api/orders/${id}`);
  return res.json();
};

export const createOrder = async (order: InsertOrder, sessionId: string): Promise<Order> => {
  console.log("Creating order with data:", order);
  console.log("Using session ID:", sessionId);

  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sessionId}`
    },
    body: JSON.stringify(order),
  });

  console.log("Order creation response status:", res.status);

  if (!res.ok) {
    const error = await res.json();
    console.error("Order creation error:", error);
    throw new Error(error.message || "Failed to create order");
  }

  const result = await res.json();
  console.log("Order created successfully:", result);
  return result;
};

export async function updateOrderStatus(id: number, status: string) {
  const response = await fetch(`/api/orders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update order status");
  }

  return response.json();
}

export async function trackOrder(trackingNumber: string) {
  const response = await fetch(`/api/track/${trackingNumber}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to track order");
  }

  return response.json();
}

// Settings API functions
export async function getSettings() {
  const response = await fetch("/api/settings");
  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }
  return response.json();
}

export async function getSetting(key: string) {
  const response = await fetch(`/api/settings/${key}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch setting");
  }
  return response.json();
}

export async function createSetting(settingData: any) {
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settingData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create setting");
  }

  return response.json();
}

export async function updateSetting(key: string, value: string) {
  const response = await fetch(`/api/settings/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update setting");
  }

  return response.json();
}

// Wishlist API functions
export async function getWishlist(): Promise<Product[]> {
  const sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    throw new Error("Not authenticated");
  }

  const response = await fetch("/api/wishlist", {
    headers: {
      Authorization: `Bearer ${sessionId}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch wishlist");
  }

  return response.json();
}

export async function addToWishlist(productId: number): Promise<void> {
  const sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`/api/wishlist/${productId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionId}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to add to wishlist");
  }
}

export async function removeFromWishlist(productId: number): Promise<void> {
  const sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`/api/wishlist/${productId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${sessionId}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to remove from wishlist");
  }
}

