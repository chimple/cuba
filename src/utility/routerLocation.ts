const normalizePathname = (pathname: string) => {
  const trimmed = pathname.replace(/\/+$/, '');
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return normalized === '/' || normalized === '/.' ? '/' : normalized;
};

const splitPathAndSearch = (route: string) => {
  const [pathname = '/', ...searchParts] = route.split('?');
  const search = searchParts.length ? `?${searchParts.join('?')}` : '';

  return {
    pathname: normalizePathname(pathname),
    search,
  };
};

const normalizeRoute = (route: string) => {
  if (!route) return '/';
  if (route.startsWith('?')) return `/${route}`;
  return route.startsWith('/') ? route : `/${route}`;
};

export const buildAppRoute = (
  pathname: string,
  searchParams?: URLSearchParams | string,
) => {
  const normalizedPath = normalizePathname(pathname || '/');

  if (!searchParams) return normalizedPath;

  const rawSearch =
    typeof searchParams === 'string' ? searchParams : searchParams.toString();

  if (!rawSearch) return normalizedPath;

  return `${normalizedPath}${
    rawSearch.startsWith('?') ? rawSearch : `?${rawSearch}`
  }`;
};

export const getAppLocation = () => {
  if (typeof window === 'undefined') {
    return {
      pathname: '/',
      search: '',
      pathWithSearch: '/',
    };
  }

  const route = window.location.hash.startsWith('#/')
    ? window.location.hash.slice(1)
    : buildAppRoute(window.location.pathname || '/', window.location.search);
  const { pathname, search } = splitPathAndSearch(route);

  return {
    pathname,
    search,
    pathWithSearch: buildAppRoute(pathname, search),
  };
};

export const getAppPathname = () => getAppLocation().pathname;

export const getAppSearch = () => getAppLocation().search;

export const getAppSearchParams = () => new URLSearchParams(getAppSearch());

export const getAppPathWithSearch = () => getAppLocation().pathWithSearch;

export const getAppHref = () => buildAppUrl(getAppPathWithSearch());

export const buildAppUrl = (route: string) => {
  if (typeof window === 'undefined') return route;
  if (/^[a-z][a-z0-9+.-]*:/i.test(route)) return route;

  return `${window.location.origin}${window.location.pathname}#${normalizeRoute(
    route,
  )}`;
};

export const replaceAppHistory = (route: string) => {
  if (typeof window === 'undefined') return;
  window.history.replaceState(window.history.state, '', buildAppUrl(route));
};

export const replaceAppLocation = (route: string) => {
  if (typeof window === 'undefined') return;
  window.location.replace(buildAppUrl(route));
};
