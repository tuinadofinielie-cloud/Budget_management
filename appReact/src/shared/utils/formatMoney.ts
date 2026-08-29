/** Formats a whole-franc XOF amount for display, e.g. `125430` -> `"125 430 F"`. */
export function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  const withSpaces = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${withSpaces} F`;
}
