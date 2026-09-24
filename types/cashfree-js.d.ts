// @cashfreepayments/cashfree-js ships without type declarations. Only the
// surface the checkout page uses is described here.
declare module "@cashfreepayments/cashfree-js" {
  export type CashfreeCheckoutResult = {
    error?: { message?: string; code?: string; type?: string };
    redirect?: boolean;
    paymentDetails?: { paymentMessage?: string };
  };

  export type CashfreeInstance = {
    checkout(options: {
      paymentSessionId: string;
      redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | HTMLElement;
    }): Promise<CashfreeCheckoutResult>;
  };

  export function load(options: { mode: "sandbox" | "production" }): Promise<CashfreeInstance>;
}
