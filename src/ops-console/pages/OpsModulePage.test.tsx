import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PAGES } from '../../common/constants';
import { RoleType } from '../../interface/modelInterfaces';
import ModulePage from './OpsModulePage';
import {
  MODULE_CARD_DEFINITIONS,
  getModuleCardInitials,
  getModuleCardRoute,
  getModulePointDescription,
} from './OpsModulePageLogic';

const mockPush = jest.fn();
const mockUseAppSelector = jest.fn();

jest.mock('i18next', () => ({
  t: jest.fn((key: string, options?: Record<string, unknown>) => {
    if (typeof key !== 'string') return String(key);
    if (key.includes('{{title}}') && options?.title) {
      return key.replace('{{title}}', String(options.title));
    }
    return key;
  }),
}));

jest.mock('../../redux/hooks', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    mockUseAppSelector(selector),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({ push: mockPush }),
  Redirect: ({ to }: { to: string }) => (
    <div data-testid="redirect" data-to={to}>
      redirect
    </div>
  ),
}));

const { t: mockT } = jest.requireMock('i18next') as {
  t: jest.Mock;
};

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

describe('ModulePage component', () => {
  const setRoles = (roles: string[] | null | undefined) => {
    mockUseAppSelector.mockImplementation(
      (selector: (state: unknown) => unknown) => selector({ auth: { roles } }),
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetDefinitions();
    setRoles([RoleType.SUPER_ADMIN]);
  });

  afterAll(() => {
    resetDefinitions();
  });

  // Covers access control for super admin role.
  it('renders module cards for SUPER_ADMIN users', () => {
    setRoles([RoleType.SUPER_ADMIN]);
    render(<ModulePage />);

    expect(screen.getByText('Module')).toBeInTheDocument();
    expect(document.querySelectorAll('#module-page-card')).toHaveLength(
      MODULE_CARD_DEFINITIONS.length,
    );
  });

  // Covers access control for operational director role.
  it('renders module cards for OPERATIONAL_DIRECTOR users', () => {
    setRoles([RoleType.OPERATIONAL_DIRECTOR]);
    render(<ModulePage />);

    expect(screen.getByText('Module')).toBeInTheDocument();
    expect(document.querySelectorAll('#module-page-card')).toHaveLength(
      MODULE_CARD_DEFINITIONS.length,
    );
  });

  // Covers access control for users with both allowed roles.
  it('renders module cards for users with both SUPER_ADMIN and OPERATIONAL_DIRECTOR roles', () => {
    setRoles([RoleType.SUPER_ADMIN, RoleType.OPERATIONAL_DIRECTOR]);
    render(<ModulePage />);

    expect(screen.getByText('Module')).toBeInTheDocument();
    expect(document.querySelectorAll('#module-page-card')).toHaveLength(
      MODULE_CARD_DEFINITIONS.length,
    );
  });

  // Covers redirect for unauthorized role.
  it('redirects users with unrelated roles', () => {
    setRoles([RoleType.TEACHER]);
    render(<ModulePage />);

    expect(screen.getByTestId('redirect')).toHaveAttribute(
      'data-to',
      `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}`,
    );
  });

  // Covers redirect for empty role list.
  it('redirects users when role list is empty', () => {
    setRoles([]);
    render(<ModulePage />);

    expect(screen.getByTestId('redirect')).toHaveAttribute(
      'data-to',
      `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}`,
    );
  });

  // Covers redirect behavior when roles are null or undefined.
  it('redirects users when roles are null or undefined', () => {
    setRoles(undefined);
    render(<ModulePage />);
    expect(screen.getByTestId('redirect')).toHaveAttribute(
      'data-to',
      `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}`,
    );

    setRoles(null);
    render(<ModulePage />);
    expect(screen.getAllByTestId('redirect')[1]).toHaveAttribute(
      'data-to',
      `${PAGES.SIDEBAR_PAGE}${PAGES.PROGRAM_PAGE}`,
    );
  });

  // Covers page title and launcher description rendering.
  it('renders page title and description copy', () => {
    render(<ModulePage />);

    expect(screen.getByText('Module')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Module is the launcher area for grouped ops workflows. Open a card below to move into a dedicated module page and continue the next task.',
      ),
    ).toBeInTheDocument();
  });

  // Covers bullet count and card count matching module definitions.
  it('renders one bullet and one card per module definition', () => {
    render(<ModulePage />);

    expect(document.querySelectorAll('#module-page-point')).toHaveLength(
      MODULE_CARD_DEFINITIONS.length,
    );
    expect(document.querySelectorAll('#module-page-card')).toHaveLength(
      MODULE_CARD_DEFINITIONS.length,
    );
  });

  // Covers custom module description text rendering.
  it('renders custom module description when description exists', () => {
    render(<ModulePage />);

    expect(
      screen.getByText(MODULE_CARD_DEFINITIONS[0].description as string),
    ).toBeInTheDocument();
  });

  // Covers fallback bullet description when a module has no custom description.
  it('renders fallback module description when module description is missing', () => {
    MODULE_CARD_DEFINITIONS.push({ title: 'Dummy Module Without Description' });
    render(<ModulePage />);

    expect(
      screen.getByText(
        'Open the Dummy Module Without Description module and continue the related workflow.',
      ),
    ).toBeInTheDocument();
  });

  // Covers card title, navigate CTA, icon, and initials rendering.
  it('renders card internals including title, Navigate button, icon, and initials', () => {
    const { container } = render(<ModulePage />);

    expect(
      screen.getByText(MODULE_CARD_DEFINITIONS[0].title),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Navigate/i }),
    ).toBeInTheDocument();
    expect(
      container.querySelector('#module-page-cta-icon'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('#module-page-card-initials'),
    ).toBeInTheDocument();
  });

  // Covers navigate click routing for cards without explicit route.
  it('pushes auto-generated route when clicking Navigate on module without explicit route', async () => {
    const user = userEvent.setup();
    render(<ModulePage />);

    await user.click(screen.getByRole('button', { name: /Navigate/i }));

    expect(mockPush).toHaveBeenCalledWith(
      `${PAGES.SIDEBAR_PAGE}${PAGES.MODULE_PAGE}/parentWhatsappInvitation`,
    );
  });

  // Covers navigate click routing for cards with explicit route.
  it('pushes explicit route when clicking Navigate on module with explicit route', async () => {
    const user = userEvent.setup();
    MODULE_CARD_DEFINITIONS.splice(0, MODULE_CARD_DEFINITIONS.length, {
      title: 'Explicit Module',
      route: '/admin-home-page/module-page/explicit',
    });

    render(<ModulePage />);
    await user.click(screen.getByRole('button', { name: /Navigate/i }));

    expect(mockPush).toHaveBeenCalledWith(
      '/admin-home-page/module-page/explicit',
    );
  });

  // Covers per-card route mapping when multiple cards are rendered.
  it('pushes each card-specific route when clicking multiple Navigate buttons', async () => {
    const user = userEvent.setup();
    MODULE_CARD_DEFINITIONS.splice(
      0,
      MODULE_CARD_DEFINITIONS.length,
      {
        title: 'Card One',
      },
      {
        title: 'Card Two',
        route: '/admin-home-page/module-page/cardTwoFixed',
      },
    );

    render(<ModulePage />);

    const buttons = screen.getAllByRole('button', { name: /Navigate/i });
    await user.click(buttons[0]);
    await user.click(buttons[1]);

    expect(mockPush).toHaveBeenNthCalledWith(
      1,
      `${PAGES.SIDEBAR_PAGE}${PAGES.MODULE_PAGE}/cardOne`,
    );
    expect(mockPush).toHaveBeenNthCalledWith(
      2,
      '/admin-home-page/module-page/cardTwoFixed',
    );
  });

  // Covers stable mounting behavior when no module definitions are present.
  it('renders no bullets and no cards when module definitions are empty', () => {
    MODULE_CARD_DEFINITIONS.splice(0, MODULE_CARD_DEFINITIONS.length);
    render(<ModulePage />);

    expect(screen.getByText('Module')).toBeInTheDocument();
    expect(document.querySelectorAll('#module-page-point')).toHaveLength(0);
    expect(document.querySelectorAll('#module-page-card')).toHaveLength(0);
  });

  // Covers translation function usage for translatable Module page labels.
  it('calls i18n t() for key labels instead of hardcoded rendering', () => {
    render(<ModulePage />);

    expect(mockT).toHaveBeenCalledWith('Module');
    expect(mockT).toHaveBeenCalledWith('Navigate');
    expect(mockT).toHaveBeenCalledWith(MODULE_CARD_DEFINITIONS[0].title);
  });

  // Covers rendering behavior when translation output is non-English text.
  it('renders translated non-English labels when t() returns localized strings', () => {
    mockT.mockImplementation((key: string) => {
      if (key === 'Module') return 'Módulo';
      if (key === 'Navigate') return 'Navegar';
      if (key === MODULE_CARD_DEFINITIONS[0].title)
        return 'Invitación WhatsApp';
      return key;
    });

    render(<ModulePage />);

    expect(screen.getByText('Módulo')).toBeInTheDocument();
    expect(screen.getByText('Navegar')).toBeInTheDocument();
    expect(screen.getByText('Invitación WhatsApp')).toBeInTheDocument();
  });
});

