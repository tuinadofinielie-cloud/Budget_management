import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { AppBottomNav } from '../AppBottomNav';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

function makeProps() {
  const navigate = jest.fn();
  const state = {
    index: 0,
    routes: [
      { key: 'home', name: 'home' },
      { key: 'statistics', name: 'statistics' },
      { key: 'budget', name: 'budget' },
      { key: 'profile', name: 'profile' },
    ],
  };
  return { state, navigation: { navigate } } as any;
}

describe('AppBottomNav', () => {
  it('renders all four tabs', async () => {
    await render(<AppBottomNav {...makeProps()} />);

    expect(screen.getByText('Accueil')).toBeTruthy();
    expect(screen.getByText('Statistiques')).toBeTruthy();
    expect(screen.getByText('Budget')).toBeTruthy();
    expect(screen.getByText('Profil')).toBeTruthy();
  });

  it('navigates to the tapped tab', async () => {
    const props = makeProps();
    await render(<AppBottomNav {...props} />);

    await fireEvent.press(screen.getByText('Statistiques'));

    expect(props.navigation.navigate).toHaveBeenCalledWith('statistics');
  });

  it('opens the speed dial and navigates to add-transaction for the tapped action', async () => {
    await render(<AppBottomNav {...makeProps()} />);

    await fireEvent.press(screen.getByLabelText('Ouvrir les actions rapides'));
    await fireEvent.press(screen.getByText('Dépense'));

    expect(router.push).toHaveBeenCalledWith('/add-transaction?type=expense');
  });
});
