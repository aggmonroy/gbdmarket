export const TERMS = [3, 6, 12, 18, 24, 36] as const;
export type Term = typeof TERMS[number];

export type MemberType = "asociado" | "no_asociado";

// Recargo aplicado al precio contado según el tipo de cliente.
export const SURCHARGE: Record<MemberType, number> = {
  asociado: 0.35,
  no_asociado: 0.65,
};

export const MEMBER_LABEL: Record<MemberType, string> = {
  asociado: "Asociado",
  no_asociado: "No asociado",
};

const DOWN_PAYMENT_PCT = 0.1;

export function calcFinancing(priceCash: number, term: Term, member: MemberType) {
  const surcharge = SURCHARGE[member];
  const total = priceCash * (1 + surcharge);
  const down = Math.max(0, total * DOWN_PAYMENT_PCT);
  const principal = total - down;
  const monthly = principal / term;
  const biweekly = monthly / 2;
  return {
    surchargePct: surcharge,
    surchargeAmount: round(total - priceCash),
    down: round(down),
    monthly: round(monthly),
    biweekly: round(biweekly),
    totalFinanced: round(total),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function fmtUSD(n: number) {
  return new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" }).format(n);
}
