import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCard, Shield } from "lucide-react";

export function PaymentForm() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <span className="font-medium text-checkout-text-primary">Credit Card</span>
      </div>

      <div>
        <Label htmlFor="cardNumber" className="text-checkout-text-primary">Card number</Label>
        <Input
          id="cardNumber"
          placeholder="1234 5678 9012 3456"
          className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiry" className="text-checkout-text-primary">Expiry date</Label>
          <Input
            id="expiry"
            placeholder="MM/YY"
            className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <Label htmlFor="cvv" className="text-checkout-text-primary">CVV</Label>
          <Input
            id="cvv"
            placeholder="123"
            className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cardName" className="text-checkout-text-primary">Name on card</Label>
        <Input
          id="cardName"
          placeholder="John Doe"
          className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
        />
      </div>

      <div className="pt-4">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-4 lg:py-6 text-base lg:text-lg"
          size="lg"
        >
          <Shield className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
          Complete Order
        </Button>
      </div>

      <div className="text-xs text-checkout-text-secondary text-center">
        By completing your order, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
}