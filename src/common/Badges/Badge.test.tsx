import { render, screen } from '@testing-library/react';
import Badge from './Badge';
import { getGeneratedBadge } from './badgeGenerator';

jest.mock('./badgeGenerator', () => ({
  getGeneratedBadge: jest.fn(),
}));

jest.mock('../../components/InlineSvg', () => ({
  __esModule: true,
  default: ({ id, className }: { id?: string; className?: string }) => (
    <span data-testid={id} className={className} />
  ),
}));

const mockedGetGeneratedBadge = getGeneratedBadge as jest.MockedFunction<
  typeof getGeneratedBadge
>;

describe('Badge', () => {
  beforeEach(() => {
    mockedGetGeneratedBadge.mockReturnValue({
      badgeNumber: 250,
      borderSvg: '<svg />',
      baseSvg: '<svg />',
      decorationSvg: '<svg />',
      decorationClassName: 'badges-decoration-top-3',
      iconSvgs: ['<svg />', '<svg />', '<svg />'],
      textColor: '#005757',
    });
  });

  it('renders the generated badge number and all three center icons', () => {
    render(<Badge number={250} />);

    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getAllByTestId(/badges-icon-/)).toHaveLength(3);
    expect(mockedGetGeneratedBadge).toHaveBeenCalledWith(250);
  });

  it('renders nothing when a badge cannot be generated', () => {
    mockedGetGeneratedBadge.mockReturnValueOnce(undefined);

    const { container } = render(<Badge number={250} />);

    expect(container).toBeEmptyDOMElement();
  });
});
