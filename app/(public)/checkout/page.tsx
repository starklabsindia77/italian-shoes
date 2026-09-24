/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Price } from "@/components/providers/CurrencyProvider";
import Link from "next/link";
import Script from "next/script";
import { toast } from "sonner";

type PaymentFields =
  | { paymentGateway: "razorpay"; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
  | { paymentGateway: "cashfree"; cashfreeOrderId: string }
  | { paymentGateway: "cod" }
  | { paymentGateway: "none" };

/** What the shopper picks when both online payment and COD are available. */
type PaymentChoice = "online" | "cod";

/**
 * Stashed before opening Cashfree so that, if a payment method escapes the
 * modal and redirects the whole page, the order can still be saved when
 * Cashfree sends the shopper back to /checkout?cf_order_id=…
 */
const CF_PENDING_KEY = "cf_pending_checkout";

/** Hands the payment result to the server, which verifies it with the gateway before recording the order. */
async function saveOrder(orderPayload: Record<string, unknown>, payment: PaymentFields) {
  const saveResponse = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...orderPayload, ...payment }),
  });

  if (!saveResponse.ok) {
    const body = await saveResponse.json().catch(() => null);
    if (payment.paymentGateway === "none" || payment.paymentGateway === "cod") {
      // Nothing was charged, so there is no payment reference to quote. This is
      // also the path when the admin switches COD off mid-checkout.
      throw new Error(body?.error || "Your order could not be placed. Please try again.");
    }
    const ref = payment.paymentGateway === "cashfree" ? payment.cashfreeOrderId : payment.razorpayPaymentId;
    throw new Error(
      body?.error ||
        "Your payment went through but the order could not be saved. Please contact support with your payment reference: " +
          ref
    );
  }
}

