import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutProgressProps {
  currentStep: number;
}

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  const steps = [
    { number: 1, title: "Information", completed: currentStep > 1 },
    { number: 2, title: "Shipping", completed: currentStep > 2 },
    { number: 3, title: "Payment", completed: currentStep > 3 },
  ];

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-8 overflow-x-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-shrink-0">
            <div className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-200",
                  step.completed
                    ? "bg-checkout-success border-checkout-success text-white"
                    : currentStep === step.number
                    ? "bg-primary border-primary text-white"
                    : "bg-checkout-card border-checkout-section-border text-checkout-text-secondary"
                )}
              >
                {step.completed ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <span className="text-xs sm:text-sm font-medium">{step.number}</span>
                )}
              </div>
              <div className="ml-2 sm:ml-3 hidden sm:block">
                <div
                  className={cn(
                    "text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                    step.completed || currentStep === step.number
                      ? "text-checkout-text-primary"
                      : "text-checkout-text-secondary"
                  )}
                >
                  {step.title}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "ml-2 sm:ml-4 lg:ml-8 w-4 sm:w-8 lg:w-16 h-0.5 transition-colors",
                  step.completed
                    ? "bg-checkout-success"
                    : "bg-checkout-section-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}