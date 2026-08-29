import { render, screen } from '@testing-library/react-native';
import { TransactionRow } from '../TransactionRow';
import { AppTransaction } from '../../../../shared/models/appTransaction';
import { AppCategory } from '../../../../shared/models/appCategory';

function makeTransaction(overrides: Partial<AppTransaction>): AppTransaction {
  return {
    id: 1,
    type: 'expense',
    amount: 2500,
    categoryId: 1,
    accountId: 1,
    toAccountId: null,
    description: null,
    date: '2026-08-15',
    ...overrides,
  };
}

const category: AppCategory = { id: 1, name: 'Essence', icon: '⛽', color: '#FFB547', type: 'expense' };

describe('TransactionRow', () => {
  it('shows an expense with a minus sign and the category name', async () => {
    await render(<TransactionRow transaction={makeTransaction({})} category={category} />);

    expect(screen.getByText('Essence')).toBeTruthy();
    expect(screen.getByText('-2 500 F')).toBeTruthy();
  });

  it('shows an income with a plus sign', async () => {
    const income = makeTransaction({ id: 2, type: 'income', amount: 50000, categoryId: null, description: 'Stage' });
    await render(<TransactionRow transaction={income} />);

    expect(screen.getByText('Stage')).toBeTruthy();
    expect(screen.getByText('+50 000 F')).toBeTruthy();
  });

  it("labels today's transaction as Aujourd'hui", async () => {
    const today = new Date().toISOString().slice(0, 10);
    await render(<TransactionRow transaction={makeTransaction({ date: today })} category={category} />);

    expect(screen.getByText("Aujourd'hui")).toBeTruthy();
  });
});
