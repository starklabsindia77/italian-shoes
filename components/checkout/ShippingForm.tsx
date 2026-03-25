import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES } from "@/lib/constants";
import { useEffect, useState } from "react";

export function ShippingForm({ data, onChange }: { data: any, onChange: (key: string, value: any) => void }) {
  const [countries, setCountries] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(settings => {
        const active = settings?.localization?.supportedCountries?.filter((c: any) => c.active) || [];
        setCountries(active);
        // Default to India if it's the only one or if nothing selected
        if (!data.country && active.some((c: any) => c.code === "in")) {
          onChange("country", "in");
        }
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-checkout-text-primary">First name</Label>
          <Input
            id="firstName"
            placeholder="First name"
            value={data.firstName || ""}
            onChange={(e) => onChange("firstName", e.target.value)}
            className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-checkout-text-primary">Last name</Label>
          <Input
            id="lastName"
            placeholder="Last name"
            value={data.lastName || ""}
            onChange={(e) => onChange("lastName", e.target.value)}
            className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="text-checkout-text-primary">Address</Label>
        <Input
          id="address"
          placeholder="Street address"
          value={data.address || ""}
          onChange={(e) => onChange("address", e.target.value)}
          className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
        />
      </div>

      <div>
        <Input
          placeholder="Apartment, suite, etc. (optional)"
          value={data.apartment || ""}
          onChange={(e) => onChange("apartment", e.target.value)}
          className="bg-background border-border focus:ring-primary focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-1 lg:col-span-1">
          <Label htmlFor="city" className="text-checkout-text-primary">City</Label>
          <Input
            id="city"
            placeholder="City"
            value={data.city || ""}
            onChange={(e) => onChange("city", e.target.value)}
            className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <Label htmlFor="state" className="text-checkout-text-primary">State</Label>
          {data.country === "in" ? (
            <Select value={data.state} onValueChange={(v) => onChange("state", v)}>
              <SelectTrigger className="mt-1 bg-background border-border focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="state"
              placeholder="State"
              value={data.state || ""}
              onChange={(e) => onChange("state", e.target.value)}
              className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
            />
          )}
        </div>
        <div>
          <Label htmlFor="zip" className="text-checkout-text-primary">ZIP code</Label>
          <Input
            id="zip"
            placeholder="ZIP code"
            value={data.zip || ""}
            onChange={(e) => onChange("zip", e.target.value)}
            className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="country" className="text-checkout-text-primary">Country</Label>
        <Select value={data.country} onValueChange={(v) => onChange("country", v)}>
          <SelectTrigger className="mt-1 bg-background border-border focus:ring-primary focus:border-primary">
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
            ))}
            {countries.length === 0 && <SelectItem value="in">India</SelectItem>}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="phone" className="text-checkout-text-primary">Phone (optional)</Label>
        <Input
          id="phone"
          placeholder="Phone number"
          value={data.phone || ""}
          onChange={(e) => onChange("phone", e.target.value)}
          className="mt-1 bg-background border-border focus:ring-primary focus:border-primary"
        />
      </div>
    </div>
  );
}