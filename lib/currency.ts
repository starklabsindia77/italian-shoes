export async function fetchExchangeRates(baseCurrency: string = "INR") {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) throw new Error("Failed to fetch rates");
    const data = await res.json();
    return data.rates;
  } catch (error) {
    console.error("Currency conversion error:", error);
    // Return hardcoded fallbacks if API fails
    return {
      "USD": 0.012,
      "EUR": 0.011,
      "GBP": 0.0094,
      "INR": 1
    };
  }
}

export function convertPrice(amount: number, from: string, to: string, rates: Record<string, number>) {
  if (from === to) return amount;
  
  // All our internal prices are in INR, so rates are relative to INR
  // If from=INR, to=USD: amount * rates["USD"]
  // If from=USD, to=INR: amount / rates["USD"]
  
  if (from === "INR") {
    return amount * (rates[to] || 1);
  }
  
  if (to === "INR") {
    return amount / (rates[from] || 1);
  }
  
  // Cross conversion: USD -> EUR => (USD -> INR) -> EUR
  const inr = amount / (rates[from] || 1);
  return inr * (rates[to] || 1);
}
