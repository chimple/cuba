import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';
import { useHistory } from 'react-router';
import { Util } from '../../../utility/util';
import { registerBackButtonHandler } from '../../../common/backButtonRegistry';
import { PAGES } from '../../../common/constants';

/* ================= MOCKS ================= */

jest.mock('react-router', () => ({
  useHistory: jest.fn(),
}));

jest.mock('../../../utility/util', () => ({
  Util: {
    setPathToBackButton: jest.fn(),
  },
}));

jest.mock('../../../common/backButtonRegistry', () => ({
  registerBackButtonHandler: jest.fn(() => jest.fn()),
}));

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

const mockReplace = jest.fn();

beforeEach(() => {
  (useHistory as jest.Mock).mockReturnValue({
    replace: mockReplace,
  });
  jest.clearAllMocks();
});

/* ================= TESTS ================= */

describe('Header Component - Full Unit Tests', () => {
  /* ---------- Basic Render ---------- */

  test('renders header without crashing', () => {
    const { container } = render(<Header isBackButton={false} />);
    expect(container.querySelector('.header-container')).toBeInTheDocument();
  });

  test('renders back button when isBackButton=true', () => {
    render(<Header isBackButton={true} />);
    expect(screen.getByAltText('Back')).toBeInTheDocument();
  });

  test('renders custom text when provided', () => {
    render(<Header isBackButton={false} customText="My Header" />);
    expect(screen.getByText('My Header')).toBeInTheDocument();
  });

  test('renders class name when showClass=true', () => {
    render(
      <Header isBackButton={false} showClass={true} className="Class A" />,
    );
    expect(screen.getByText('Class A')).toBeInTheDocument();
  });

  test('renders school name when showSchool=true', () => {
    render(
      <Header isBackButton={false} showSchool={true} schoolName="ABC School" />,
    );
    expect(screen.getByText('ABC School')).toBeInTheDocument();
  });

  /* ---------- Back Button Logic ---------- */

  test('calls onBackButtonClick when back button clicked', () => {
    const mockBack = jest.fn();
    render(<Header isBackButton={true} onBackButtonClick={mockBack} />);
    fireEvent.click(screen.getByAltText('Back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test('calls onButtonClick if onBackButtonClick not provided', () => {
    const mockButton = jest.fn();
    render(<Header isBackButton={true} onButtonClick={mockButton} />);
    fireEvent.click(screen.getByAltText('Back'));
    expect(mockButton).toHaveBeenCalledTimes(1);
  });

  test('falls back to HOME_PAGE navigation if no handlers provided', () => {
    render(<Header isBackButton={true} />);
    fireEvent.click(screen.getByAltText('Back'));
    expect(Util.setPathToBackButton).toHaveBeenCalledWith(
      PAGES.HOME_PAGE,
      expect.anything(),
    );
  });

  test('does not trigger back when disableBackButton=true', () => {
    const mockBack = jest.fn();
    render(
      <Header
        isBackButton={true}
        disableBackButton={true}
        onBackButtonClick={mockBack}
      />,
    );
    fireEvent.click(screen.getByAltText('Back'));
    expect(mockBack).not.toHaveBeenCalled();
  });

  test('registers back button handler when enabled', () => {
    render(<Header isBackButton={true} />);
    expect(registerBackButtonHandler).toHaveBeenCalled();
  });

  test('does not register back handler when disableBackButton=true', () => {
    render(<Header isBackButton={true} disableBackButton={true} />);
    expect(registerBackButtonHandler).not.toHaveBeenCalled();
  });

  test('does not register back handler when isBackButton=false', () => {
    render(<Header isBackButton={false} />);
    expect(registerBackButtonHandler).not.toHaveBeenCalled();
  });

  /* ---------- Search Tests ---------- */

  test('renders search icon when showSearchIcon=true', () => {
    render(<Header isBackButton={false} showSearchIcon={true} />);
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  test('calls onSearchIconClick when search icon clicked', () => {
    const mockSearchClick = jest.fn();
    render(
      <Header
        isBackButton={false}
        showSearchIcon={true}
        onSearchIconClick={mockSearchClick}
      />,
    );
    fireEvent.click(screen.getByLabelText('Search'));
    expect(mockSearchClick).toHaveBeenCalledTimes(1);
  });

  test('renders search input when onSearchChange provided', () => {
    render(<Header isBackButton={false} onSearchChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('Search School')).toBeInTheDocument();
  });

  test('calls onSearchChange when typing in search input', () => {
    const mockSearchChange = jest.fn();
    render(<Header isBackButton={false} onSearchChange={mockSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText('Search School'), {
      target: { value: 'abc' },
    });
    expect(mockSearchChange).toHaveBeenCalledWith('abc');
  });

  test('does not render search input if onSearchChange not provided', () => {
    render(<Header isBackButton={false} />);
    expect(
      screen.queryByPlaceholderText('Search School'),
    ).not.toBeInTheDocument();
  });

  /* ---------- Share Button Tests ---------- */

  test('renders share button when onShareClick provided', () => {
    render(<Header isBackButton={false} onShareClick={jest.fn()} />);
    expect(screen.getByLabelText('Share')).toBeInTheDocument();
  });

  test('calls onShareClick when share button clicked', () => {
    const mockShare = jest.fn();
    render(<Header isBackButton={false} onShareClick={mockShare} />);
    fireEvent.click(screen.getByLabelText('Share'));
    expect(mockShare).toHaveBeenCalledTimes(1);
  });

  test('does not render share button if onShareClick not provided', () => {
    render(<Header isBackButton={false} />);
    expect(screen.queryByLabelText('Share')).not.toBeInTheDocument();
  });

  /* ---------- Edge Cases ---------- */

  test('does not render class name if showClass=false', () => {
    render(
      <Header isBackButton={false} showClass={false} className="Class A" />,
    );
    expect(screen.queryByText('Class A')).not.toBeInTheDocument();
  });

  test('does not render school name if showSchool=false', () => {
    render(
      <Header
        isBackButton={false}
        showSchool={false}
        schoolName="ABC School"
      />,
    );
    expect(screen.queryByText('ABC School')).not.toBeInTheDocument();
  });

  test('back button takes priority over side menu', () => {
    render(<Header isBackButton={true} showSideMenu={true} />);
    expect(screen.getByAltText('Back')).toBeInTheDocument();
  });

  test('component renders help icon always', () => {
    const { container } = render(<Header isBackButton={false} />);
    expect(container.querySelector('.help-icon')).toBeInTheDocument();
  });

  test('back button applies disabled class when disableBackButton=true', () => {
    render(<Header isBackButton={true} disableBackButton={true} />);
    const backBtn = screen.getByAltText('Back');
    expect(backBtn).toHaveClass('disabled-back-button');
  });

  test('customText overrides class and school display', () => {
    render(
      <Header
        isBackButton={false}
        customText="Override Text"
        showClass={true}
        className="Class A"
        showSchool={true}
        schoolName="ABC School"
      />,
    );

    expect(screen.getByText('Override Text')).toBeInTheDocument();
    expect(screen.queryByText('Class A')).not.toBeInTheDocument();
    expect(screen.queryByText('ABC School')).not.toBeInTheDocument();
  });

  test('search icon does not render when showSearchIcon=false', () => {
    render(<Header isBackButton={false} showSearchIcon={false} />);
    expect(screen.queryByLabelText('Search')).not.toBeInTheDocument();
  });

  test('back button uses fallback navigation only once per click', () => {
    render(<Header isBackButton={true} />);
    const backBtn = screen.getByAltText('Back');

    fireEvent.click(backBtn);

    expect(Util.setPathToBackButton).toHaveBeenCalledTimes(1);
  });

  test('search input updates correctly with multiple changes', () => {
    const mockSearchChange = jest.fn();
    render(<Header isBackButton={false} onSearchChange={mockSearchChange} />);

    const input = screen.getByPlaceholderText('Search School');

    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.change(input, { target: { value: 'AB' } });
    fireEvent.change(input, { target: { value: 'ABC' } });

    expect(mockSearchChange).toHaveBeenCalledTimes(3);
    expect(mockSearchChange).toHaveBeenLastCalledWith('ABC');
  });

  test('help icon has correct alt text', () => {
    render(<Header isBackButton={false} />);
    expect(screen.getByAltText('Menu')).toBeInTheDocument();
  });

  test('search input placeholder renders correctly', () => {
    render(<Header isBackButton={false} onSearchChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('Search School')).toBeInTheDocument();
  });

  test('back button click does nothing when disabled and no handlers', () => {
    render(<Header isBackButton={true} disableBackButton={true} />);
    fireEvent.click(screen.getByAltText('Back'));
    expect(Util.setPathToBackButton).not.toHaveBeenCalled();
  });

  test('share button type is button', () => {
    render(<Header isBackButton={false} onShareClick={jest.fn()} />);
    const shareBtn = screen.getByLabelText('Share');
    expect(shareBtn).toHaveAttribute('type', 'button');
  });

  test('search button type is button', () => {
    render(
      <Header
        isBackButton={false}
        showSearchIcon={true}
        onSearchIconClick={jest.fn()}
      />,
    );
    const searchBtn = screen.getByLabelText('Search');
    expect(searchBtn).toHaveAttribute('type', 'button');
  });

  test('registerBackButtonHandler cleanup function is returned', () => {
    const mockUnregister = jest.fn();
    (registerBackButtonHandler as jest.Mock).mockReturnValue(mockUnregister);

    const { unmount } = render(<Header isBackButton={true} />);
    unmount();

    expect(mockUnregister).toHaveBeenCalled();
  });

  test('component re-renders correctly when props change', () => {
    const { rerender } = render(
      <Header isBackButton={false} customText="First" />,
    );

    expect(screen.getByText('First')).toBeInTheDocument();

    rerender(<Header isBackButton={false} customText="Second" />);

    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  test('back button alt text is correctly set', () => {
    render(<Header isBackButton={true} />);
    const backBtn = screen.getByAltText('Back');
    expect(backBtn).toBeInTheDocument();
  });
});
