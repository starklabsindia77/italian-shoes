"use client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/lib/stores";
import { useToast } from "@/components/hooks/use-toast";
import { useState } from "react";

interface WishlistButtonProps {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  image?: string;
  variant?: string;
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
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
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
  variant: buttonVariant = "outline",
  size: buttonSize = "default",
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
    } catch (error) {
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
    <Button
      variant={buttonVariant}
      size={buttonSize}
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={`${className} ${isInWishlist ? 'text-red-500 hover:text-red-600' : ''}`}
    >
      <Heart 
        className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} 
      />
      <span className="ml-2">
        {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
      </span>
    </Button>
  );
};
