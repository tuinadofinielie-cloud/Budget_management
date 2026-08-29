import { render, screen, fireEvent } from '@testing-library/react-native';
import { AccountPicker } from '../AccountPicker';
import { AppAccount } from '../../../../shared/models/appAccount';

const accounts: AppAccount[] = [
  { id: 1, name: 'Cash', type: 'cash', balance: 0, currency: 'XOF' },
  { id: 2, name: 'Orange Money', type: 'orange_money', balance: 0, currency: 'XOF' },
];

describe('AccountPicker', () => {
  it('calls onSelect with the tapped account id', async () => {
    const onSelect = jest.fn();
    await render(<AccountPicker label="Compte" accounts={accounts} selectedId={1} onSelect={onSelect} />);

    await fireEvent.press(screen.getByText('Orange Money'));

    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
