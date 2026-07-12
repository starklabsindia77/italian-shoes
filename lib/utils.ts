import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAssetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;

  // Keep local directories local to bypass S3 CDN
  if (path.startsWith("/leather/") || path.startsWith("/img/") || path.startsWith("/models/") || path.startsWith("/placeholder/")) {
    return path;
  }

  const cdnUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
  if (!cdnUrl || cdnUrl.includes("your-distribution")) return path;

  const baseUrl = cdnUrl.endsWith("/") ? cdnUrl.slice(0, -1) : cdnUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Encode the URI path to ensure special characters like backticks and spaces resolve correctly
  return `${baseUrl}${encodeURI(normalizedPath)}`;
}

export function formatCurrency(amount: number, currency = "INR", locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
