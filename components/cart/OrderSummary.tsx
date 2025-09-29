interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  taxes: number;
  discount?: number;
}

export const OrderSummary = ({
  subtotal,
  shipping,
  taxes,
  discount = 0,
}: OrderSummaryProps) => {
  const total = subtotal + shipping + taxes - discount;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium">
            {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Taxes</span>
          <span className="font-medium">${taxes.toFixed(2)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span className="font-medium">-${discount.toFixed(2)}</span>
          </div>
        )}
        
        <hr className="border-border" />
        
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};