describe('ModulePage logic helpers', () => {
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
    expect(getModuleCardRoute('Module')).toBe(
      `${PAGES.SIDEBAR_PAGE}${PAGES.MODULE_PAGE}/module`,
    );
  });

  // Covers multi-word title route generation into camelCase path segment.
  it('generates a camelCase route for multi-word titles', () => {
    expect(getModuleCardRoute('Parent WhatsApp Invitation')).toBe(
      `${PAGES.SIDEBAR_PAGE}${PAGES.MODULE_PAGE}/parentWhatsappInvitation`,
    );
  });

  // Covers camelCase title splitting and normalization for route generation.
  it('handles existing camelCase titles while generating route', () => {
    expect(getModuleCardRoute('parentWhatsApp')).toBe(
      `${PAGES.SIDEBAR_PAGE}${PAGES.MODULE_PAGE}/parentWhatsApp`,
    );
  });

  // Covers hyphen and underscore separators in route generation.
  it('treats hyphen and underscore as title word separators', () => {
    expect(getModuleCardRoute('Parent-WhatsApp_invitation')).toBe(
      `${PAGES.SIDEBAR_PAGE}${PAGES.MODULE_PAGE}/parentWhatsappInvitation`,
    );
  });

  // Covers special-character cleanup before route segment generation.
  it('ignores special characters while generating route', () => {
    expect(getModuleCardRoute('Parent @ WhatsApp! Invitation#')).toBe(
      `${PAGES.SIDEBAR_PAGE}${PAGES.MODULE_PAGE}/parentWhatsappInvitation`,
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
