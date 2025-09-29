"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/cart/CartItem";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useToast } from "@/components/hooks/use-toast";

interface CartItemType {
  id: string;
  image?: string;
  title: string;
  variant: string;
  price: number;
  originalPrice?: number;
  quantity: number;
}

const Cart = () => {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItemType[]>([
    {
      id: "1",
      title: "Classic Cotton T-Shirt",
      variant: "White / Large",
      price: 29.99,
      originalPrice: 39.99,
      quantity: 2,
    },
    {
      id: "2",
      title: "Premium Denim Jeans",
      variant: "Dark Blue / 32W x 34L",
      price: 89.99,
      quantity: 1,
    },
    {
      id: "3",
      title: "Canvas Sneakers",
      variant: "White / Size 9",
      price: 79.99,
      quantity: 1,
    },
  ]);

  const handleQuantityChange = (id: string, quantity: number) => {
    setCartItems(items =>
      items.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const taxes = subtotal * 0.08;

  const handleCheckout = () => {
    toast({
      title: "Proceeding to checkout",
      description: "Redirecting to secure checkout...",
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-xl mx-auto text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button size="lg" className="w-full">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground text-sm">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {cartItems.map(item => (
            <CartItem
              key={item.id}
              {...item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveItem}
            />
          ))}

          <Button variant="outline" className="mt-4 w-full lg:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:w-96 flex-shrink-0">
          <OrderSummary subtotal={subtotal} shipping={shipping} taxes={taxes} />

          <Button
            size="lg"
            className="w-full mt-4 bg-black hover:bg-gray-900"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </Button>

          {subtotal < 100 && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mt-3">
              <p className="text-sm text-warning-foreground">
                <strong>Free shipping</strong> on orders over $100. Add ${(100 - subtotal).toFixed(2)} more to qualify!
              </p>
            </div>
          )}

          {/* Security badges */}
          <div className="text-center text-sm text-muted-foreground mt-4 space-y-1">
            <p>🔒 Secure checkout</p>
            <p>Free returns within 30 days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
