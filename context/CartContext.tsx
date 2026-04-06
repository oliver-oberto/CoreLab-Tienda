"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearLocalCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setItems(data.items || []);
    } catch {}
  }, []);

  useEffect(() => { refreshCart(); }, [refreshCart]);

  const addToCart = async (productId: number, quantity = 1) => {
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    await refreshCart();
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    await fetch(`/api/cart/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    await refreshCart();
  };

  const removeItem = async (itemId: number) => {
    await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    await refreshCart();
  };

  const clearLocalCart = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, total, loading, addToCart, updateQuantity, removeItem, refreshCart, clearLocalCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
