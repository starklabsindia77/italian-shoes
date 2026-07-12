"use client";
import { Heart } from "lucide-react";
import { useWishlistStore, CartSize } from "@/lib/stores";
import { useToast } from "@/components/hooks/use-toast";
import { useState } from "react";

interface WishlistButtonProps {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  image?: string;
  variant?: string;
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
  buttonVariant?: "default" | "ghost" | "outline";
  buttonSize?: "default" | "sm" | "lg";
  className?: string;
}

export const WishlistButton = ({
  productId,
  title,
  price,
  originalPrice,
  image,
  variant = "Default",
  size,
  material,
  style,
  sole,
  className,
}: WishlistButtonProps) => {
  const { addItem, removeItem, isItemInWishlist } = useWishlistStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const isInWishlist = isItemInWishlist(productId);

  const handleToggleWishlist = async () => {
    setIsLoading(true);
    
    try {
      if (isInWishlist) {
        const wishlistItem = useWishlistStore.getState().getItemByProductId(productId);
        if (wishlistItem) {
          removeItem(wishlistItem.id);
          toast({
            title: "Removed from wishlist",
            description: "The item has been removed from your wishlist.",
          });
        }
      } else {
        addItem({
          productId,
          title,
          price,
          originalPrice,
          image,
          variant,
          size,
          material,
          style,
          sole,
        });
        toast({
          title: "Added to wishlist",
          description: "The item has been added to your wishlist.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={`${className ?? ''} flex items-center justify-center gap-2 transition-colors`}
      title={isInWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
    >
      {/* Heart: black outline when NOT saved, solid red when saved */}
      <Heart
        className={`w-5 h-5 transition-all duration-200 ${
          isInWishlist
            ? 'fill-red-500 text-red-500'        // ♥ solid bright red
            : 'fill-none text-black stroke-2'    // ♡ black outline
        }`}
      />
      <span className="text-black">
        {isInWishlist ? 'Saved' : 'Save to wishlist'}
      </span>
    </button>
  );
};