const Checkout = () => {
  const [settings, setSettings] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedShipping, setSelectedShipping] = useState<{ id?: string; name: string; price: number }>({ name: "Standard", price: 0 });

  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("online");
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

  // Resume a Cashfree payment that finished via full-page redirect.
  useEffect(() => {
    const cfOrderId = new URLSearchParams(window.location.search).get("cf_order_id");
    if (!cfOrderId) return;
    let pending: { cashfreeOrderId: string; orderPayload: Record<string, unknown> } | null = null;
    try {
      pending = JSON.parse(sessionStorage.getItem(CF_PENDING_KEY) || "null");
    } catch {
      // storage unavailable — fall through to the support message
    }
    if (!pending || pending.cashfreeOrderId !== cfOrderId) {
      toast.error(`We couldn't resume your checkout. If you were charged, contact support with reference ${cfOrderId}.`);
      return;
    }
    setIsProcessing(true);
    saveOrder(pending.orderPayload, { paymentGateway: "cashfree", cashfreeOrderId: cfOrderId })
      .then(() => {
        try { sessionStorage.removeItem(CF_PENDING_KEY); } catch { /* ignore */ }
        clearCart();
        window.location.href = "/orders/success";
      })
      .catch((err: any) => {
        toast.error(err.message || "Failed to save order.");
        setIsProcessing(false);
      });
    // Runs once on landing; clearCart is a stable store action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read from the server's settings, never hardcoded: when the admin switches
  // COD off, it disappears from checkout on the next settings load.
  const codAvailable = settings?.payments?.codEnabled === true;
  const onlineAvailable = (settings?.integrations?.paymentGateway ?? "razorpay") !== "none";

  // If COD is withdrawn while this page is open, fall back to online payment so
  // the shopper is never left on an option the server will reject.
  useEffect(() => {
    if (!codAvailable && paymentChoice === "cod") setPaymentChoice("online");
    if (!onlineAvailable && codAvailable) setPaymentChoice("cod");
  }, [codAvailable, onlineAvailable, paymentChoice]);

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

    if (!contactData.email) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!shippingData.firstName || !shippingData.address || !shippingData.city || !shippingData.zip) {
      toast.error("Please complete your shipping address.");
      return;
    }

    const configured = settings?.integrations?.paymentGateway;
    const gateway: "razorpay" | "cashfree" | "none" =
      configured === "cashfree" || configured === "none" ? configured : "razorpay";

    // COD only counts if the store has it switched on right now; `codAvailable`
    // is recomputed from settings on every render, so a shopper cannot keep a
    // stale selection. The server checks again regardless.
    const payingByCod = codAvailable && paymentChoice === "cod";

    if (!payingByCod && gateway === "cashfree" && !shippingData.phone) {
      toast.error("Please enter your mobile number.");
      return;
    }

    setIsProcessing(true);

    const cartItems = items.map((it) => ({ productId: it.productId, quantity: it.quantity }));
    const customerName = [shippingData.firstName, shippingData.lastName].filter(Boolean).join(" ");
    const orderPayload = {
      orderNumber: "ORD-" + Date.now().toString().slice(-6),
      customerEmail: contactData.email,
      customerFirstName: shippingData.firstName,
      customerLastName: shippingData.lastName,
      customerPhone: shippingData.phone,
      isGuest: true,
      shippingAddress: shippingData,
      billingAddress: shippingData, // Same as shipping for now
      shippingMethodId: selectedShipping.id ?? null,
      items: items.map(it => ({
        productId: it.productId,
        quantity: it.quantity,
        designThumbnail: it.image || null,
        designConfig: it.config || null,
        styleId: it.style?.id || null,
        soleId: it.sole?.id || null,
        sizeId: typeof it.size === "string" ? it.size : (it.size as { id?: string } | undefined)?.id || null,
        panelCustomization: it.config || {},
      }))
    };

    const readError = async (response: Response, fallback: string) => {
      const errorData = await response.json().catch(() => null);
      return errorData?.error || fallback;
    };

    const finish = () => {
      toast.success("Order placed successfully!");
      clearCart();
      window.location.href = "/orders/success";
    };

    try {
      if (payingByCod) {
        // Cash on Delivery: nothing is charged now. The server re-checks that
        // COD is still enabled and records the order as payment-pending.
        await saveOrder(orderPayload, { paymentGateway: "cod" });
        finish();
        return;
      }

      if (gateway === "none") {
        // No online payment: the server records the order as payment-pending.
        await saveOrder(orderPayload, { paymentGateway: "none" });
        finish();
        return;
      }

      if (gateway === "cashfree") {
        // 1. Server prices the cart and opens a Cashfree order.
        const response = await fetch("/api/cashfree/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartItems,
            shippingMethodId: selectedShipping.id ?? null,
            customer: { email: contactData.email, phone: shippingData.phone, name: customerName },
          }),
        });
        if (!response.ok) throw new Error(await readError(response, "Failed to create payment order"));
        const cfOrder = await response.json();

        try {
          sessionStorage.setItem(
            CF_PENDING_KEY,
            JSON.stringify({ cashfreeOrderId: cfOrder.cashfreeOrderId, orderPayload })
          );
        } catch {
          // Quota or privacy mode: the modal path below still works without it.
        }

        // 2. Open the Cashfree modal. The SDK script is only fetched on demand.
        const { load } = await import("@cashfreepayments/cashfree-js");
        const cashfree = await load({ mode: cfOrder.environment });
        const result = await cashfree.checkout({
          paymentSessionId: cfOrder.paymentSessionId,
          redirectTarget: "_modal",
        });

        if (result.error) {
          toast.error("Payment failed: " + (result.error.message || "please try again."));
          return;
        }
        if (result.redirect) return; // Page is navigating away; the resume effect takes over.

        // 3. Server confirms with Cashfree that the order is PAID before saving.
        await saveOrder(orderPayload, { paymentGateway: "cashfree", cashfreeOrderId: cfOrder.cashfreeOrderId });
        try { sessionStorage.removeItem(CF_PENDING_KEY); } catch { /* ignore */ }
        finish();
        return;
      }

      // 1. Ask the server to price the cart and open a Razorpay order. Amounts
      //    are derived server-side from database prices — never sent from here.
      const response = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          shippingMethodId: selectedShipping.id ?? null,
        }),
      });
      if (!response.ok) throw new Error(await readError(response, "Failed to create payment order"));

      const orderData = await response.json();

      // 2. Open Razorpay Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: settings?.general?.storeName || "Italian Shoes",
        description: "Order Payment",
        order_id: orderData.razorpayOrderId,
        handler: async function (paymentResponse: any) {
          try {
            // 3. Hand the signed payment result to the server, which verifies it
            //    against the Razorpay secret before recording the order.
            await saveOrder(orderPayload, {
              paymentGateway: "razorpay",
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            });
            finish();
          } catch (err: any) {
            toast.error(err.message || "Failed to save order.");
          }
        },
        prefill: {
          name: customerName,
          email: contactData.email,
          contact: shippingData.phone,
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
      {settings && (settings.integrations?.paymentGateway ?? "razorpay") === "razorpay" && (
        <Script
          id="razorpay-checkout"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      )}
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

            {/* Only shown when there is an actual choice to make: COD enabled
                by the admin AND an online gateway configured. */}
            {codAvailable && onlineAvailable && (
              <Card className="bg-white border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {([
                    {
                      id: "online" as PaymentChoice,
                      title: "Online Payment",
                      description: "Pay securely by card, UPI, net banking or wallet.",
                    },
                    {
                      id: "cod" as PaymentChoice,
                      title: "Cash on Delivery",
                      description: "Pay in cash when your order is delivered.",
                    },
                  ]).map((option) => {
                    const selected = paymentChoice === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                          selected ? "border-blue-600 bg-blue-50" : "hover:border-gray-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.id}
                          checked={selected}
                          onChange={() => setPaymentChoice(option.id)}
                          className="mt-1 size-4 accent-blue-600"
                        />
                        <span className="min-w-0">
                          <span className="block font-medium text-gray-900">{option.title}</span>
                          <span className="block text-sm text-gray-600">{option.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <div className="pt-4">
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-4 lg:py-6 text-base lg:text-lg"
                size="lg"
                onClick={handleCompleteOrder}
                disabled={isProcessing}
              >
                <Shield className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                {isProcessing
                  ? "Processing..."
                  : (codAvailable && paymentChoice === "cod") ||
                      settings?.integrations?.paymentGateway === "none"
                    ? "Place Order"
                    : "Complete Order"}
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start space-y-4">
            <OrderSummary 
              items={items as any} 
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
