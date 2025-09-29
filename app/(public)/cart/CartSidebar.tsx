// components/CartUI.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * CartUI.tsx
 * - Single-file Cart provider + UI for Next.js + TypeScript (client)
 * - Persist to localStorage, cross-tab sync via BroadcastChannel with storage fallback
 * - Use Tailwind for styling (adjust to your styles)
 *
 * Usage:
 *  - Place <CartUI /> somewhere in your layout to render header + drawer,
 *    or wrap with <CartProvider> and use <MiniCartInline /> and <CartDrawer /> individually.
 */

/* ----------------------
   Types
   ---------------------- */
export type ID = string;

export interface CartItem {
  id: ID; // client id (uuid)
  productId: ID;
  variantId?: ID | null;
  name: string;
  sku?: string;
  unitAmount: number; // integer in cents/paise
  quantity: number;
  image?: string;
  meta?: Record<string, any>;
}

export interface CartState {
  id?: ID;
  items: CartItem[];
  version: number;
  updatedAt: number;
}

/* ----------------------
   Reducer & Helpers
   ---------------------- */
type Action =
  | { type: "SET_CART"; payload: CartState }
  | { type: "ADD_ITEM"; payload: { item: CartItem } }
  | { type: "REMOVE_ITEM"; payload: { productId: string; variantId?: string | null } }
  | { type: "UPDATE_QTY"; payload: { productId: string; variantId?: string | null; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "INCREMENT_VERSION" };

function consolidateItems(items: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const it of items) {
    const key = `${it.productId}::${it.variantId ?? ""}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += it.quantity;
      existing.unitAmount = it.unitAmount; // prefer latest client price (server authoritative at checkout)
      existing.image = existing.image || it.image;
    } else {
      map.set(key, { ...it });
    }
  }
  return Array.from(map.values());
}

function calcSubtotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.unitAmount * i.quantity, 0);
}

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "SET_CART":
      return { ...action.payload };
    case "ADD_ITEM": {
      const newItems = consolidateItems([...state.items, action.payload.item]);
      return { ...state, items: newItems, version: state.version + 1, updatedAt: Date.now() };
    }
    case "REMOVE_ITEM": {
      const filtered = state.items.filter(
        (i) => !(i.productId === action.payload.productId && (i.variantId ?? null) === (action.payload.variantId ?? null))
      );
      return { ...state, items: filtered, version: state.version + 1, updatedAt: Date.now() };
    }
    case "UPDATE_QTY": {
      const mapped = state.items
        .map((i) =>
          i.productId === action.payload.productId && (i.variantId ?? null) === (action.payload.variantId ?? null)
            ? { ...i, quantity: action.payload.quantity }
            : i
        )
        .filter((i) => i.quantity > 0);
      return { ...state, items: mapped, version: state.version + 1, updatedAt: Date.now() };
    }
    case "CLEAR_CART":
      return { ...state, items: [], version: state.version + 1, updatedAt: Date.now() };
    case "INCREMENT_VERSION":
      return { ...state, version: state.version + 1 };
    default:
      return state;
  }
}

/* ----------------------
   Context + Provider
   ---------------------- */
const STORAGE_KEY = "isc_cart_v1";
const CHANNEL_NAME = "isc_cart_channel_v1";

type CartContextValue = {
  cart: CartState;
  addItem: (item: Omit<CartItem, "id">, qty?: number) => Promise<void>;
  removeItem: (productId: string, variantId?: string | null) => Promise<void>;
  updateQuantity: (productId: string, variantId: string | null, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number; // integer cents
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const initial: CartState = { items: [], version: 0, updatedAt: Date.now() };
  const [state, dispatch] = useReducer(cartReducer, initial);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Load from storage (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: CartState = JSON.parse(raw);
        dispatch({ type: "SET_CART", payload: parsed });
      }
    } catch (e) {
      console.warn("Cart load error:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist + broadcast whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        if (!bcRef.current) bcRef.current = new BroadcastChannel(CHANNEL_NAME);
        bcRef.current.postMessage({ type: "CART_UPDATE", payload: state });
      } else {
        // fallback: write small sync marker to trigger storage event
        localStorage.setItem(`${STORAGE_KEY}_sync`, Date.now().toString());
      }
    } catch (e) {
      console.warn("Cart persist error:", e);
    }
  }, [state]);

  // Cross-tab sync (BroadcastChannel preferred, storage fallback)
  useEffect(() => {
  // If we are on the server, do nothing.
  if (typeof window === "undefined") return;

  // keep a ref to the latest updatedAt so listener callbacks don't close over stale "state"
  const latestUpdatedAtRef = { current: state.updatedAt };

  // update the ref whenever state.updatedAt changes
  // (we do this synchronously here because this effect runs again when state.updatedAt changes)
  latestUpdatedAtRef.current = state.updatedAt;

  // Define the storage handler BEFORE attaching it
  const onStorage = (e: StorageEvent) => {
    try {
      if (!e) return;
      // Only react to our keys
      if (e.key && (e.key === STORAGE_KEY || e.key === `${STORAGE_KEY}_sync`)) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          // other tab cleared cart
          dispatch({
            type: "SET_CART",
            payload: { items: [], version: state.version + 1, updatedAt: Date.now() },
          });
          return;
        }
        const parsed: CartState = JSON.parse(raw);
        // Last-write-wins: accept remote if it's newer than the local last-updated
        if (parsed.updatedAt > latestUpdatedAtRef.current) {
          dispatch({ type: "SET_CART", payload: parsed });
        }
      }
    } catch (err) {
      console.warn("parse cart on storage event failed", err);
    }
  };

  let bc: BroadcastChannel | null = null;
  // Prefer BroadcastChannel (faster / direct) but only if actually available in this environment
  if ("BroadcastChannel" in window) {
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (m) => {
        try {
          if (m.data?.type === "CART_UPDATE") {
            const remote: CartState = m.data.payload;
            if (remote.updatedAt > latestUpdatedAtRef.current) {
              dispatch({ type: "SET_CART", payload: remote });
            }
          }
        } catch (err) {
          // ignore malformed messages
        }
      };
    } catch (err) {
      // If BroadcastChannel construction fails for any reason, fall back to storage event
      window.addEventListener("storage", onStorage);
    }
  } else {
    // fallback for older browsers / environments
    window.addEventListener("storage", onStorage);
  }

  // Cleanup
  return () => {
    try {
      if (bc) {
        bc.close();
        bc = null;
      } else {
        window.removeEventListener("storage", onStorage);
      }
    } catch (err) {
      // swallow cleanup errors
    }
  };
// Intentionally keep deps conservative — effect should re-run when `state.updatedAt` or STORAGE_KEY/CHANNEL_NAME change.
// We used a ref technique above; include STORAGE_KEY and CHANNEL_NAME if they're not module constants.
}, [state.updatedAt]);

  // Public actions (optimistic; server sync separate)
  async function addItem(item: Omit<CartItem, "id">, qty = 1) {
    const entry: CartItem = { ...item, id: uuidv4(), quantity: qty };
    dispatch({ type: "ADD_ITEM", payload: { item: entry } });
    // TODO: queue op to server for sync if you implement server-side cart
  }

  async function removeItem(productId: string, variantId?: string | null) {
    dispatch({ type: "REMOVE_ITEM", payload: { productId, variantId } });
  }

  async function updateQuantity(productId: string, variantId: string | null, qty: number) {
    if (qty <= 0) return removeItem(productId, variantId);
    dispatch({ type: "UPDATE_QTY", payload: { productId, variantId, quantity: qty } });
  }

  async function clearCart() {
    dispatch({ type: "CLEAR_CART" });
  }

  const itemCount = useMemo(() => state.items.reduce((s, it) => s + it.quantity, 0), [state.items]);
  const subtotal = useMemo(() => calcSubtotal(state.items), [state.items]);

  const value: CartContextValue = {
    cart: state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/* ----------------------
   UI Components (Tailwind)
   ---------------------- */

function formatMoney(cents: number) {
  // display rupees/dollars depending on your locale; cents -> decimals
  return (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CartUI({ initialOpen = false }: { initialOpen?: boolean }) {
  return (
    <CartProvider>
      <div className="relative">
        <CartHeader />
        <CartDrawer initialOpen={initialOpen} />
      </div>
    </CartProvider>
  );
}

function CartHeader() {
  const { itemCount } = useCart();
  return (
    <div className="flex items-center gap-3">
      <button
        id="cart-toggle"
        className="relative inline-flex items-center px-3 py-2 bg-white border rounded shadow-sm hover:shadow-md"
        onClick={() => {
          const el = document.getElementById("isc-cart-drawer");
          if (!el) return;
          el.classList.toggle("translate-x-0");
          el.classList.toggle("translate-x-full");
        }}
        aria-label="Toggle cart"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
        </svg>
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {itemCount}
          </span>
        )}
      </button>
    </div>
  );
}

function CartDrawer({ initialOpen = false }: { initialOpen?: boolean }) {
  const { cart, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  useEffect(() => {
    const el = document.getElementById("isc-cart-drawer");
    if (!el) return;
    if (initialOpen) {
      el.classList.remove("translate-x-full");
      el.classList.add("translate-x-0");
    } else {
      el.classList.add("translate-x-full");
    }
  }, [initialOpen]);

  return (
    <aside
      id="isc-cart-drawer"
      className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 z-50 flex flex-col"
      style={{ willChange: "transform" }}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bag</h3>
        <div className="flex items-center gap-2">
          <button
            className="text-sm text-gray-600 hover:underline"
            onClick={() => {
              const el = document.getElementById("isc-cart-drawer");
              el?.classList.add("translate-x-full");
            }}
            aria-label="Close cart"
          >
            Close
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        {cart.items.length === 0 ? (
          <div className="text-center text-gray-500 mt-12">Your bag is empty</div>
        ) : (
          <ul className="space-y-4">
            {cart.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <img src={item.image ?? "/placeholder-100.png"} alt={item.name} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.sku && <div className="text-xs text-gray-500">SKU: {item.sku}</div>}
                      {item.meta?.size && <div className="text-xs text-gray-500">Size: {item.meta.size}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{formatMoney(item.unitAmount)}</div>
                      <div className="text-xs text-gray-500">₹{formatMoney(item.unitAmount * item.quantity)}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center border rounded overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId ?? null, item.quantity - 1)}
                        className="px-3 py-1 text-sm"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        -
                      </button>
                      <div className="px-4 py-1 text-sm">{item.quantity}</div>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId ?? null, item.quantity + 1)}
                        className="px-3 py-1 text-sm"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.productId, item.variantId ?? null)} className="text-sm text-gray-600 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">Subtotal ({itemCount} items)</div>
          <div className="text-lg font-semibold">₹{formatMoney(subtotal)}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              // go to cart page (implement your route)
              window.location.href = "/cart";
            }}
            className="w-full inline-flex justify-center items-center px-4 py-2 border rounded"
          >
            View Cart
          </button>
          <button
            onClick={() => {
              // Start checkout: call your checkout flow which will create order, call Shiprocket, etc.
              window.location.href = "/checkout";
            }}
            className="w-full inline-flex justify-center items-center px-4 py-2 bg-black text-white rounded"
          >
            Checkout
          </button>
        </div>

        <div className="mt-3 text-center text-xs text-gray-500">Secure checkout • Easy returns</div>

        <div className="mt-4 text-center">
          <button
            className="text-sm text-red-600 hover:underline"
            onClick={() => {
              if (confirm("Clear cart?")) clearCart();
            }}
          >
            Clear Bag
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ----------------------
   Small helpers to export/use outside
   ---------------------- */

export function CartButtonAdd({ product, qty = 1 }: { product: Omit<CartItem, "id">; qty?: number }) {
  const { addItem } = useCart();
  return (
    <button onClick={() => addItem(product, qty)} className="px-4 py-2 bg-black text-white rounded inline-flex items-center gap-2">
      Add to bag
    </button>
  );
}

export function MiniCartInline() {
  const { itemCount, subtotal } = useCart();
  return (
    <div className="inline-flex items-center gap-2">
      <div className="font-medium">{itemCount} items</div>
      <div className="text-sm">₹{formatMoney(subtotal)}</div>
    </div>
  );
}
