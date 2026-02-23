import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  image?: string;
  variant?: string;
  // Product customization options
  size?: {
    id: string;
    name: string;
    region: string;
  };
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
  // Additional metadata
  addedAt: Date;
}

interface WishlistState {
  items: WishlistItem[];
  
  // Actions
  addItem: (item: Omit<WishlistItem, 'id' | 'addedAt'>) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  
  // Computed values
  getTotalItems: () => number;
  getItemById: (id: string) => WishlistItem | undefined;
  isItemInWishlist: (productId: string) => boolean;
  getItemByProductId: (productId: string) => WishlistItem | undefined;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const { productId } = newItem;
        
        // Check if item already exists
        const existingItem = get().items.find(item => item.productId === productId);
        
        if (!existingItem) {
          const wishlistItem: WishlistItem = {
            ...newItem,
            id: `${productId}-${Date.now()}`,
            addedAt: new Date(),
          };
          set((state) => ({
            items: [...state.items, wishlistItem],
          }));
        }
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== id),
        }));
      },

      clearWishlist: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.length;
      },

      getItemById: (id) => {
        return get().items.find(item => item.id === id);
      },

      isItemInWishlist: (productId) => {
        return get().items.some(item => item.productId === productId);
      },

      getItemByProductId: (productId) => {
        return get().items.find(item => item.productId === productId);
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
