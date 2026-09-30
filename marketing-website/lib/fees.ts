/** Marketplace settlement fee configuration. All fee copy should use these values. */
export const FEE_PAYER = "lender" as const satisfies "lender" | "adviser" | "borrower";
export const FEE_BPS = 25;
export const EXAMPLE_FACILITY_CENTS = 500_000_000;

export function feeCents(facilityCents: number): number {
  return Math.round((facilityCents * FEE_BPS) / 10_000);
}

export function formatNZD(cents: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function feeExample(): string {
  return `A ${formatNZD(EXAMPLE_FACILITY_CENTS)} facility → ${formatNZD(feeCents(EXAMPLE_FACILITY_CENTS))} fee (+ GST), charged only at settlement.`;
}
