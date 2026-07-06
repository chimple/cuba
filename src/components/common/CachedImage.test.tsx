import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { Capacitor } from '@capacitor/core';
import CachedImage from './CachedImage';
import { getCachedImageSrc } from '../../utility/imageCache';

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
    convertFileSrc: jest.fn(),
  },
}));

jest.mock('../../utility/imageCache', () => ({
  getCachedImageSrc: jest.fn(),
  isLocalImageUrl: jest.fn(),
}));

describe('CachedImage', () => {
  beforeEach(() => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
  });

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

    render(
      <CachedImage src="https://example.com/image.png" className="thumb" />,
    );

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
    render(<CachedImage />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('falls back to the default image when the primary image fails', async () => {
    (getCachedImageSrc as jest.Mock).mockResolvedValueOnce(
      'https://example.com/image.png',
    );

    render(
      <CachedImage
        src="https://example.com/image.png"
        fallbackSrc="/assets/icons/DefaultIcon.png"
        alt="Example"
      />,
    );

    const image = await screen.findByRole('img');
    fireEvent.error(image);

    expect(image).toHaveAttribute('src', '/assets/icons/DefaultIcon.png');
  });
});
