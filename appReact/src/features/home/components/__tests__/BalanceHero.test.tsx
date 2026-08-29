import { render, screen } from '@testing-library/react-native';
import { BalanceHero } from '../BalanceHero';

describe('BalanceHero', () => {
  it('formats the total balance, income, and expense', async () => {
    await render(<BalanceHero totalBalance={125430} income={100000} expense={37250} />);

    expect(screen.getByText('125 430 F')).toBeTruthy();
    expect(screen.getByText('+100 000 F')).toBeTruthy();
    expect(screen.getByText('-37 250 F')).toBeTruthy();
  });
});
