"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCartStore, CartSize } from "@/lib/stores";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  productId: string;
  title: string;
  price: number;
  originalPrice?: number;
  image?: string;
  variant?: string;
  quantity?: number;
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
  showIcon?: boolean;
  notes?: string;
  config?: unknown;
  onBeforeAdd?: () => Promise<{ image?: string } | void>;
}

export const AddToCartButton = ({
  productId,
  title,
  price,
  originalPrice,
  image,
  variant = "Default",
  quantity = 1,
  size,
  material,
  style,
  sole,
  buttonVariant = "default",
  buttonSize = "default",
  className = "bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors",
  showIcon = false,
  notes,
  config,
  onBeforeAdd,
}: AddToCartButtonProps) => {
  const { addItem } = useCartStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);

    try {
      let finalImage = image;

      if (onBeforeAdd) {
        const result = await onBeforeAdd();
        if (result?.image) {
          finalImage = result.image;
        }
      }

      addItem({
        productId,
        title,
        variant,
        price,
        originalPrice,
        quantity,
        image: finalImage,
        size,
        material,
        style,
        sole,
        notes,
        config,
      });

      // The app mounts sonner's <Toaster> (app/layout.tsx); the radix
      // use-toast hook used previously has no toaster, so nothing showed.
      toast.success("Added to cart", {
        description: `${title} has been added to your cart.`,
        action: { label: "View cart", onClick: () => router.push("/cart") },
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Couldn't add to cart", { description: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      onClick={handleAddToCart}
      disabled={isLoading}
      className={className}
    >
      {showIcon && <Plus className="h-4 w-4" />}
      <span className={showIcon ? "ml-2" : ""}>
        {isLoading ? "Adding..." : "Add to Cart"}
      </span>
    </Button>
  );
};
