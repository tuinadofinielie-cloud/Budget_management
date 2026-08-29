import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ProfileSection } from '../ProfileSection';

describe('ProfileSection', () => {
  it('renders the title and its children', async () => {
    await render(
      <ProfileSection title="Compte">
        <Text>Email</Text>
      </ProfileSection>
    );

    expect(screen.getByText('Compte')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
  });
});
