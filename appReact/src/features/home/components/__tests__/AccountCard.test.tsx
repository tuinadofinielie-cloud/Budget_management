import { render, screen } from '@testing-library/react-native';
import { AccountCard } from '../AccountCard';
import { AppAccount } from '../../../../shared/models/appAccount';

const account: AppAccount = { id: 1, name: 'Compte pro', type: 'orange_money', balance: 35000, currency: 'XOF' };

describe('AccountCard', () => {
  it('shows the account name, type label, and formatted balance', async () => {
    await render(<AccountCard account={account} />);

    expect(screen.getByText('Compte pro')).toBeTruthy();
    expect(screen.getByText('Orange Money')).toBeTruthy();
    expect(screen.getByText('35 000 F')).toBeTruthy();
  });
});
