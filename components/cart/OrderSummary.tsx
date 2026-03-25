import { Price } from "@/components/providers/CurrencyProvider";

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  taxes: number;
  total?: number;
  isTaxInclusive?: boolean;
  discount?: number;
}

export const OrderSummary = ({
  subtotal,
  shipping,
  taxes,
  total: providedTotal,
  isTaxInclusive = false,
  discount = 0,
}: OrderSummaryProps) => {
  const total = providedTotal ?? (subtotal + shipping + taxes - discount);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium"><Price amount={subtotal} /></span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium">
            {shipping === 0 ? 'Free' : <Price amount={shipping} />}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Taxes {isTaxInclusive && '(Included)'}</span>
          <span className="font-medium"><Price amount={taxes} /></span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span className="font-medium">-<Price amount={discount} /></span>
          </div>
        )}
        
        <hr className="border-border" />
        
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span><Price amount={total} /></span>
        </div>
      </div>
    </div>
  );
};