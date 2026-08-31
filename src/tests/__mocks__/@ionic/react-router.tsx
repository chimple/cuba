import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const getInitialEntry = () => {
  if (typeof window === 'undefined') {
    return '/';
  }

  if (window.location.hash.startsWith('#/')) {
    return window.location.hash.slice(1);
  }

  return '/';
};

const MockIonicRouter: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <MemoryRouter initialEntries={[getInitialEntry()]}>{children}</MemoryRouter>
);

export const IonReactHashRouter = MockIonicRouter;
