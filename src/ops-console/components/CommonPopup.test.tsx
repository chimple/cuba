import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommonPopup from './CommonPopup';

jest.mock('@mui/material', () => ({
  Dialog: ({
    open,
    onClose,
    children,
    maxWidth,
    fullWidth,
    id,
    className,
  }: any) =>
    open ? (
      <div
        role="dialog"
        aria-modal="true"
        data-testid="mui-dialog"
        data-max-width={maxWidth}
        data-full-width={String(fullWidth)}
        id={id}
        className={className}
      >
        <button data-testid="dialog-on-close" type="button" onClick={onClose}>
          dialog-close
        </button>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children, id, className }: any) => (
    <div data-testid="mui-dialog-content" id={id} className={className}>
      {children}
    </div>
  ),
  IconButton: ({ children, size, ...props }: any) => (
    <button type="button" data-size={size} {...props}>
      {children}
    </button>
  ),
  Typography: ({ children, id, className }: any) => (
    <div id={id} className={className}>
      {children}
    </div>
  ),
}));

jest.mock('@mui/icons-material/Close', () => () => (
  <svg data-testid="close-icon" />
));

describe('CommonPopup', () => {
  const buildProps = (
    overrides: Partial<React.ComponentProps<typeof CommonPopup>> = {},
  ): React.ComponentProps<typeof CommonPopup> => ({
    open: true,
    onClose: jest.fn(),
    icon: <span data-testid="popup-icon">icon</span>,
    title: 'Popup Title',
    subtitle: 'Popup subtitle',
    ...overrides,
  });

  const renderComponent = (
    overrides: Partial<React.ComponentProps<typeof CommonPopup>> = {},
  ) => {
    const props = buildProps(overrides);

    return {
      props,
      user: userEvent.setup(),
      ...render(<CommonPopup {...props} />),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render the dialog when open is false', () => {
    const { container } = renderComponent({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('renders the dialog with the expected static props', () => {
    renderComponent();

    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveAttribute('id', 'ops-common-popup-dialog');
    expect(dialog).toHaveClass('ops-common-popup-dialog');
    expect(dialog).toHaveAttribute('data-max-width', 'xs');
    expect(dialog).toHaveAttribute('data-full-width', 'true');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('renders the dialog content wrapper with the expected identifiers', () => {
    renderComponent();

    const content = screen.getByTestId('mui-dialog-content');

    expect(content).toHaveAttribute('id', 'ops-common-popup-content');
    expect(content).toHaveClass('ops-common-popup-content');
  });

  it('renders the close button with the expected attributes', () => {
    renderComponent();

    const closeButton = screen.getByRole('button', { name: 'Close' });

    expect(closeButton).toHaveAttribute('id', 'ops-common-popup-close');
    expect(closeButton).toHaveClass('ops-common-popup-close');
    expect(closeButton).toHaveAttribute('data-size', 'small');
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
  });

  it('renders the icon wrapper and custom icon node', () => {
    const { container } = renderComponent({
      icon: (
        <div data-testid="custom-icon">
          <span>success</span>
        </div>
      ),
    });

    const iconWrapper = container.querySelector('#ops-common-popup-icon');

    expect(iconWrapper).toBeInTheDocument();
    expect(iconWrapper).toHaveClass('ops-common-popup-icon');
    expect(iconWrapper).toContainElement(screen.getByTestId('custom-icon'));
    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('renders the main content container with the expected class', () => {
    const { container } = renderComponent();

    const popupContainer = container.querySelector(
      '#ops-common-popup-container',
    );

    expect(popupContainer).toBeInTheDocument();
    expect(popupContainer).toHaveClass('ops-common-popup-container');
  });

  it('renders the title and subtitle with their expected ids and classes', () => {
    renderComponent();

    const title = screen.getByText('Popup Title');
    const subtitle = screen.getByText('Popup subtitle');

    expect(title).toHaveAttribute('id', 'ops-common-popup-title');
    expect(title).toHaveClass('ops-common-popup-title');
    expect(subtitle).toHaveAttribute('id', 'ops-common-popup-subtitle');
    expect(subtitle).toHaveClass('ops-common-popup-subtitle');
  });

  it('does not call onClose during the initial render', () => {
    const { props } = renderComponent();

    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the close button is clicked', async () => {
    const { props, user } = renderComponent();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose each time the close button is clicked', async () => {
    const { props, user } = renderComponent();
    const closeButton = screen.getByRole('button', { name: 'Close' });

    await user.click(closeButton);
    await user.click(closeButton);

    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  it('passes onClose through to the dialog', async () => {
    const { props, user } = renderComponent();

    await user.click(screen.getByTestId('dialog-on-close'));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('hides the dialog when rerendered from open to closed', () => {
    const props = buildProps();
    const { rerender } = render(<CommonPopup {...props} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<CommonPopup {...props} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the dialog when rerendered from closed to open', () => {
    const props = buildProps({ open: false });
    const { rerender } = render(<CommonPopup {...props} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<CommonPopup {...props} open={true} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('updates the title, subtitle, and icon when props change', () => {
    const props = buildProps();
    const { rerender } = render(<CommonPopup {...props} />);

    expect(screen.getByText('Popup Title')).toBeInTheDocument();
    expect(screen.getByText('Popup subtitle')).toBeInTheDocument();
    expect(screen.getByTestId('popup-icon')).toBeInTheDocument();

    rerender(
      <CommonPopup
        {...props}
        icon={<span data-testid="updated-icon">updated</span>}
        title="Updated Title"
        subtitle="Updated subtitle"
      />,
    );

    expect(screen.queryByText('Popup Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Popup subtitle')).not.toBeInTheDocument();
    expect(screen.queryByTestId('popup-icon')).not.toBeInTheDocument();
    expect(screen.getByText('Updated Title')).toBeInTheDocument();
    expect(screen.getByText('Updated subtitle')).toBeInTheDocument();
    expect(screen.getByTestId('updated-icon')).toBeInTheDocument();
  });

  it('renders empty title and subtitle values without crashing', () => {
    const { container } = renderComponent({
      title: '',
      subtitle: '',
    });

    const title = container.querySelector('#ops-common-popup-title');
    const subtitle = container.querySelector('#ops-common-popup-subtitle');

    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('');
    expect(subtitle).toBeInTheDocument();
    expect(subtitle).toHaveTextContent('');
  });

  it('renders exactly one title and one subtitle node', () => {
    renderComponent();

    expect(screen.getAllByText('Popup Title')).toHaveLength(1);
    expect(screen.getAllByText('Popup subtitle')).toHaveLength(1);
  });
});
