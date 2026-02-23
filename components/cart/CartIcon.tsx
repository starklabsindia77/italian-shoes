"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import { useCartStore, useWishlistStore } from "@/lib/stores";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface CartIconProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  showWishlist?: boolean;
}

export const CartIcon = ({
  variant = "ghost",
  size = "default",
  showWishlist = false
}: CartIconProps) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { getTotalItems, openCart } = useCartStore();
  const { getTotalItems: getWishlistTotal } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItemCount = getTotalItems();
  const wishlistItemCount = getWishlistTotal();

  const handleCartClick = () => {
    openCart();
    router.push('/cart');
  };

  const handleWishlistClick = () => {
    router.push('/wishlist');
  };

  return (
    <div className="flex items-center gap-2">
      {showWishlist && (
        <Button
          variant={variant}
          size={size}
          onClick={handleWishlistClick}
          className="relative"
        >
          <Heart className="h-4 w-4" />
          {mounted && wishlistItemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {wishlistItemCount}
            </Badge>
          )}
        </Button>
      )}

      <Button
        variant={variant}
        size={size}
        onClick={handleCartClick}
        className="relative"
      >
        <ShoppingCart className="h-4 w-4" />
        {mounted && cartItemCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs text-white"
          >
            {cartItemCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};
