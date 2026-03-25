"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/cart/CartItem";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useToast } from "@/components/hooks/use-toast";
import { useCartStore } from "@/lib/stores";
import { useRouter } from "next/navigation";

import { Price } from "@/components/providers/CurrencyProvider";

const Cart = () => {
  const { toast } = useToast();
  const router = useRouter();
  const { items: cartItems, getTotalPrice, clearCart } = useCartStore();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error("Failed to load settings", err));
  }, []);

  // Re-initialize Razorpay Magic Checkout when settings are loaded
  useEffect(() => {
    if (settings?.integrations?.razorpayMagicCheckoutEnabled && (window as any).RazorpayMagicCheckout) {
      (window as any).RazorpayMagicCheckout.init({
        key_id: settings.integrations.razorpayKeyId,
      });
    }
  }, [settings]);

  const subtotal = getTotalPrice();
  
  // Tax calculation based on settings
  const isTaxEnabled = settings?.taxes?.enabled ?? true;
  const isTaxInclusive = settings?.taxes?.taxInclusive ?? false;
  const taxRate = isTaxEnabled ? (settings?.taxes?.defaultRate ?? 0) / 100 : 0;
  
  let taxes = 0;
  let total = subtotal;

  if (isTaxEnabled) {
    if (isTaxInclusive) {
      // If inclusive, tax is already in subtotal
      // Formula: tax = subtotal - (subtotal / (1 + rate))
      taxes = subtotal - (subtotal / (1 + taxRate));
      total = subtotal;
    } else {
      // If exclusive, add tax to subtotal
      taxes = subtotal * taxRate;
      total = subtotal + taxes;
    }
  }

  // Shipping calculation (can also be made dynamic later if needed, but keeping existing logic for now)
  const shipping = subtotal > 10000 ? 0 : 499; // Using a more realistic RS value or keeping it simple
  total += shipping;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Proceeding to checkout",
      description: "Redirecting to secure checkout...",
    });
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/');
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
          <Button size="lg" className="w-full" onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl bg-background py-8 container mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" className="p-2" onClick={handleContinueShopping}>
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
            />
          ))}

          <Button variant="outline" className="mt-4 w-full lg:w-auto" onClick={handleContinueShopping}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:w-96 flex-shrink-0">
          <OrderSummary 
            subtotal={subtotal} 
            shipping={shipping} 
            taxes={taxes} 
            total={total} 
            isTaxInclusive={isTaxInclusive}
          />

          <Button
            size="lg"
            className="w-full mt-4 bg-black hover:bg-gray-900 text-white"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </Button>

          {subtotal < 10000 && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mt-3">
              <p className="text-sm text-warning-foreground">
                <strong>Free shipping</strong> on orders over <Price amount={10000} />. Add <Price amount={10000 - subtotal} /> more to qualify!
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
