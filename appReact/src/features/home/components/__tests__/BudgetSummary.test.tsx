import { render, screen, fireEvent } from '@testing-library/react-native';
import { BudgetSummary } from '../BudgetSummary';
import { AppBudget } from '../../../../shared/models/appBudget';
import { AppTransaction } from '../../../../shared/models/appTransaction';

const referenceDate = new Date('2026-08-29T00:00:00Z');

function makeTransaction(overrides: Partial<AppTransaction>): AppTransaction {
  return {
    id: 1,
    type: 'expense',
    amount: 1000,
    categoryId: null,
    accountId: 1,
    toAccountId: null,
    description: null,
    date: '2026-08-15',
    ...overrides,
  };
}

describe('BudgetSummary', () => {
  it('shows an empty state and triggers the action when there is no budget', async () => {
    const onCreateBudget = jest.fn();
    await render(
      <BudgetSummary budget={null} transactions={[]} referenceDate={referenceDate} onCreateBudget={onCreateBudget} />
    );

    expect(screen.getByText('Aucun budget défini')).toBeTruthy();
    await fireEvent.press(screen.getByText('Définir un budget'));
    expect(onCreateBudget).toHaveBeenCalledTimes(1);
  });

  it('shows spent, remaining, and percent for an existing budget', async () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 50000, period: 'monthly' };
    const transactions = [
      makeTransaction({ id: 1, amount: 5000 }),
      makeTransaction({ id: 2, amount: 8000 }),
      makeTransaction({ id: 3, amount: 2500 }),
    ];

    await render(
      <BudgetSummary
        budget={budget}
        transactions={transactions}
        referenceDate={referenceDate}
        onCreateBudget={() => {}}
      />
    );

    expect(screen.getByText('50 000 F')).toBeTruthy();
    expect(screen.getByText('15 500 F dépensés')).toBeTruthy();
    expect(screen.getByText('34 500 F restants')).toBeTruthy();
    expect(screen.getByText('31%')).toBeTruthy();
  });
});
