import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartSize = {
  id: string;
  name?: string;
  label?: string;
  value?: number | string;
  region?: string;
} | string;

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  variant: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image?: string;
  // Product customization options
  size?: CartSize | null;
  material?: {
    id: string;
    name: string;
    color?: {
      id: string;
      name: string;
      hexCode?: string;
    };
  };
  style?: {
    id: string;
    name: string;
  };
  sole?: {
    id: string;
    name: string;
  };
  notes?: string;
  config?: unknown;
  // Additional metadata
  addedAt: Date;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Computed values
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemById: (id: string) => CartItem | undefined;
  isItemInCart: (productId: string, variant: string) => boolean;
}

function configurationKey(item: Omit<CartItem, 'id' | 'addedAt'>) {
  const sizeId = typeof item.size === 'string' ? item.size : item.size?.id;
  return JSON.stringify([
    item.productId,
    item.variant,
    sizeId ?? null,
    item.style?.id ?? null,
    item.sole?.id ?? null,
    item.material?.id ?? null,
    item.material?.color?.id ?? null,
    item.notes ?? null,
    item.config ?? null,
  ]);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const { productId, variant } = newItem;
        // Custom shoes share one productId/variant, so only an identical
        // configuration bumps quantity; a different size or design is a new line.
        const key = configurationKey(newItem);
        const existingItem = get().items.find(item => configurationKey(item) === key);

        if (existingItem) {
          // Update quantity if item already exists
          set((state) => ({
            items: state.items.map(item =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            ),
          }));
        } else {
          // Add new item
          const cartItem: CartItem = {
            ...newItem,
            id: `${productId}-${variant}-${Date.now()}`,
            addedAt: new Date(),
          };
          set((state) => ({
            items: [...state.items, cartItem],
          }));
        }
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getItemById: (id) => {
        return get().items.find(item => item.id === id);
      },

      isItemInCart: (productId, variant) => {
        return get().items.some(
          item => item.productId === productId && item.variant === variant
        );
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist items, not UI state
    }
  )
);
