import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function ContactForm() {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="email" className="text-checkout-text-primary">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="newsletter" />
        <Label
          htmlFor="newsletter"
          className="text-sm text-checkout-text-secondary cursor-pointer"
        >
          Keep me up to date on news and exclusive offers
        </Label>
      </div>
    </div>
  );
}