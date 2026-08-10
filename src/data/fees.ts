/* Fee schedule (HANDOFF section 5), verified against Fees_Flyer_AME_8_2025.pdf.
   Structured so the same numbers drive the mockup fee tables now and the real
   tiered calculator in Phase 2. One source of truth: no fee is typed twice. */

export const fees = {
  /** Sale escrow: base + per-thousand of sale price, charged to each side. */
  sale: {
    base: 300,
    perThousand: 2.15,
    label: '$300 + $2.15/K',
  },

  /** SFR refinance, flat tiers by loan amount. `max: null` means "quoted". */
  sfrRefinance: {
    tiers: [
      { upTo: 750_000, flat: 650, label: 'Up to $750,000' },
      { upTo: 1_000_000, flat: 850, label: '$750,001 to $1,000,000' },
      { upTo: 2_000_000, flat: 1_200, label: '$1,000,001 to $2,000,000' },
      { upTo: null as number | null, flat: null as number | null, label: 'Over $2,000,000' },
    ],
    processing: 200,
  },

  /** Multi-family and commercial refinance. */
  commercialRefinance: {
    base: 95,
    perThousand: 0.95,
    minLoan: 500_000,
    label: '$95 + $0.95/K',
  },

  /** Published add-ons. */
  addOns: [
    { key: '1031', label: '1031 processing', amount: 250 },
    { key: 'subordination', label: 'Subordination agreement', amount: 50 },
    { key: 'solar', label: 'Solar transfer, per side', amount: 100 },
    { key: 'docPrep', label: 'Doc prep, each', amount: 50 },
    { key: 'demand', label: 'Demand processing, per payoff', amount: 30 },
    { key: 'heloc', label: 'HELOC or second-only escrow', amount: 250 },
  ],
} as const;

/** Sale escrow fee for one side at a given price. */
export function saleFee(price: number): number {
  return Math.round(fees.sale.base + (price / 1000) * fees.sale.perThousand);
}

/** SFR refinance flat fee for a loan amount, or null when it must be quoted. */
export function sfrRefinanceFee(loan: number): number | null {
  const tier = fees.sfrRefinance.tiers.find((t) => t.upTo === null || loan <= t.upTo);
  return tier ? tier.flat : null;
}

/** Multi-family / commercial refinance fee (loan floored to the minimum). */
export function commercialRefinanceFee(loan: number): number {
  const effective = Math.max(loan, fees.commercialRefinance.minLoan);
  return Math.round(fees.commercialRefinance.base + (effective / 1000) * fees.commercialRefinance.perThousand);
}

/** Currency formatter used across fee UI. */
export function usd(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}
