import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CachedImage from './CachedImage';
import { getCachedImageSrc } from '../../utility/imageCache';

jest.mock('../../utility/imageCache', () => ({
  getCachedImageSrc: jest.fn(),
}));

describe('CachedImage', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('shows a placeholder while resolving the image source', async () => {
    let resolveImage: (value: string) => void = () => {};
    (getCachedImageSrc as jest.Mock).mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveImage = resolve;
      }),
    );

    const { container } = render(
      <CachedImage src="https://example.com/image.png" className="thumb" />,
    );

    expect(container.firstChild).toHaveClass('thumb');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    await act(async () => {
      resolveImage('capacitor://cached-image');
    });

    const image = await screen.findByRole('img');
    expect(image).toHaveAttribute('src', 'capacitor://cached-image');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('passes through local or empty sources unchanged', async () => {
    (getCachedImageSrc as jest.Mock).mockResolvedValueOnce('/assets/icon.png');

    render(<CachedImage src="/assets/icon.png" alt="Example" />);

    const image = await screen.findByRole('img');
    expect(image).toHaveAttribute('src', '/assets/icon.png');
    expect(image).toHaveAttribute('alt', 'Example');
  });

  it('renders an empty div when src is missing', () => {
    const { container } = render(<CachedImage />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
