import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, Heart } from "lucide-react";
import { useCartStore, useWishlistStore } from "@/lib/stores";
import { useToast } from "@/components/hooks/use-toast";

interface CartItemProps {
  id: string;
  image?: string;
  title: string;
  variant: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  productId: string;
  size?: any;
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

export const CartItem = ({
  id,
  image,
  title,
  variant,
  price,
  originalPrice,
  quantity,
  productId,
  size,
  material,
  style,
  sole,
}: CartItemProps) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const { updateQuantity, removeItem } = useCartStore();
  const { addItem: addToWishlist, isItemInWishlist } = useWishlistStore();
  const { toast } = useToast();
  console.log(size);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => removeItem(id), 150);
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(id, newQuantity);
    }
  };

  const handleMoveToWishlist = () => {
    addToWishlist({
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
    removeItem(id);
    toast({
      title: "Moved to wishlist",
      description: "The item has been moved to your wishlist.",
    });
  };

  return (
    <div
      className={`flex gap-4 p-4 bg-cart-item border border-cart-border rounded-lg transition-all duration-150 ${isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
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
              {title?.replace("`", "'")}
            </h3>
            {/* <p className="text-muted-foreground text-sm mt-1">{variant}</p> */}
            {/* Display customization options */}
            <div className="text-xs text-muted-foreground mt-1 space-y-1">
              {size && (
                <p>
                  Size: {typeof size === 'string' ? size : (size.label || `${size.value || ''} ${size.region ? `(${size.region})` : ''}`)}
                </p>
              )}
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
          <div className="flex gap-1">
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={handleMoveToWishlist}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
              title="Move to wishlist"
            >
              <Heart className="h-4 w-4" />
            </Button> */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              title="Remove from cart"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Price and Quantity */}
        <div className="flex justify-between items-end mt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(quantity + 1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-right">
            {originalPrice && originalPrice > price && (
              <p className="text-muted-foreground text-sm line-through">
                ₹{originalPrice.toFixed(2)}
              </p>
            )}
            <p className="font-semibold text-cart-price">
              ₹{(price * quantity).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};