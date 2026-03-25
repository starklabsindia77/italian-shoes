"use client";

import React from "react";
import { CheckCircle2, ShoppingBag, ArrowRight, Package, Truck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Success Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.1 
          }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-sm">
            <CheckCircle2 size={64} strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            Thank you for your purchase. We've received your order and are getting it ready for shipment.
          </p>
        </motion.div>

        {/* Order Next Steps / Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left"
        >
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Mail size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Confirmation</h3>
            <p className="text-sm text-gray-500">
              Check your email for order details and receipt.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Package size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Processing</h3>
            <p className="text-sm text-gray-500">
              Our artisans are now crafting your premium footwear.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
              <Truck size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Shipping</h3>
            <p className="text-sm text-gray-500">
              We'll notify you as soon as your order is on its way.
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button asChild size="lg" className="bg-black hover:bg-gray-900 text-white px-8 h-12 rounded-full">
            <Link href="/collections" className="flex items-center gap-2">
              <ShoppingBag size={18} />
              Continue Shopping
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 border-gray-200 hover:bg-gray-50 rounded-full px-8">
            <Link href="/" className="flex items-center gap-2">
              Back to Home
              <ArrowRight size={18} />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
