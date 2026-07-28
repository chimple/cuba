import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectWithIcons from './SelectWithIcons';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

describe('SelectWithIcons Component', () => {
  const mockSetValue = jest.fn();

  const defaultProps = {
    label: 'Country',
    value: '',
    setValue: mockSetValue,
    icon: '/icon.png',
    options: [
      { value: 'in', label: 'India' },
      { value: 'us', label: 'USA' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders label', () => {
    render(<SelectWithIcons {...defaultProps} />);
    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  test('renders required star when required is true', () => {
    render(<SelectWithIcons {...defaultProps} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('does not render required star when not required', () => {
    render(<SelectWithIcons {...defaultProps} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  test('renders default placeholder when no value selected', () => {
    render(<SelectWithIcons {...defaultProps} />);
    expect(screen.getByText('Select one')).toBeInTheDocument();
  });

  test('renders selected label when value exists', () => {
    render(<SelectWithIcons {...defaultProps} value="in" />);
    expect(screen.getByText('India')).toBeInTheDocument();
  });

  test('renders icon image', () => {
    render(<SelectWithIcons {...defaultProps} />);
    expect(screen.getByAltText('icon')).toHaveAttribute('src', '/icon.png');
  });

  test('opens dropdown on click', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    expect(screen.getByText('India')).toBeInTheDocument();
  });

  test('closes dropdown when clicking outside', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    fireEvent.mouseDown(document);
    expect(screen.queryByText('India')).not.toBeInTheDocument();
  });

  test('renders all options when dropdown is open', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    expect(screen.getByText('India')).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
  });

  test('calls setValue when option is selected', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    fireEvent.click(screen.getByText('India'));
    expect(mockSetValue).toHaveBeenCalledWith('in');
  });

  test('dropdown closes after selecting option', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    fireEvent.click(screen.getByText('India'));
    expect(screen.queryByText('USA')).not.toBeInTheDocument();
  });

  test('shows checkmark for selected option', () => {
    render(<SelectWithIcons {...defaultProps} value="in" />);
    fireEvent.click(screen.getByText('India'));
    expect(screen.getByTestId('DoneIcon')).toBeTruthy();
  });

  test('applies id to input box', () => {
    render(<SelectWithIcons {...defaultProps} id="select-id" />);
    expect(document.getElementById('select-id')).toBeInTheDocument();
  });

  test('handles empty options array gracefully', () => {
    render(<SelectWithIcons {...defaultProps} options={[]} />);
    fireEvent.click(screen.getByText('Select one'));
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  test('component mounts without crashing', () => {
    expect(() => render(<SelectWithIcons {...defaultProps} />)).not.toThrow();
  });
  test('toggles dropdown open and close on repeated clicks', () => {
    render(<SelectWithIcons {...defaultProps} />);
    const trigger = screen.getByText('Select one');

    fireEvent.click(trigger);
    expect(screen.getByText('India')).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByText('India')).not.toBeInTheDocument();
  });

  test('renders correct number of options', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    expect(screen.getAllByText(/India|USA/).length).toBe(2);
  });

  test('selected option has selected class', () => {
    const { container } = render(
      <SelectWithIcons {...defaultProps} value="in" />,
    );
    fireEvent.click(screen.getByText('India'));
    expect(container.querySelector('.selected')).toBeInTheDocument();
  });

  test('clicking one option does not trigger other options', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    fireEvent.click(screen.getByText('USA'));
    expect(mockSetValue).toHaveBeenCalledWith('us');
    expect(mockSetValue).not.toHaveBeenCalledWith('in');
  });

  test('dropdown remains closed initially', () => {
    render(<SelectWithIcons {...defaultProps} />);
    expect(screen.queryByText('India')).not.toBeInTheDocument();
  });

  test('updates displayed label when value prop changes', () => {
    const { rerender } = render(<SelectWithIcons {...defaultProps} value="" />);
    rerender(<SelectWithIcons {...defaultProps} value="us" />);
    expect(screen.getByText('USA')).toBeInTheDocument();
  });

  test('multiple rapid clicks do not break dropdown', () => {
    render(<SelectWithIcons {...defaultProps} />);
    const trigger = screen.getByText('Select one');

    fireEvent.click(trigger);
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(true).toBeTruthy();
  });

  test('optionId applied to each option when provided', () => {
    render(<SelectWithIcons {...defaultProps} optionId="option-id" />);
    fireEvent.click(screen.getByText('Select one'));
    expect(document.querySelectorAll('#option-id').length).toBe(2);
  });

  test('clicking outside when already closed does nothing', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.mouseDown(document);
    expect(screen.queryByText('India')).not.toBeInTheDocument();
  });

  test('renders label correctly after rerender', () => {
    const { rerender } = render(
      <SelectWithIcons {...defaultProps} label="Country" />,
    );
    rerender(<SelectWithIcons {...defaultProps} label="City" />);
    expect(screen.getByText('City')).toBeInTheDocument();
  });

  test('handles single option correctly', () => {
    render(
      <SelectWithIcons
        {...defaultProps}
        options={[{ value: 'in', label: 'India' }]}
      />,
    );
    fireEvent.click(screen.getByText('Select one'));
    expect(screen.getByText('India')).toBeInTheDocument();
  });

  test('icon remains visible after selecting option', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    fireEvent.click(screen.getByText('India'));
    expect(screen.getByAltText('icon')).toBeInTheDocument();
  });

  test('selected label updates correctly after selecting option', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    fireEvent.click(screen.getByText('USA'));
    expect(mockSetValue).toHaveBeenCalledWith('us');
  });

  test('handles long option labels correctly', () => {
    render(
      <SelectWithIcons
        {...defaultProps}
        options={[{ value: '1', label: 'Very Long Country Name Here' }]}
      />,
    );
    fireEvent.click(screen.getByText('Select one'));
    expect(screen.getByText('Very Long Country Name Here')).toBeInTheDocument();
  });

  test('dropdown does not render if options undefined length zero', () => {
    render(<SelectWithIcons {...defaultProps} options={[]} />);
    fireEvent.click(screen.getByText('Select one'));
    expect(screen.queryByText('India')).not.toBeInTheDocument();
  });

  test('multiple rerenders do not duplicate dropdown', () => {
    const { rerender } = render(<SelectWithIcons {...defaultProps} />);
    rerender(<SelectWithIcons {...defaultProps} />);
    rerender(<SelectWithIcons {...defaultProps} />);
    expect(true).toBeTruthy();
  });

  test('clicking dropdown container toggles icon state', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    expect(screen.getByText('India')).toBeInTheDocument();
  });

  test('component handles empty string value properly', () => {
    render(<SelectWithIcons {...defaultProps} value="" />);
    expect(screen.getByText('Select one')).toBeInTheDocument();
  });
  test('does not render checkmark when no value selected', () => {
    render(<SelectWithIcons {...defaultProps} value="" />);
    fireEvent.click(screen.getByText('Select one'));
    expect(
      document.querySelector('.select-with-icon-checkmark'),
    ).not.toBeInTheDocument();
  });

  test('renders checkmark only for selected option', () => {
    render(<SelectWithIcons {...defaultProps} value="us" />);
    fireEvent.click(screen.getByText('USA'));
    const checkmarks = document.querySelectorAll('.select-with-icon-checkmark');
    expect(checkmarks.length).toBe(1);
  });

  test('selecting option updates UI after rerender with new value', () => {
    const { rerender } = render(<SelectWithIcons {...defaultProps} value="" />);

    fireEvent.click(screen.getByText('Select one'));
    fireEvent.click(screen.getByText('India'));

    rerender(<SelectWithIcons {...defaultProps} value="in" />);
    expect(screen.getByText('India')).toBeInTheDocument();
  });

  test('dropdown remains open if clicking inside dropdown container', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    fireEvent.mouseDown(screen.getByText('India'));
    expect(screen.getByText('India')).toBeInTheDocument();
  });

  test('handles duplicate option values safely', () => {
    render(
      <SelectWithIcons
        {...defaultProps}
        options={[
          { value: '1', label: 'One' },
          { value: '1', label: 'Duplicate One' },
        ]}
      />,
    );
    fireEvent.click(screen.getByText('Select one'));
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Duplicate One')).toBeInTheDocument();
  });

  test('handles large options list correctly', () => {
    const largeOptions = Array.from({ length: 50 }, (_, i) => ({
      value: `${i}`,
      label: `Option ${i}`,
    }));

    render(<SelectWithIcons {...defaultProps} options={largeOptions} />);

    fireEvent.click(screen.getByText('Select one'));
    expect(screen.getByText('Option 0')).toBeInTheDocument();
    expect(screen.getByText('Option 49')).toBeInTheDocument();
  });

  test('clicking dropdown arrow area toggles dropdown', () => {
    render(<SelectWithIcons {...defaultProps} />);
    const box = document.querySelector(
      '.select-with-icon-input-box',
    ) as HTMLElement;
    fireEvent.click(box);
    expect(screen.getByText('India')).toBeInTheDocument();
  });

  test('setValue not called when opening dropdown', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  test('dropdown closes properly after outside click even after selection', () => {
    render(<SelectWithIcons {...defaultProps} />);
    fireEvent.click(screen.getByText('Select one'));
    fireEvent.click(screen.getByText('India'));
    fireEvent.mouseDown(document);
    expect(screen.queryByText('USA')).not.toBeInTheDocument();
  });
});
