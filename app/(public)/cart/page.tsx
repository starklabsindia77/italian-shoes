"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/cart/CartItem";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useToast } from "@/components/hooks/use-toast";
import { useCartStore } from "@/lib/stores";
import { useRouter } from "next/navigation";

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
  const shipping = subtotal > 100 ? 0 : 9.99;
  const taxes = subtotal * 0.08;

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
          <OrderSummary subtotal={subtotal} shipping={shipping} taxes={taxes} />

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
                <strong>Free shipping</strong> on orders over ₹10000. Add ₹{(100 - subtotal).toFixed(2)} more to qualify!
              </p>
            </div>
          )}

          {settings?.integrations?.razorpayMagicCheckoutEnabled && (
            <div className="mt-4">
              <button
                id="razorpay-magic-checkout-button"
                className="w-full flex justify-center items-center px-4 py-3 bg-[#2463eb] text-white rounded-lg font-bold uppercase tracking-wider shadow-md hover:bg-[#1d4ed8] hover:shadow-lg transition-all"
              >
                ✨ Magic Checkout
              </button>
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                Fast & Secure 1-click checkout by Razorpay
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
