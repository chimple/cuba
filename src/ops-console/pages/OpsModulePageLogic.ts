import { PAGES } from '../../common/constants';

export type ModuleCardDefinition = {
  title: string;
  description?: string;
  route?: string;
};

const getModuleTitleWords = (title: string): string[] =>
  title
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9\s_-]+/g, ' ')
    .split(/[\s_-]+/)
    .filter(Boolean);

const getModuleInitialWords = (title: string): string[] =>
  title
    .replace(/[^a-zA-Z0-9\s_-]+/g, ' ')
    .split(/[\s_-]+/)
    .filter(Boolean);

// Add new module entries here to create a new card on the Module page.
export const MODULE_CARD_DEFINITIONS: ModuleCardDefinition[] = [
  {
    title: 'Parent WhatsApp Invitation',
    description:
      'Open the parent WhatsApp invitation workflow and continue to the detailed operations page for invites, messaging, and follow-up actions.',
  },
];

export const getModuleCardRoute = (title: string, route?: string): string => {
  if (route) {
    return route;
  }

  const words = getModuleTitleWords(title);
  const pathSegment = words
    .map((word, index) => {
      const normalizedWord =
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

      return index === 0
        ? normalizedWord.charAt(0).toLowerCase() + normalizedWord.slice(1)
        : normalizedWord;
    })
    .join('');

  return `${PAGES.SIDEBAR_PAGE}${PAGES.MODULE_PAGE}/${pathSegment}`;
};

export const getModuleCardInitials = (title: string): string =>
  getModuleInitialWords(title)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 4);

export const getModulePointDescription = (
  title: string,
  description?: string,
): string =>
  description ?? `Open the ${title} module and continue the related workflow.`;
