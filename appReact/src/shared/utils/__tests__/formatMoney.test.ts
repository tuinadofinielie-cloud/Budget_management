import { formatMoney } from '../formatMoney';

describe('formatMoney', () => {
  it('inserts a thousands separator', () => {
    expect(formatMoney(125430)).toBe('125 430 F');
  });

  it('formats amounts under a thousand without a separator', () => {
    expect(formatMoney(999)).toBe('999 F');
  });

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('0 F');
  });

  it('keeps the minus sign before the digits', () => {
    expect(formatMoney(-2500)).toBe('-2 500 F');
  });

  it('rounds fractional input', () => {
    expect(formatMoney(2500.6)).toBe('2 501 F');
  });
});
