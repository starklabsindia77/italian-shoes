import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X } from "lucide-react";

interface CartItemProps {
  id: string;
  image?: string;
  title: string;
  variant: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export const CartItem = ({
  id,
  image,
  title,
  variant,
  price,
  originalPrice,
  quantity,
  onQuantityChange,
  onRemove,
}: CartItemProps) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(id), 150);
  };

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity >= 1) {
      onQuantityChange(id, newQuantity);
    }
  };

  return (
    <div 
      className={`flex gap-4 p-4 bg-cart-item border border-cart-border rounded-lg transition-all duration-150 ${
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
            <p className="text-muted-foreground text-sm mt-1">{variant}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Price and Quantity */}
        <div className="flex justify-between items-end mt-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateQuantity(quantity - 1)}
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
              onClick={() => updateQuantity(quantity + 1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-right">
            {originalPrice && originalPrice > price && (
              <p className="text-muted-foreground text-sm line-through">
                ${originalPrice.toFixed(2)}
              </p>
            )}
            <p className="font-semibold text-cart-price">
              ${(price * quantity).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};