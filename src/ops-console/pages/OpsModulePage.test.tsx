import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PAGES } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import OpsModulePage from './OpsModulePage';
import {
  MODULE_CARD_DEFINITIONS,
  getModuleCardInitials,
  getModuleCardRoute,
  getModulePointDescription,
} from './OpsModulePageLogic';

const mockPush = jest.fn();
const mockUseAppSelector = jest.fn();

const originalDefinitions = MODULE_CARD_DEFINITIONS.map((item) => ({
  ...item,
}));

const resetDefinitions = () => {
  MODULE_CARD_DEFINITIONS.splice(
    0,
    MODULE_CARD_DEFINITIONS.length,
    ...originalDefinitions.map((item) => ({ ...item })),
  );
};

describe('OpsModulePage logic helpers', () => {
  beforeEach(() => {
    resetDefinitions();
  });

  afterAll(() => {
    resetDefinitions();
  });

  // Covers default module card config availability for page rendering.
  it('keeps at least one module card definition by default', () => {
    expect(MODULE_CARD_DEFINITIONS.length).toBeGreaterThan(0);
    expect(MODULE_CARD_DEFINITIONS[0]).toHaveProperty('title');
  });

  // Covers explicit route override behavior for module navigation.
  it('returns explicit route when route is provided', () => {
    expect(
      getModuleCardRoute('Parent WhatsApp Invitation', '/custom-path'),
    ).toBe('/custom-path');
  });

  // Covers single-word title route generation with lowercased first character.
  it('generates a route for single-word titles', () => {
    expect(getModuleCardRoute('Ops Module')).toBe(
      `${PAGES.SIDEBAR_PAGE}${PAGES.OPS_MODULE_PAGE}/module`,
    );
  });

  // Covers multi-word title route generation into camelCase path segment.
  it('generates a camelCase route for multi-word titles', () => {
    expect(getModuleCardRoute('Parent WhatsApp Invitation')).toBe(
      `${PAGES.SIDEBAR_PAGE}${PAGES.OPS_MODULE_PAGE}/parentWhatsappInvitation`,
    );
  });

  // Covers camelCase title splitting and normalization for route generation.
  it('handles existing camelCase titles while generating route', () => {
    expect(getModuleCardRoute('parentWhatsApp')).toBe(
      `${PAGES.SIDEBAR_PAGE}${PAGES.OPS_MODULE_PAGE}/parentWhatsApp`,
    );
  });

  // Covers hyphen and underscore separators in route generation.
  it('treats hyphen and underscore as title word separators', () => {
    expect(getModuleCardRoute('Parent-WhatsApp_invitation')).toBe(
      `${PAGES.SIDEBAR_PAGE}${PAGES.OPS_MODULE_PAGE}/parentWhatsappInvitation`,
    );
  });

  // Covers special-character cleanup before route segment generation.
  it('ignores special characters while generating route', () => {
    expect(getModuleCardRoute('Parent @ WhatsApp! Invitation#')).toBe(
      `${PAGES.SIDEBAR_PAGE}${PAGES.OPS_MODULE_PAGE}/parentWhatsappInvitation`,
    );
  });

  // Covers initials generation for one-word titles.
  it('returns one uppercase letter for one-word titles', () => {
    expect(getModuleCardInitials('module')).toBe('M');
  });

  // Covers initials generation for two-word titles.
  it('returns two uppercase letters for two-word titles', () => {
    expect(getModuleCardInitials('Parent WhatsApp')).toBe('PW');
  });

  // Covers initials truncation to a maximum of four characters.
  it('limits initials to four characters for long titles', () => {
    expect(getModuleCardInitials('one two three four five')).toBe('OTTF');
  });

  // Covers initials generation with mixed separators and punctuation.
  it('strips punctuation while deriving initials', () => {
    expect(getModuleCardInitials('Parent @ WhatsApp Invitation')).toBe('PWI');
  });

  // Covers safe initials output for empty titles.
  it('returns an empty string for empty title', () => {
    expect(getModuleCardInitials('')).toBe('');
  });

  // Covers custom module point description priority.
  it('returns custom point description when description is provided', () => {
    expect(getModulePointDescription('Module X', 'Custom description')).toBe(
      'Custom description',
    );
  });

  // Covers fallback module point description text when custom description is missing.
  it('returns fallback point description when description is not provided', () => {
    expect(getModulePointDescription('Module X')).toBe(
      'Open the Module X module and continue the related workflow.',
    );
  });
});
