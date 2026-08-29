import { render, screen } from '@testing-library/react-native';
import { RecentTransactions } from '../RecentTransactions';
import { AppTransaction } from '../../../../shared/models/appTransaction';

function makeTransaction(overrides: Partial<AppTransaction>): AppTransaction {
  return {
    id: 1,
    type: 'expense',
    amount: 1000,
    categoryId: null,
    accountId: 1,
    toAccountId: null,
    description: 'Déjeuner',
    date: '2026-08-15',
    ...overrides,
  };
}

describe('RecentTransactions', () => {
  it('shows an empty state when there are no transactions', async () => {
    await render(<RecentTransactions transactions={[]} categories={[]} />);

    expect(screen.getByText('Aucune transaction pour le moment')).toBeTruthy();
  });

  it('renders at most 5 transactions', async () => {
    const transactions = Array.from({ length: 8 }, (_, index) =>
      makeTransaction({ id: index + 1, description: `Transaction ${index + 1}` })
    );

    await render(<RecentTransactions transactions={transactions} categories={[]} />);

    expect(screen.getByText('Transaction 1')).toBeTruthy();
    expect(screen.getByText('Transaction 5')).toBeTruthy();
    expect(screen.queryByText('Transaction 6')).toBeNull();
  });
});
