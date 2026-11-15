import type { Currency, Classification } from "./types";

// أسعار صرف تقريبية (نظام مغلق — قيم استرشادية)
const RATE_USD = 1.12; // 1 CHF ≈ 1.12 USD
const BTC_PRICE_CHF = 98000; // سعر البيتكوين بالفرنك

export function convert(valueChf: number, currency: Currency): number {
  if (currency === "USD") return valueChf * RATE_USD;
  if (currency === "BTC") return valueChf / BTC_PRICE_CHF;
  return valueChf;
}

export function symbolOf(currency: Currency): string {
  if (currency === "USD") return "$";
  if (currency === "BTC") return "₿";
  return "";
}

export function formatMoney(valueChf: number, currency: Currency): string {
  const v = convert(valueChf, currency);
  if (currency === "BTC") {
    return `₿ ${v.toFixed(v < 1 ? 4 : 2)}`;
  }
  if (currency === "USD") {
    return `$ ${Math.round(v).toLocaleString("en-US")}`;
  }
  return `${Math.round(v).toLocaleString("en-US")} CHF`;
}

const CLASS_ORDER: Record<Classification, number> = {
  "عام داخلي": 0,
  "محدود": 1,
  "سري": 2,
  "سري جدًا": 3,
};

export function classificationRank(c: Classification): number {
  return CLASS_ORDER[c] ?? 0;
}

export function classLabel(c: Classification): string {
  return c;
}
