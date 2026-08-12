import { parsePath } from 'history';

import { buildAppUrl } from '../../utility/routerLocation';

export const buildReplacementLocation = (url: string) =>
  buildAppUrl(parsePath(url)).toString();

export const replaceLocation = (url: string) => {
  const target = buildReplacementLocation(url);
  window.location.replace(target);
};
