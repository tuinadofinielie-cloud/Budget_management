import { render, screen, fireEvent } from '@testing-library/react-native';
import { PeriodFilter } from '../PeriodFilter';

describe('PeriodFilter', () => {
  it('calls onChange with the tapped period', async () => {
    const onChange = jest.fn();
    await render(<PeriodFilter value="month" onChange={onChange} />);

    await fireEvent.press(screen.getByText('Année'));

    expect(onChange).toHaveBeenCalledWith('year');
  });
});
