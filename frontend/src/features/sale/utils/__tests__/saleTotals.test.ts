import { calculateSaleTotals } from '../saleTotals';

describe('calculateSaleTotals', () => {
  it('returns net amount after applying discount within bounds', () => {
    const { grossAmount, discountAmount, netAmount } = calculateSaleTotals(
      [
        { subtotal: 120 },
        { subtotal: 80 },
        { subtotal: 50 },
      ],
      30,
    );

    expect(grossAmount).toBe(250);
    expect(discountAmount).toBe(30);
    expect(netAmount).toBe(220);
  });

  it('ignores negative discount values', () => {
    const { grossAmount, discountAmount, netAmount } = calculateSaleTotals(
      [
        { subtotal: 100 },
        { subtotal: 50 },
      ],
      -20,
    );

    expect(grossAmount).toBe(150);
    expect(discountAmount).toBe(0);
    expect(netAmount).toBe(150);
  });

  it('caps discount at the gross amount to avoid negative totals', () => {
    const { grossAmount, discountAmount, netAmount } = calculateSaleTotals(
      [
        { subtotal: 40 },
      ],
      200,
    );

    expect(grossAmount).toBe(40);
    expect(discountAmount).toBe(40);
    expect(netAmount).toBe(0);
  });

  it('rounds results to two decimal places for fractional values', () => {
    const { grossAmount, discountAmount, netAmount } = calculateSaleTotals(
      [
        { subtotal: 19.955 },
        { subtotal: 10.005 },
      ],
      5.337,
    );

    expect(grossAmount).toBe(30);
    expect(discountAmount).toBe(5.34);
    expect(netAmount).toBe(24.66);
  });
});
