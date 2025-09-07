import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCartItems, addToCart, updateCartItem, removeFromCart, clearCart } from "@/lib/api";
import type { CartItemWithProduct, InsertCartItem } from "@shared/schema";

// Generate a session ID for cart persistence
const getSessionId = (): string => {
  let sessionId = localStorage.getItem("cart-session-id");
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("cart-session-id", sessionId);
  }
  return sessionId;
};

export function useCart() {
  const [sessionId] = useState(getSessionId);
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart", sessionId],
    queryFn: () => getCartItems(sessionId),
  });

  const addToCartMutation = useMutation({
    mutationFn: (cartItem: Omit<InsertCartItem, "sessionId">) =>
      addToCart({ ...cartItem, sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", sessionId] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      updateCartItem(sessionId, productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", sessionId] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (productId: number) => removeFromCart(sessionId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", sessionId] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => clearCart(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", sessionId] });
    },
  });

  const total = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
    0
  );

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    total,
    itemCount,
    isLoading,
    addToCart: addToCartMutation.mutate,
    updateItem: updateItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isRemoving: removeItemMutation.isPending,
    isClearing: clearCartMutation.isPending,
  };
}
