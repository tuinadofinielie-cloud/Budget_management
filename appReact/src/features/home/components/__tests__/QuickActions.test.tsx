import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { QuickActions } from '../QuickActions';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

describe('QuickActions', () => {
  it('renders the three quick actions', async () => {
    await render(<QuickActions />);

    expect(screen.getByText('Dépense')).toBeTruthy();
    expect(screen.getByText('Revenu')).toBeTruthy();
    expect(screen.getByText('Virement')).toBeTruthy();
  });

  it('opens the add-transaction screen with the matching type when an action is pressed', async () => {
    await render(<QuickActions />);

    await fireEvent.press(screen.getByText('Dépense'));

    expect(router.push).toHaveBeenCalledWith('/add-transaction?type=expense');
  });
});
