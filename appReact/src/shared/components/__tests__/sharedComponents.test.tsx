import { render, screen, fireEvent } from '@testing-library/react-native';
import { GlassCard } from '../GlassCard';
import { PrimaryButton } from '../PrimaryButton';
import { LoadingState } from '../LoadingState';
import { ErrorState } from '../ErrorState';
import { EmptyState } from '../EmptyState';
import { Text } from 'react-native';

describe('GlassCard', () => {
  it('renders its children', async () => {
    await render(
      <GlassCard>
        <Text>hello</Text>
      </GlassCard>
    );
    expect(screen.getByText('hello')).toBeTruthy();
  });
});

describe('PrimaryButton', () => {
  it('shows a spinner and hides its label while loading', async () => {
    await render(<PrimaryButton label="Go" isLoading onPress={() => {}} />);
    expect(screen.queryByText('Go')).toBeNull();
    expect(screen.getByTestId('primary-button-spinner')).toBeTruthy();
  });

  it('does not call onPress while loading', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Go" isLoading onPress={onPress} />);
    await fireEvent.press(screen.getByTestId('primary-button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('calls onPress when not loading', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Go" onPress={onPress} />);
    await fireEvent.press(screen.getByText('Go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('LoadingState', () => {
  it('shows an optional message', async () => {
    await render(<LoadingState message="Chargement..." />);
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('shows the message and calls onRetry when tapped', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState message="Oops" onRetry={onRetry} />);
    expect(screen.getByText('Oops')).toBeTruthy();
    await fireEvent.press(screen.getByText('Réessayer'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyState', () => {
  it('shows an action button when provided', async () => {
    await render(
      <EmptyState
        title="Rien ici"
        message="Ajoutez quelque chose"
        actionLabel="Ajouter"
        onAction={() => {}}
      />
    );
    expect(screen.getByText('Rien ici')).toBeTruthy();
    expect(screen.getByText('Ajouter')).toBeTruthy();
  });
});
