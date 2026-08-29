import { render, screen } from '@testing-library/react-native';
import { CategoryBreakdownList } from '../CategoryBreakdownList';
import { CategoryBreakdownEntry } from '../../../transactions/domain/statistics';

describe('CategoryBreakdownList', () => {
  it('shows an empty state when there are no entries', async () => {
    await render(<CategoryBreakdownList entries={[]} />);

    expect(screen.getByText('Aucune dépense')).toBeTruthy();
  });

  it('renders each category with its amount and percent', async () => {
    const entries: CategoryBreakdownEntry[] = [
      { categoryId: 1, name: 'Nourriture', icon: '🍚', color: '#FF9F71', amount: 14900, percent: 40 },
    ];

    await render(<CategoryBreakdownList entries={entries} />);

    expect(screen.getByText('Nourriture')).toBeTruthy();
    expect(screen.getByText('14 900 F')).toBeTruthy();
    expect(screen.getByText('40%')).toBeTruthy();
  });
});
