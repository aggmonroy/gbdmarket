export const TERMS = [3, 6, 12, 18, 24, 36] as const;
export type Term = typeof TERMS[number];

// Tasa de financiamiento cooperativa aproximada (interés simple anual ~12%).
// Configurable luego desde el admin si se requiere.
const ANNUAL_RATE = 0.12;
const DOWN_PAYMENT_PCT = 0.1;

export function calcFinancing(priceCash: number, term: Term) {
  const down = Math.max(0, priceCash * DOWN_PAYMENT_PCT);
  const principal = priceCash - down;
  const interest = principal * ANNUAL_RATE * (term / 12);
  const total = principal + interest;
  const monthly = total / term;
  const biweekly = monthly / 2;
  return {
    down: round(down),
    monthly: round(monthly),
    biweekly: round(biweekly),
    totalFinanced: round(total + down),
    interest: round(interest),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function fmtUSD(n: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(n);
}
