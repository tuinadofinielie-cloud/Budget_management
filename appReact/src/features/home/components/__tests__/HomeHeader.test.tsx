import { render, screen } from '@testing-library/react-native';
import { HomeHeader } from '../HomeHeader';

describe('HomeHeader', () => {
  it('greets the user by first name only', async () => {
    await render(<HomeHeader name="Jackson Kouassi" avatar={null} />);
    expect(screen.getByText('Bonjour Jackson 👋')).toBeTruthy();
  });

  it('shows an initial fallback when there is no avatar', async () => {
    await render(<HomeHeader name="Jackson" avatar={null} />);
    expect(screen.getByText('J')).toBeTruthy();
  });
});
