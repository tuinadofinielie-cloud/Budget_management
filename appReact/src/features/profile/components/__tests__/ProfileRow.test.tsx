import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProfileRow } from '../ProfileRow';

describe('ProfileRow', () => {
  it('shows the label and value', async () => {
    await render(<ProfileRow label="Devise" value="XOF" isLast />);

    expect(screen.getByText('Devise')).toBeTruthy();
    expect(screen.getByText('XOF')).toBeTruthy();
  });

  it('calls onPress when pressable', async () => {
    const onPress = jest.fn();
    await render(<ProfileRow label="Se déconnecter" tone="danger" onPress={onPress} isLast />);

    await fireEvent.press(screen.getByText('Se déconnecter'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
