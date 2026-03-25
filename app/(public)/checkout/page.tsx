"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgressProps";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { ShippingForm } from "@/components/checkout/ShippingForm";
import { ContactForm } from "@/components/checkout/ContactForm";
import { Shield, Lock, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { Price, useCurrency } from "@/components/providers/CurrencyProvider";
import Link from "next/link";
import Script from "next/script";
import { toast } from "sonner";

const Checkout = () => {
  const { currency: selectedCurrency } = useCurrency();
  const [settings, setSettings] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedShipping, setSelectedShipping] = useState<{ id?: string; name: string; price: number }>({ name: "Standard", price: 0 });

  const [contactData, setContactData] = useState({ email: "", newsletter: false });
  const [shippingData, setShippingData] = useState({
    firstName: "", lastName: "", address: "", apartment: "", city: "", state: "", zip: "", country: "in", phone: ""
  });

  const { items, getTotalPrice, clearCart } = useCartStore();

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        // Set default shipping if available
        const activeMethods = data?.shipping?.methods?.filter((m: any) => m.active) || [];
        if (activeMethods.length > 0) {
          setSelectedShipping(activeMethods[0]);
        }
      })
      .catch((err) => console.error("Failed to load settings", err));
  }, []);

  const subtotal = getTotalPrice();
  
  // Tax calculation based on settings
  const isTaxEnabled = settings?.taxes?.enabled ?? true;
  const isTaxInclusive = settings?.taxes?.taxInclusive ?? false;
  const taxRate = isTaxEnabled ? (settings?.taxes?.defaultRate ?? 0) / 100 : 0;
  
  let tax = 0;
  let total = subtotal;

  if (isTaxEnabled) {
    if (isTaxInclusive) {
      // If inclusive, tax is already in subtotal
      tax = subtotal - (subtotal / (1 + taxRate));
      total = subtotal;
    } else {
      // If exclusive, add tax to subtotal 
      tax = subtotal * taxRate;
      total = subtotal + tax;
    }
  }

  // Add shipping price
  total += selectedShipping.price;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">You need to add some items to your cart before checking out.</p>
          <Button asChild className="w-full">
            <Link href="/collections">
              Continue Shopping
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleContactChange = (key: string, value: any) => setContactData(prev => ({ ...prev, [key]: value }));
  const handleShippingChange = (key: string, value: any) => setShippingData(prev => ({ ...prev, [key]: value }));

  const handleShippingSelect = (method: { id?: string; name: string; price: number }) => setSelectedShipping(method);

  const handleCompleteOrder = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Create order on server
      const response = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: selectedCurrency,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create payment order";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Fallback if response is not JSON
        }
        throw new Error(errorMessage);
      }

      const orderData = await response.json();

      // 2. Open Razorpay Modal
      const options = {
        key: settings?.integrations?.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: settings?.general?.storeName || "Italian Shoes",
        description: "Order Payment",
        order_id: orderData.id,
        handler: async function (paymentResponse: any) {
          try {
            // 3. Save order to DB
            const orderPayload = {
              orderId: paymentResponse.razorpay_order_id,
              orderNumber: "ORD-" + Date.now().toString().slice(-6),
              customerEmail: contactData.email,
              customerFirstName: shippingData.firstName,
              customerLastName: shippingData.lastName,
              customerPhone: shippingData.phone,
              isGuest: true,
              shippingAddress: shippingData,
              billingAddress: shippingData, // Same as shipping for now
              subtotal: Math.round(subtotal),
              tax: Math.round(tax),
              shippingAmount: Math.round(selectedShipping.price),
              shippingMethodId: selectedShipping.id || "std",
              shippingMethodName: selectedShipping.name,
              discount: 0,
              total: Math.round(total),
              currency: selectedCurrency,
              items: items.map(it => ({
                productId: it.productId,
                productTitle: it.title,
                quantity: it.quantity,
                price: Math.round(it.price),
                totalPrice: Math.round(it.price * it.quantity),
                designThumbnail: it.image || null,
                designConfig: it.config || null,
                styleId: it.style?.id || null,
                soleId: it.sole?.id || null,
                sizeId: typeof it.size === "string" ? it.size : it.size?.id || null,
                panelCustomization: it.config || {},
              }))
            };

            const saveResponse = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(orderPayload),
            });

            if (!saveResponse.ok) throw new Error("Payment succeeded but failed to save order details.");

            toast.success("Order placed successfully!");
            clearCart();
            window.location.href = "/orders/success";
          } catch (err: any) {
            toast.error(err.message || "Failed to save order.");
          }
        },
        prefill: {
          name: "", // You could get this from your shipping form state
          email: "", // You could get this from your contact form state
          contact: "",
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } catch (error: any) {
      console.error("Order completion error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Script
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <div className="container mx-auto px-4 py-8">
        {/* ... existing code ... */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Secure SSL encrypted checkout</span>
          </div>

          <div className="flex flex-col items-center gap-4 mt-6">
            {settings?.integrations?.shiprocketFasterCheckoutEnabled && (
              <div className="bg-[#f3f0ff] border border-[#d8ccff] p-4 rounded-xl max-w-md w-full shadow-sm">
                <p className="text-[#4b1dbd] text-sm font-medium mb-3">Skip the forms and checkout in 1-click!</p>
                <button
                  id="fastrr-checkout-button"
                  className="w-full bg-[#6328ff] text-white py-2.5 rounded-lg font-bold shadow-md hover:bg-[#5219e6] transition-colors flex items-center justify-center gap-2"
                >
                  🚀 Faster Checkout
                </button>
              </div>
            )}
          </div>
        </div>

        <CheckoutProgress currentStep={currentStep} />

        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <div className="space-y-6">
            <Card className="bg-white border shadow-sm">
              <CardHeader className="pb-4 flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Contact Information</CardTitle>
                <Badge variant="secondary" className="text-xs">Step 1</Badge>
              </CardHeader>
              <CardContent>
                <ContactForm data={contactData} onChange={handleContactChange} />
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardHeader className="pb-4 flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Shipping Address</CardTitle>
                <Badge variant="secondary" className="text-xs">Step 2</Badge>
              </CardHeader>
              <CardContent>
                <ShippingForm data={shippingData} onChange={handleShippingChange} />
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Shipping Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(settings?.shipping?.methods?.filter((m: any) => m.active) || []).map((method: any) => (
                  <div
                    key={method.id}
                    onClick={() => handleShippingSelect(method)}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${selectedShipping.id === method.id ? "border-blue-600 bg-blue-50" : "hover:border-gray-400"
                      }`}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                    <div className="font-semibold text-gray-900"><Price amount={method.price} /></div>
                  </div>
                ))}

                {(!settings?.shipping?.methods || settings.shipping.methods.filter((m: any) => m.active).length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No shipping methods available at the moment.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="pt-4">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-4 lg:py-6 text-base lg:text-lg"
                size="lg"
                onClick={handleCompleteOrder}
                disabled={isProcessing}
              >
                <Shield className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                {isProcessing ? "Processing..." : "Complete Order"}
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start space-y-4">
            <OrderSummary 
              items={items} 
              subtotal={subtotal} 
              shipping={selectedShipping.price} 
              tax={tax} 
              total={total} 
              isTaxInclusive={isTaxInclusive} 
            />
            <div className="p-4 bg-white border rounded-lg flex items-center gap-2 text-sm text-gray-600">
              <Lock className="w-4 h-4" />
              <span>Your information is secure and encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
