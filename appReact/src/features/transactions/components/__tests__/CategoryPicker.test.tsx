import { render, screen, fireEvent } from '@testing-library/react-native';
import { CategoryPicker } from '../CategoryPicker';
import { AppCategory } from '../../../../shared/models/appCategory';

const categories: AppCategory[] = [
  { id: 1, name: 'Essence', icon: '⛽', color: '#FFB547', type: 'expense' },
  { id: 2, name: 'Nourriture', icon: '🍚', color: '#FF9F71', type: 'expense' },
];

describe('CategoryPicker', () => {
  it('calls onSelect with the tapped category id', async () => {
    const onSelect = jest.fn();
    await render(<CategoryPicker categories={categories} selectedId={null} onSelect={onSelect} />);

    await fireEvent.press(screen.getByText('Nourriture'));

    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
