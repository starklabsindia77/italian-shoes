import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ShippingForm() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-checkout-text-primary">First name</Label>
          <Input
            id="firstName"
            placeholder="First name"
            className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-checkout-text-primary">Last name</Label>
          <Input
            id="lastName"
            placeholder="Last name"
            className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="text-checkout-text-primary">Address</Label>
        <Input
          id="address"
          placeholder="Street address"
          className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
        />
      </div>

      <div>
        <Input
          placeholder="Apartment, suite, etc. (optional)"
          className="bg-background border-border focus:ring-primary focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-1 lg:col-span-1">
          <Label htmlFor="city" className="text-checkout-text-primary">City</Label>
          <Input
            id="city"
            placeholder="City"
            className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <Label htmlFor="state" className="text-checkout-text-primary">State</Label>
          <Select>
            <SelectTrigger className="mt-1 bg-background border-border focus:ring-primary focus:border-primary">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ca">California</SelectItem>
              <SelectItem value="ny">New York</SelectItem>
              <SelectItem value="tx">Texas</SelectItem>
              <SelectItem value="fl">Florida</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="zip" className="text-checkout-text-primary">ZIP code</Label>
          <Input
            id="zip"
            placeholder="ZIP code"
            className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="country" className="text-checkout-text-primary">Country</Label>
        <Select>
          <SelectTrigger className="mt-1 bg-background border-border focus:ring-primary focus:border-primary">
            <SelectValue placeholder="United States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}