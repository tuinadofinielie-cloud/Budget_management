import { render, screen, fireEvent } from '@testing-library/react-native';
import { BudgetCard } from '../BudgetCard';
import { AppBudget } from '../../../../shared/models/appBudget';
import { AppTransaction } from '../../../../shared/models/appTransaction';

const referenceDate = new Date('2026-08-29T00:00:00Z');

function makeTransaction(overrides: Partial<AppTransaction>): AppTransaction {
  return {
    id: 1,
    type: 'expense',
    amount: 1000,
    categoryId: 5,
    accountId: 1,
    toAccountId: null,
    description: null,
    date: '2026-08-15',
    ...overrides,
  };
}

describe('BudgetCard', () => {
  it('shows the title, amount, spent, remaining, and percent', async () => {
    const budget: AppBudget = { id: 1, categoryId: 5, amount: 20000, period: 'monthly' };
    const transactions = [makeTransaction({ amount: 12500 })];

    await render(
      <BudgetCard
        title="Nourriture"
        icon="🍚"
        budget={budget}
        transactions={transactions}
        referenceDate={referenceDate}
        onPress={() => {}}
      />
    );

    expect(screen.getByText('Nourriture')).toBeTruthy();
    expect(screen.getByText('20 000 F')).toBeTruthy();
    expect(screen.getByText('12 500 F dépensés')).toBeTruthy();
    expect(screen.getByText('7 500 F restants')).toBeTruthy();
    expect(screen.getByText('63%')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const budget: AppBudget = { id: 1, categoryId: null, amount: 50000, period: 'monthly' };
    const onPress = jest.fn();

    await render(
      <BudgetCard title="Budget du mois" budget={budget} transactions={[]} referenceDate={referenceDate} onPress={onPress} />
    );

    await fireEvent.press(screen.getByTestId('budget-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
