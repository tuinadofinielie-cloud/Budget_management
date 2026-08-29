import { render, screen } from '@testing-library/react-native';
import { AccountsSection } from '../AccountsSection';
import { AppAccount } from '../../../../shared/models/appAccount';

const accounts: AppAccount[] = [
  { id: 1, name: 'Cash', type: 'cash', balance: 20000, currency: 'XOF' },
  { id: 2, name: 'Compte principal', type: 'bank', balance: 100000, currency: 'XOF' },
];

describe('AccountsSection', () => {
  it('renders a card per account', async () => {
    await render(<AccountsSection accounts={accounts} />);

    expect(screen.getByText('Cash')).toBeTruthy();
    expect(screen.getByText('Compte principal')).toBeTruthy();
  });

  it('shows an empty state when there are no accounts', async () => {
    await render(<AccountsSection accounts={[]} />);

    expect(screen.getByText('Aucun compte')).toBeTruthy();
  });
});
