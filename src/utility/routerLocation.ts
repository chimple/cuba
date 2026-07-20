import { createPath, parsePath } from 'history';

import { BASE_NAME, PAGES } from '../common/constants';

type AppLocationParts = {
  pathname: string;
  search: string;
  hash: string;
};

const normalizePathname = (pathname: string) => {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed || '/';
};

const normalizeSearch = (search: string) => {
  if (!search || search === '?') {
    return '';
  }

  return search.startsWith('?') ? search : `?${search}`;
};

const normalizeHash = (hash: string) => {
  if (!hash || hash === '#') {
    return '';
  }

  return hash.startsWith('#') ? hash : `#${hash}`;
};

const normalizeBasename = (basename: string) => {
  if (!basename || basename === '/') {
    return '';
  }

  const trimmed = basename.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const hasBasename = (path: string, basename: string) =>
  path.toLowerCase().indexOf(basename.toLowerCase()) === 0 &&
  '/?#'.includes(path.charAt(basename.length));

const stripBasename = (pathname: string) => {
  const basename = normalizeBasename(BASE_NAME);
  if (!basename || !hasBasename(pathname, basename)) {
    return pathname;
  }

  return pathname.slice(basename.length) || '/';
};

const addBasename = (pathname: string) => {
  const basename = normalizeBasename(BASE_NAME);
  if (!basename) {
    return pathname;
  }

  return pathname === '/' ? basename : `${basename}${pathname}`;
};

const pageRoutes =
  PAGES && typeof PAGES === 'object' ? (PAGES as Record<string, unknown>) : {};

const KNOWN_APP_ROUTE_PATHS = new Set<string>(
  Object.values(pageRoutes)
    .map((path) => String(path))
    .filter((path) => path.startsWith('/') && path !== '/' && path !== '/#'),
);

const isHashRoutedUrl = () =>
  typeof window !== 'undefined' && window.location.hash.startsWith('#/');

const getHashRoutePath = () => {
  if (typeof window === 'undefined') {
    return '/';
  }

  const rawHash = window.location.hash.replace(/^#/, '');
  if (!rawHash) {
    return '/';
  }

  return rawHash.startsWith('/') ? rawHash : `/${rawHash}`;
};

const readCurrentAppLocation = (): AppLocationParts => {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', hash: '' };
  }

  const parsed = isHashRoutedUrl()
    ? parsePath(getHashRoutePath())
    : parsePath(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );

  return {
    pathname: normalizePathname(
      isHashRoutedUrl()
        ? parsed.pathname || '/'
        : stripBasename(parsed.pathname || '/'),
    ),
    search: normalizeSearch(parsed.search || ''),
    hash: normalizeHash(parsed.hash || ''),
  };
};

const withDefaults = (
  nextLocation: Partial<AppLocationParts> = {},
): AppLocationParts => {
  const current = readCurrentAppLocation();

  return {
    pathname: normalizePathname(nextLocation.pathname ?? current.pathname),
    search: normalizeSearch(nextLocation.search ?? current.search),
    hash: normalizeHash(nextLocation.hash ?? current.hash),
  };
};

export const getAppLocation = () => readCurrentAppLocation();

export const getAppPathname = () => readCurrentAppLocation().pathname;

export const getAppSearch = () => readCurrentAppLocation().search;

export const getAppHash = () => readCurrentAppLocation().hash;

export const getAppSearchParams = () => new URLSearchParams(getAppSearch());

export const getAppPath = () => createPath(readCurrentAppLocation());

export const buildHashAppUrl = (
  nextLocation: Partial<AppLocationParts> = {},
  origin?: string,
) => {
  const fallbackOrigin =
    origin ??
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost');
  const url = new URL(addBasename('/'), fallbackOrigin);

  url.hash = createPath({
    pathname: normalizePathname(nextLocation.pathname ?? '/'),
    search: normalizeSearch(nextLocation.search ?? ''),
    hash: normalizeHash(nextLocation.hash ?? ''),
  });

  return url;
};

export const buildAppUrl = (nextLocation: Partial<AppLocationParts> = {}) => {
  if (typeof window === 'undefined') {
    return new URL('http://localhost/');
  }

  const location = withDefaults(nextLocation);
  const url = new URL(window.location.href);

  if (isHashRoutedUrl()) {
    url.hash = createPath({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  } else {
    url.pathname = addBasename(location.pathname);
    url.search = location.search;
    url.hash = location.hash;
  }

  return url;
};

export const getAppHref = () => buildAppUrl().toString();

export const normalizeInitialHashRouteEntry = () => {
  if (typeof window === 'undefined' || isHashRoutedUrl()) {
    return false;
  }

  const legacyPathname = normalizePathname(
    stripBasename(window.location.pathname || '/'),
  );

  if (!KNOWN_APP_ROUTE_PATHS.has(legacyPathname)) {
    return false;
  }

  const rewrittenUrl = buildHashAppUrl({
    pathname: legacyPathname,
    search: window.location.search,
    hash: window.location.hash,
  });

  window.history.replaceState(
    window.history.state,
    '',
    rewrittenUrl.toString(),
  );
  return true;
};

export const replaceAppUrl = (nextLocation: Partial<AppLocationParts>) => {
  const url = buildAppUrl(nextLocation);
  window.history.replaceState(window.history.state, '', url.toString());
  return url;
};
