import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  id: number;
  name: string;
  variant: string;
  quantity: number;
  price: number;
  image: string;
}

interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export function OrderSummary({ items, subtotal, shipping, tax, total }: OrderSummaryProps) {
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
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-muted rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-primary/20 rounded"></div>
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
                  {item.name}
                </h4>
                <p className="text-checkout-text-secondary text-xs mt-1 truncate">
                  {item.variant}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-checkout-text-primary text-sm lg:text-base">
                  ${(item.price * item.quantity).toFixed(2)}
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
            <span className="text-checkout-text-primary">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-checkout-text-secondary">Shipping</span>
            <span className="text-checkout-text-primary">${shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-checkout-text-secondary">Tax</span>
            <span className="text-checkout-text-primary">${tax.toFixed(2)}</span>
          </div>
          
          <Separator className="bg-checkout-section-border" />
          
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-checkout-text-primary">Total</span>
            <span className="text-checkout-text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}