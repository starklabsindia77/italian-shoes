import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Heart, ShoppingCart, Eye } from "lucide-react";
import { useWishlistStore, useCartStore } from "@/lib/stores";
import { useToast } from "@/components/hooks/use-toast";
import { useRouter } from "next/navigation";

interface WishlistItemProps {
  id: string;
  productId: string;
  image?: string;
  title: string;
  price: number;
  originalPrice?: number;
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
}

export const WishlistItem = ({
  id,
  productId,
  image,
  title,
  price,
  originalPrice,
  variant,
  size,
  material,
  style,
  sole,
}: WishlistItemProps) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const { removeItem } = useWishlistStore();
  const { addItem: addToCart, isItemInCart } = useCartStore();
  const { toast } = useToast();
  const router = useRouter();

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => removeItem(id), 150);
    toast({
      title: "Removed from wishlist",
      description: "The item has been removed from your wishlist.",
    });
  };

  const handleAddToCart = () => {
    addToCart({
      productId,
      title,
      variant: variant || 'Default',
      price,
      originalPrice,
      quantity: 1,
      image,
      size,
      material,
      style,
      sole,
    });
    removeItem(id);
    toast({
      title: "Added to cart",
      description: "The item has been moved to your cart.",
    });
  };

  const handleViewProduct = () => {
    router.push(`/product/${productId}`);
  };

  const isInCart = isItemInCart(productId, variant || 'Default');

  return (
    <div 
      className={`flex gap-4 p-4 bg-card border border-border rounded-lg transition-all duration-150 ${
        isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* Product Image */}
      {image && (
        <div className="flex-shrink-0">
          <img
            src={image}
            alt={title}
            className="w-20 h-20 object-cover rounded-md"
          />
        </div>
      )}

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-foreground text-sm leading-tight">
              {title}
            </h3>
            {variant && (
              <p className="text-muted-foreground text-sm mt-1">{variant}</p>
            )}
            {/* Display customization options */}
            <div className="text-xs text-muted-foreground mt-1 space-y-1">
              {size && <p>Size: {size.name} ({size.region})</p>}
              {material && (
                <p>
                  Material: {material.name}
                  {material.color && ` - ${material.color.name}`}
                </p>
              )}
              {style && <p>Style: {style.name}</p>}
              {sole && <p>Sole: {sole.name}</p>}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            title="Remove from wishlist"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Price and Actions */}
        <div className="flex justify-between items-end mt-3">
          <div className="text-right">
            {originalPrice && originalPrice > price && (
              <p className="text-muted-foreground text-sm line-through">
                ${originalPrice.toFixed(2)}
              </p>
            )}
            <p className="font-semibold text-foreground">
              ${price.toFixed(2)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewProduct}
              className="h-8 px-3"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleAddToCart}
              disabled={isInCart}
              className="h-8 px-3"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              {isInCart ? 'In Cart' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
