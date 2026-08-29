import { render, screen } from '@testing-library/react-native';
import { StatSummaryCard } from '../StatSummaryCard';

describe('StatSummaryCard', () => {
  it('formats the amount', async () => {
    await render(<StatSummaryCard label="Dépenses" amount={37250} tone="expense" />);

    expect(screen.getByText('Dépenses')).toBeTruthy();
    expect(screen.getByText('37 250 F')).toBeTruthy();
  });
});
