import { render, screen, fireEvent } from '@testing-library/react-native';
import { AccountListItem } from '../AccountListItem';
import { AppAccount } from '../../../../shared/models/appAccount';

const account: AppAccount = { id: 1, name: 'Compte pro', type: 'orange_money', balance: 35000, currency: 'XOF' };

describe('AccountListItem', () => {
  it('shows the account name, type, and formatted balance', async () => {
    await render(<AccountListItem account={account} onEdit={() => {}} onDelete={() => {}} />);

    expect(screen.getByText('Compte pro')).toBeTruthy();
    expect(screen.getByText('Orange Money')).toBeTruthy();
    expect(screen.getByText('35 000 F')).toBeTruthy();
  });

  it('calls onEdit and onDelete when their buttons are pressed', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    await render(<AccountListItem account={account} onEdit={onEdit} onDelete={onDelete} />);

    await fireEvent.press(screen.getByText('Modifier'));
    await fireEvent.press(screen.getByText('Supprimer'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
