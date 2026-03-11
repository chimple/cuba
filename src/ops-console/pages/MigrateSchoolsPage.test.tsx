import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MigrateSchoolsPage from "./MigrateSchoolsPage";
import { useMigrateSchoolsPageLogic } from "./MigrateSchoolsPageLogic";

jest.mock("i18next", () => ({ t: (key: string) => key }));

jest.mock("./MigrateSchoolsPageLogic", () => ({
  useMigrateSchoolsPageLogic: jest.fn(),
}));

jest.mock("../components/DataTableBody", () => (props: any) => (
  <div data-testid="data-table">
    <div data-testid="selected-row-ids">{JSON.stringify(props.selectedRowIds)}</div>
    <div data-testid="toggle-enabled">{String(Boolean(props.onToggleRowSelection))}</div>
    <button
      data-testid="toggle-row"
      onClick={() => props.onToggleRowSelection?.("school-1")}
    >
      toggle-row
    </button>
    <button
      data-testid="select-all"
      onClick={() => props.onToggleSelectAll?.(true, props.rows)}
    >
      select-all
    </button>
    <button data-testid="sort-name" onClick={() => props.onSort?.("name")}>
      sort-name
    </button>
  </div>
));

jest.mock("../components/DataTablePagination", () => (props: any) => (
  <div data-testid="pagination">
    <button data-testid="go-page-2" onClick={() => props.onPageChange(2)}>
      go-page-2
    </button>
  </div>
));

jest.mock("../components/SearchAndFilter", () => (props: any) => (
  <div data-testid="search-filter">
    <input
      data-testid="search-input"
      value={props.searchTerm}
      onChange={props.onSearchChange}
    />
    <button data-testid="open-filter" onClick={props.onFilterClick}>
      open-filter
    </button>
    <button data-testid="clear-filters" onClick={props.onClearFilters}>
      clear-filters
    </button>
  </div>
));

jest.mock("../components/FilterSlider", () => (props: any) => (
  <div data-testid="filter-slider" data-open={String(props.isOpen)}>
    <button data-testid="close-filter" onClick={props.onClose}>
      close-filter
    </button>
    <button data-testid="apply-filter" onClick={props.onApply}>
      apply-filter
    </button>
    <button data-testid="cancel-filter" onClick={props.onCancel}>
      cancel-filter
    </button>
  </div>
));

jest.mock("../components/SelectedFilters", () => (props: any) => (
  <div data-testid="selected-filters">
    <button
      data-testid="delete-filter"
      onClick={() => props.onDeleteFilter?.("state", "Karnataka")}
    >
      delete-filter
    </button>
  </div>
));

jest.mock("../components/CommonPopup", () => (props: any) =>
  props.open ? (
    <div data-testid="common-popup">
      <div data-testid="popup-title">{props.title}</div>
      <div data-testid="popup-subtitle">{props.subtitle}</div>
      <button data-testid="close-popup" onClick={props.onClose}>
        close-popup
      </button>
    </div>
  ) : null,
);

const mockUseMigrateSchoolsPageLogic =
  useMigrateSchoolsPageLogic as jest.MockedFunction<
    typeof useMigrateSchoolsPageLogic
  >;

const createLogicState = (overrides: Partial<any> = {}) => ({
  activeTab: "migrate",
  searchTerm: "",
  filters: {
    program: [],
    programType: [],
    state: [],
    district: [],
    cluster: [],
    block: [],
  },
  tempFilters: {
    program: [],
    programType: [],
    state: [],
    district: [],
    cluster: [],
    block: [],
  },
  filterOptions: {
    program: ["Program A"],
    programType: ["Private"],
    state: ["Karnataka"],
    district: ["Bangalore"],
    cluster: ["Cluster A"],
    block: ["Block A"],
  },
  isFilterOpen: false,
  isLoading: false,
  rows: [
    {
      id: "school-1",
      sch_id: "school-1",
      name: { value: "School One", subtitle: "123 - Karnataka" },
    },
  ],
  orderBy: "",
  orderDir: "asc",
  selectedSchoolIds: [],
  isMigrateDialogOpen: false,
  isSuccessPopupOpen: false,
  isFailurePopupOpen: false,
  isMigrating: false,
  page: 1,
  pageCount: 1,
  columns: [
    { key: "name", label: "School Name", sortable: true },
    { key: "programName", label: "Program Name", sortable: false },
  ],
  filterConfigsForSchool: [],
  isSelectionActionVisible: false,
  setPage: jest.fn(),
  handleSort: jest.fn(),
  handleToggleSchoolSelection: jest.fn(),
  handleSelectAllVisible: jest.fn(),
  handleClearFilters: jest.fn(),
  handleOpenFilter: jest.fn(),
  handleDeleteFilter: jest.fn(),
  handleFilterSliderClose: jest.fn(),
  handleTempFilterChange: jest.fn(),
  handleApplyFilters: jest.fn(),
  handleTabChange: jest.fn(),
  handleSearchChange: jest.fn(),
  handleOpenMigrateDialog: jest.fn(),
  handleCloseMigrateDialog: jest.fn(),
  handleCloseSuccessPopup: jest.fn(),
  handleCloseFailurePopup: jest.fn(),
  handleConfirmMigrate: jest.fn(),
  ...overrides,
});

