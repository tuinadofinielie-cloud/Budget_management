import { render, screen } from '@testing-library/react-native';
import { SpendingTrendChart } from '../SpendingTrendChart';
import { TrendPoint } from '../../../transactions/domain/statistics';

const points: TrendPoint[] = [
  { label: 'juin', year: 2026, month: 5, income: 0, expense: 4000 },
  { label: 'juil.', year: 2026, month: 6, income: 0, expense: 8000 },
  { label: 'août', year: 2026, month: 7, income: 0, expense: 2000 },
];

describe('SpendingTrendChart', () => {
  it('renders a label for each month', async () => {
    await render(<SpendingTrendChart points={points} />);

    expect(screen.getByText('juin')).toBeTruthy();
    expect(screen.getByText('juil.')).toBeTruthy();
    expect(screen.getByText('août')).toBeTruthy();
  });
});
