// Re-export all stores for easy importing
export { useCartStore } from './cart-store';
export { useWishlistStore } from './wishlist-store';
export type { CartItem } from './cart-store';
export type { WishlistItem } from './wishlist-store';

// Combined hook for components that need both cart and wishlist
import { useCartStore } from './cart-store';
import { useWishlistStore } from './wishlist-store';

export const useCartAndWishlist = () => {
  const cart = useCartStore();
  const wishlist = useWishlistStore();

  return {
    cart,
    wishlist,
    // Helper functions that work with both stores
    moveToCart: (wishlistItemId: string) => {
      const wishlistItem = wishlist.getItemById(wishlistItemId);
      if (wishlistItem) {
        cart.addItem({
          productId: wishlistItem.productId,
          title: wishlistItem.title,
          variant: wishlistItem.variant || 'Default',
          price: wishlistItem.price,
          originalPrice: wishlistItem.originalPrice,
          quantity: 1,
          image: wishlistItem.image,
          size: wishlistItem.size,
          material: wishlistItem.material,
          style: wishlistItem.style,
          sole: wishlistItem.sole,
        });
        wishlist.removeItem(wishlistItemId);
      }
    },
    moveToWishlist: (cartItemId: string) => {
      const cartItem = cart.getItemById(cartItemId);
      if (cartItem) {
        wishlist.addItem({
          productId: cartItem.productId,
          title: cartItem.title,
          price: cartItem.price,
          originalPrice: cartItem.originalPrice,
          image: cartItem.image,
          variant: cartItem.variant,
          size: cartItem.size,
          material: cartItem.material,
          style: cartItem.style,
          sole: cartItem.sole,
        });
        cart.removeItem(cartItemId);
      }
    },
  };
};
