import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Price } from "@/components/providers/CurrencyProvider";

interface OrderItem {
  id: string;
  title: string;
  variant: string;
  quantity: number;
  price: number;
  image?: string;
  size?: {
    id: string;
    label: string;
    value?: string;
  };
}

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  isTaxInclusive?: boolean;
}

export function OrderSummary({ items, subtotal, shipping, tax, total, isTaxInclusive = false }: OrderSummaryProps) {
  return (
    <Card className="bg-checkout-card border-checkout-section-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-checkout-text-primary">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 lg:gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-primary/20 rounded"></div>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-4 w-4 lg:h-5 lg:w-5 p-0 text-xs flex items-center justify-center"
                >
                  {item.quantity}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-checkout-text-primary text-sm leading-tight truncate">
                  {item.title}
                </h4>
                <div className="flex flex-col gap-0.5 mt-1">
                  <p className="text-checkout-text-secondary text-xs truncate">
                    {item.variant}
                  </p>
                  {item.size && (
                    <p className="text-checkout-text-secondary text-xs font-medium truncate">
                      Size: {item.size.label || item.size.id}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-checkout-text-primary text-sm lg:text-base">
                  <Price amount={item.price * item.quantity} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="bg-checkout-section-border" />

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-checkout-text-secondary">Subtotal</span>
            <span className="text-checkout-text-primary font-medium"><Price amount={subtotal} /></span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-checkout-text-secondary">Shipping</span>
            <span className="text-checkout-text-primary font-medium">{shipping === 0 ? "Free" : <Price amount={shipping} />}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-checkout-text-secondary">Tax {isTaxInclusive && '(Included)'}</span>
            <span className="text-checkout-text-primary font-medium"><Price amount={tax} /></span>
          </div>

          <Separator className="bg-checkout-section-border" />

          <div className="flex justify-between text-lg font-semibold">
            <span className="text-checkout-text-primary">Total</span>
            <span className="text-checkout-text-primary"><Price amount={total} /></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}