const renderPage = (overrides: Partial<any> = {}) => {
  const state = createLogicState(overrides);
  mockUseMigrateSchoolsPageLogic.mockReturnValue(state as any);
  render(<MigrateSchoolsPage />);
  return state;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("MigrateSchoolsPage component", () => {
  // TC UI-1: Render heading, tabs, and bell icon from component shell.
  it("renders title, tabs and bell icon", () => {
    renderPage();
    expect(screen.getByText("Migrate Schools")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Migrate" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Migrated" })).toBeInTheDocument();
    expect(document.querySelector(".migrate-schools-bell-icon")).toBeInTheDocument();
  });

  // TC 1.3: Keep Migrate tab active by default.
  it("marks Migrate tab as active by default", () => {
    renderPage({ activeTab: "migrate" });
    expect(screen.getByRole("tab", { name: "Migrate" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // TC UI-2: Keep table and footer hidden while loading state is true.
  it("hides table/footer while loading", () => {
    renderPage({ isLoading: true });
    expect(screen.queryByTestId("data-table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    expect(screen.queryByText("No schools found.")).not.toBeInTheDocument();
  });

  // TC UI-3: Render table and pagination when rows are available.
  it("renders table and pagination when rows exist", () => {
    renderPage({ rows: [{ id: "school-1", sch_id: "school-1" }], pageCount: 2 });
    expect(screen.getByTestId("data-table")).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  // TC UI-4: Show empty-state message when no rows are available.
  it("renders empty state when rows are empty", () => {
    renderPage({ rows: [], pageCount: 0 });
    expect(screen.getByText("No schools found.")).toBeInTheDocument();
    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
  });

  // TC UI-5: Wire tab click events to logic handlers.
  it("calls handleTabChange when Migrated tab is clicked", async () => {
    const user = userEvent.setup();
    const state = renderPage();
    await user.click(screen.getByRole("tab", { name: "Migrated" }));
    expect(state.handleTabChange).toHaveBeenCalledWith("migrated");
  });

  // TC UI-6: Wire search input changes to logic handler.
  it("calls handleSearchChange from search input", async () => {
    const state = renderPage();
    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "abc" },
    });
    expect(state.handleSearchChange).toHaveBeenLastCalledWith("abc");
  });

  // TC UI-7: Wire open and clear actions from SearchAndFilter.
  it("calls open and clear filter handlers", async () => {
    const user = userEvent.setup();
    const state = renderPage();
    await user.click(screen.getByTestId("open-filter"));
    await user.click(screen.getByTestId("clear-filters"));
    expect(state.handleOpenFilter).toHaveBeenCalledTimes(1);
    expect(state.handleClearFilters).toHaveBeenCalledTimes(1);
  });

  // TC UI-8: Wire filter slider and selected filter delete actions.
  it("wires filter apply/cancel/close and filter delete handlers", async () => {
    const user = userEvent.setup();
    const state = renderPage({ isFilterOpen: true });
    await user.click(screen.getByTestId("apply-filter"));
    await user.click(screen.getByTestId("cancel-filter"));
    await user.click(screen.getByTestId("close-filter"));
    await user.click(screen.getByTestId("delete-filter"));
    expect(state.handleApplyFilters).toHaveBeenCalledTimes(1);
    expect(state.handleClearFilters).toHaveBeenCalledTimes(1);
    expect(state.handleFilterSliderClose).toHaveBeenCalledTimes(1);
    expect(state.handleDeleteFilter).toHaveBeenCalledWith("state", "Karnataka");
  });

  // TC UI-9: Show selection footer with selected count and migrate action.
  it("renders selection action panel with selected count", () => {
    renderPage({
      isSelectionActionVisible: true,
      selectedSchoolIds: ["school-1", "school-2"],
    });
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.getByText("Schools Selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Migrate" })).toBeInTheDocument();
  });

  // TC 8.1: Hide migrate action button when nothing is selected.
  it("hides migrate action button when nothing is selected", () => {
    renderPage({ isSelectionActionVisible: false, selectedSchoolIds: [] });
    expect(
      screen.queryByRole("button", { name: /^Migrate$/ }),
    ).not.toBeInTheDocument();
  });

  // TC 8.2: Clicking migrate action button requests opening confirmation dialog.
  it("calls handleOpenMigrateDialog when footer migrate button is clicked", async () => {
    const user = userEvent.setup();
    const state = renderPage({
      isSelectionActionVisible: true,
      selectedSchoolIds: ["school-1"],
    });
    await user.click(screen.getByRole("button", { name: /^Migrate$/ }));
    expect(state.handleOpenMigrateDialog).toHaveBeenCalledTimes(1);
  });

  // TC UI-10: Forward table selection and sort callbacks to logic handlers.
  it("wires row toggle/select-all/sort callbacks", async () => {
    const user = userEvent.setup();
    const state = renderPage();
    await user.click(screen.getByTestId("toggle-row"));
    await user.click(screen.getByTestId("select-all"));
    await user.click(screen.getByTestId("sort-name"));
    expect(state.handleToggleSchoolSelection).toHaveBeenCalledWith("school-1");
    expect(state.handleSelectAllVisible).toHaveBeenCalledTimes(1);
    expect(state.handleSort).toHaveBeenCalledWith("name");
  });

  // TC UI-11: Forward pagination changes to setPage.
  it("wires pagination onPageChange to setPage", async () => {
    const user = userEvent.setup();
    const state = renderPage({ pageCount: 2 });
    await user.click(screen.getByTestId("go-page-2"));
    expect(state.setPage).toHaveBeenCalledWith(2);
  });

  // TC UI-12: Render dialog and wire cancel/confirm actions.
  it("renders migrate dialog and wires cancel/confirm handlers", async () => {
    const user = userEvent.setup();
    const state = renderPage({ isMigrateDialogOpen: true, selectedSchoolIds: ["id-1"] });
    expect(
      screen.getByText(
        "Are you sure you want to migrate the selected {{count}} schools to the next academic year?",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("This cannot be reversed. Please be certain.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Migrate" }));
    expect(state.handleCloseMigrateDialog).toHaveBeenCalledTimes(1);
    expect(state.handleConfirmMigrate).toHaveBeenCalledTimes(1);
  });

  // TC UI-13: Show migrating state text and disable confirm button.
  it("shows migrating loading state in dialog", () => {
    renderPage({ isMigrateDialogOpen: true, isMigrating: true, selectedSchoolIds: ["id-1"] });
    const migratingButton = screen.getByRole("button", { name: "Migrating..." });
    expect(migratingButton).toBeDisabled();
  });

  // TC UI-14: Render and close success popup from component props.
  it("renders success popup and wires close handler", async () => {
    const user = userEvent.setup();
    const state = renderPage({
      isSuccessPopupOpen: true,
      selectedSchoolIds: ["school-1", "school-2"],
    });
    expect(screen.getByTestId("popup-title")).toHaveTextContent(
      "Successfully Migrated",
    );
    expect(screen.getByTestId("popup-subtitle")).toHaveTextContent(
      "Selected {{count}} schools have migrated to the next academic year.",
    );
    await user.click(screen.getByTestId("close-popup"));
    expect(state.handleCloseSuccessPopup).toHaveBeenCalledTimes(1);
  });

  // TC UI-15: Render and close failure popup from component props.
  it("renders failure popup and wires close handler", async () => {
    const user = userEvent.setup();
    const state = renderPage({ isFailurePopupOpen: true });
    expect(screen.getByTestId("popup-title")).toHaveTextContent(
      "Something went wrong",
    );
    expect(screen.getByTestId("popup-subtitle")).toHaveTextContent(
      "We couldn't complete the migration. Please try again later",
    );
    await user.click(screen.getByTestId("close-popup"));
    expect(state.handleCloseFailurePopup).toHaveBeenCalledTimes(1);
  });

  // TC UI-16: Keep selection column visuals but disable selection behavior on migrated tab.
  it("passes no selected rows and disables toggle handler on migrated tab", () => {
    renderPage({
      activeTab: "migrated",
      selectedSchoolIds: ["school-1"],
      rows: [{ id: "school-1", sch_id: "school-1" }],
    });
    expect(screen.getByTestId("selected-row-ids")).toHaveTextContent("[]");
    expect(screen.getByTestId("toggle-enabled")).toHaveTextContent("false");
    expect(
      document.querySelector(".migrate-schools-table-wrap-hide-selection"),
    ).toBeInTheDocument();
  });
});
