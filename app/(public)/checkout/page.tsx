"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgressProps";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { ShippingForm } from "@/components/checkout/ShippingForm";
import { ContactForm } from "@/components/checkout/ContactForm";
import { Shield, Lock } from "lucide-react";

const Checkout = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedShipping, setSelectedShipping] = useState<{ name: string; price: number }>({ name: "Standard", price: 15 });

  const orderItems = [
    {
      id: 1,
      name: "Premium Wireless Headphones",
      variant: "Black, Large",
      quantity: 1,
      price: 299.99,
      image: "/api/placeholder/80/80",
    },
    {
      id: 2,
      name: "Bluetooth Speaker",
      variant: "Blue",
      quantity: 2,
      price: 79.99,
      image: "/api/placeholder/80/80",
    },
  ];

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + selectedShipping.price + tax;

  const handleShippingSelect = (method: { name: string; price: number }) => setSelectedShipping(method);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Secure SSL encrypted checkout</span>
          </div>
        </div>

        {/* Progress */}
        <CheckoutProgress currentStep={currentStep} />

        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="bg-white border shadow-sm">
              <CardHeader className="pb-4 flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Contact Information</CardTitle>
                <Badge variant="secondary" className="text-xs">Step 1</Badge>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>

            {/* Shipping Form */}
            <Card className="bg-white border shadow-sm">
              <CardHeader className="pb-4 flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Shipping Address</CardTitle>
                <Badge variant="secondary" className="text-xs">Step 2</Badge>
              </CardHeader>
              <CardContent>
                <ShippingForm />
              </CardContent>
            </Card>

            {/* Shipping Method */}
            <Card className="bg-white border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Shipping Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  onClick={() => handleShippingSelect({ name: "Standard", price: 15 })}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${
                    selectedShipping.name === "Standard" ? "border-blue-600 bg-blue-50" : "hover:border-gray-400"
                  }`}
                >
                  <div>
                    <div className="font-medium text-gray-900">Standard Shipping</div>
                    <div className="text-sm text-gray-600">5-7 business days</div>
                  </div>
                  <div className="font-semibold text-gray-900">$15.00</div>
                </div>

                <div
                  onClick={() => handleShippingSelect({ name: "Express", price: 25 })}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${
                    selectedShipping.name === "Express" ? "border-blue-600 bg-blue-50" : "hover:border-gray-400"
                  }`}
                >
                  <div>
                    <div className="font-medium text-gray-900">Express Shipping</div>
                    <div className="text-sm text-gray-600">2-3 business days</div>
                  </div>
                  <div className="font-semibold text-gray-900">$25.00</div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card className="bg-white border shadow-sm">
              <CardHeader className="pb-4 flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Payment</CardTitle>
                <Badge variant="secondary" className="text-xs">Step 3</Badge>
              </CardHeader>
              <CardContent>
                <PaymentForm />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:sticky lg:top-8 lg:self-start space-y-4">
            <OrderSummary items={orderItems} subtotal={subtotal} shipping={selectedShipping.price} tax={tax} total={total} />

            {/* Trust Signals */}
            <div className="p-4 bg-white border rounded-lg flex items-center gap-2 text-sm text-gray-600">
              <Lock className="w-4 h-4" />
              <span>Your payment information is secure and encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
