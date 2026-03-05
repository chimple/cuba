import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MigrateSchoolsPage from "./MigrateSchoolsPage";
import { useMigrateSchoolsPageLogic } from "./MigrateSchoolsPageLogic";

jest.mock("i18next", () => ({
  t: (key: string) => key,
}));

jest.mock("./MigrateSchoolsPageLogic", () => ({
  useMigrateSchoolsPageLogic: jest.fn(),
  MigrationTab: {},
}));

jest.mock("../components/DataTableBody", () => (props: any) => (
  <div data-testid="data-table">
    <button onClick={() => props.onSort("name")}>sort-name</button>
    <button onClick={() => props.onToggleRowSelection("row-1")}>toggle-row</button>
    <button onClick={() => props.onToggleSelectAll(true, [{ id: "row-1" }])}>
      select-all
    </button>
  </div>
));

jest.mock("../components/DataTablePagination", () => (props: any) => (
  <button data-testid="pagination" onClick={() => props.onPageChange(2)}>
    pagination
  </button>
));

jest.mock("../components/SearchAndFilter", () => (props: any) => (
  <div>
    <input
      data-testid="search-input"
      value={props.searchTerm}
      onChange={(e) => props.onSearchChange(e)}
    />
    <button onClick={props.onFilterClick}>open-filter</button>
    <button onClick={props.onClearFilters}>clear-filter</button>
  </div>
));

jest.mock("../components/FilterSlider", () => (props: any) => (
  <div data-testid="filter-slider">
    <button onClick={props.onClose}>close-slider</button>
    <button onClick={() => props.onFilterChange("state", ["Karnataka"])}>
      change-filter
    </button>
    <button onClick={props.onApply}>apply-filter</button>
    <button onClick={props.onCancel}>cancel-filter</button>
  </div>
));

jest.mock("../components/SelectedFilters", () => (props: any) => (
  <div data-testid="selected-filters">
    <button onClick={() => props.onDeleteFilter("state", "Karnataka")}>
      delete-chip
    </button>
  </div>
));

jest.mock("../components/CommonPopup", () => (props: any) =>
  props.open ? (
    <div
      data-testid={
        props.title === "Migration Failed" ? "failure-popup" : "success-popup"
      }
    >
      <div>{props.title}</div>
      <div>{props.subtitle}</div>
      <button onClick={props.onClose}>close-popup</button>
    </div>
  ) : null,
);

const mockUseLogic = useMigrateSchoolsPageLogic as jest.Mock;

const createLogicState = (overrides: Partial<Record<string, any>> = {}) => ({
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
    program: [],
    programType: [],
    state: [],
    district: [],
    cluster: [],
    block: [],
  },
  isFilterOpen: false,
  isLoading: false,
  rows: [],
  orderBy: "",
  orderDir: "asc",
  selectedSchoolIds: [],
  isMigrateDialogOpen: false,
  isSuccessPopupOpen: false,
  isFailurePopupOpen: false,
  isMigrating: false,
  page: 1,
  pageCount: 0,
  columns: [
    { key: "name", label: "School Name", sortable: false },
    { key: "programName", label: "Program Name", sortable: false },
  ],
  filterConfigsForSchool: [
    { key: "program", label: "Select Program" },
    { key: "state", label: "Select State" },
  ],
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

describe("MigrateSchoolsPage component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLogic.mockReturnValue(createLogicState());
  });

  // TC 1.1-1.2-1.4: Render page title, both tabs, and notification bell icon.
  it("should render title, migrate/migrated tabs and bell icon", () => {
    render(<MigrateSchoolsPage />);
    expect(screen.getByText("Migrate Schools")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Migrate" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Migrated" })).toBeInTheDocument();
    expect(document.querySelector(".migrate-schools-bell-icon")).toBeInTheDocument();
  });

  // TC 1.3: Keep Migrate tab selected on initial render.
  it("should mark migrate tab active by default", () => {
    render(<MigrateSchoolsPage />);
    expect(screen.getByRole("tab", { name: "Migrate" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  // TC 1.5-1.6-3.7: Hide table, pagination, and empty state during loading.
  it("should hide table, footer and empty state while loading", () => {
    mockUseLogic.mockReturnValue(
      createLogicState({ isLoading: true, rows: [{ id: "1" }] }),
    );
    render(<MigrateSchoolsPage />);
    expect(screen.queryByTestId("data-table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    expect(screen.queryByText("No schools found.")).not.toBeInTheDocument();
  });

  // TC 3.3-3.4: Show table and pagination when data rows are present.
  it("should render data table and pagination when rows are available", () => {
    mockUseLogic.mockReturnValue(
      createLogicState({
        rows: [{ id: "1", sch_id: "1" }],
        pageCount: 2,
      }),
    );
    render(<MigrateSchoolsPage />);
    expect(screen.getByTestId("data-table")).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  // TC 3.5: Show empty state when no rows are returned and not loading.
  it("should render empty state when rows are empty and not loading", () => {
    render(<MigrateSchoolsPage />);
    expect(screen.getByText("No schools found.")).toBeInTheDocument();
  });

  // TC 2.1: Invoke tab change handler when Migrated tab is clicked.
  it("should call handleTabChange when migrated tab is clicked", async () => {
    const handleTabChange = jest.fn();
    mockUseLogic.mockReturnValue(createLogicState({ handleTabChange }));

    render(<MigrateSchoolsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Migrated" }));
    expect(handleTabChange).toHaveBeenCalledWith("migrated");
  });

  // TC 6.1: Propagate search input value to search handler.
  it("should call handleSearchChange from search input", () => {
    const handleSearchChange = jest.fn();
    mockUseLogic.mockReturnValue(createLogicState({ handleSearchChange }));

    render(<MigrateSchoolsPage />);
    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "abc" },
    });
    expect(handleSearchChange).toHaveBeenCalledWith("abc");
  });

  // TC 8.1-8.8: Wire filter open and clear actions from SearchAndFilter.
  it("should call open and clear filter handlers", () => {
    const handleOpenFilter = jest.fn();
    const handleClearFilters = jest.fn();
    mockUseLogic.mockReturnValue(
      createLogicState({ handleOpenFilter, handleClearFilters }),
    );

    render(<MigrateSchoolsPage />);
    fireEvent.click(screen.getByText("open-filter"));
    fireEvent.click(screen.getByText("clear-filter"));
    expect(handleOpenFilter).toHaveBeenCalled();
    expect(handleClearFilters).toHaveBeenCalled();
  });

  // TC 8.2-8.3-8.5: Wire filter slider close/change/apply and filter chip delete actions.
  it("should wire filter slider close/change/apply and selected filter delete", () => {
    const handleFilterSliderClose = jest.fn();
    const handleTempFilterChange = jest.fn();
    const handleApplyFilters = jest.fn();
    const handleDeleteFilter = jest.fn();

    mockUseLogic.mockReturnValue(
      createLogicState({
        isFilterOpen: true,
        handleFilterSliderClose,
        handleTempFilterChange,
        handleApplyFilters,
        handleDeleteFilter,
      }),
    );

    render(<MigrateSchoolsPage />);
    fireEvent.click(screen.getByText("close-slider"));
    fireEvent.click(screen.getByText("change-filter"));
    fireEvent.click(screen.getByText("apply-filter"));
    fireEvent.click(screen.getByText("delete-chip"));

    expect(handleFilterSliderClose).toHaveBeenCalled();
    expect(handleTempFilterChange).toHaveBeenCalledWith("state", ["Karnataka"]);
    expect(handleApplyFilters).toHaveBeenCalled();
    expect(handleDeleteFilter).toHaveBeenCalledWith("state", "Karnataka");
  });

  // TC 9.6-9.7: Show selection action panel and selected school count.
  it("should show selection action panel with selected count when visible", () => {
    mockUseLogic.mockReturnValue(
      createLogicState({
        rows: [{ id: "1", sch_id: "1" }],
        isSelectionActionVisible: true,
        selectedSchoolIds: ["1", "2"],
      }),
    );
    render(<MigrateSchoolsPage />);
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.getByText("Schools Selected")).toBeInTheDocument();
    expect(document.getElementById("migrate-schools-migrate-button")).toBeInTheDocument();
  });

  // TC 9.1-9.3: Wire row selection, select-all, and sort callbacks from table body.
  it("should wire data table selection and sort callbacks", () => {
    const handleSort = jest.fn();
    const handleToggleSchoolSelection = jest.fn();
    const handleSelectAllVisible = jest.fn();
    mockUseLogic.mockReturnValue(
      createLogicState({
        rows: [{ id: "1", sch_id: "1" }],
        handleSort,
        handleToggleSchoolSelection,
        handleSelectAllVisible,
      }),
    );

    render(<MigrateSchoolsPage />);
    fireEvent.click(screen.getByText("sort-name"));
    fireEvent.click(screen.getByText("toggle-row"));
    fireEvent.click(screen.getByText("select-all"));

    expect(handleSort).toHaveBeenCalledWith("name");
    expect(handleToggleSchoolSelection).toHaveBeenCalledWith("row-1");
    expect(handleSelectAllVisible).toHaveBeenCalledWith(true, [{ id: "row-1" }]);
  });

  // TC 12.2: Wire pagination page change callback to setPage.
  it("should wire pagination onPageChange to setPage", () => {
    const setPage = jest.fn();
    mockUseLogic.mockReturnValue(
      createLogicState({
        rows: [{ id: "1", sch_id: "1" }],
        pageCount: 2,
        setPage,
      }),
    );

    render(<MigrateSchoolsPage />);
    fireEvent.click(screen.getByTestId("pagination"));
    expect(setPage).toHaveBeenCalledWith(2);
  });

  // TC 10.3-10.4-10.5-10.7: Render migrate confirmation dialog and invoke cancel/confirm handlers.
  it("should render migrate dialog and call cancel/confirm handlers", () => {
    const handleCloseMigrateDialog = jest.fn();
    const handleConfirmMigrate = jest.fn();
    mockUseLogic.mockReturnValue(
      createLogicState({
        isMigrateDialogOpen: true,
        selectedSchoolIds: ["1", "2"],
        handleCloseMigrateDialog,
        handleConfirmMigrate,
      }),
    );

    render(<MigrateSchoolsPage />);
    expect(
      screen.getByText(
        "Are you sure you want to migrate the selected {{count}} schools to the next academic year?",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This cannot be reversed. Please be certain."),
    ).toBeInTheDocument();

    const buttons = screen.getAllByText("Cancel");
    fireEvent.click(buttons[buttons.length - 1]);
    fireEvent.click(screen.getAllByText("Migrate").pop() as HTMLElement);

    expect(handleCloseMigrateDialog).toHaveBeenCalled();
    expect(handleConfirmMigrate).toHaveBeenCalled();
  });

  // TC 10.8: Show migrating loading label in confirm button when request is in progress.
  it("should show migrating loading state in confirmation dialog", () => {
    mockUseLogic.mockReturnValue(
      createLogicState({
        isMigrateDialogOpen: true,
        isMigrating: true,
        selectedSchoolIds: ["1"],
      }),
    );

    render(<MigrateSchoolsPage />);
    expect(screen.getByText("Migrating...")).toBeInTheDocument();
  });

  // TC 11.1-11.2-11.3-11.5: Render success popup content and handle popup close action.
  it("should render success popup and call close handler", () => {
    const handleCloseSuccessPopup = jest.fn();
    mockUseLogic.mockReturnValue(
      createLogicState({
        isSuccessPopupOpen: true,
        selectedSchoolIds: ["1", "2", "3"],
        handleCloseSuccessPopup,
      }),
    );

    render(<MigrateSchoolsPage />);
    expect(screen.getByTestId("success-popup")).toBeInTheDocument();
    expect(screen.getByText("Successfully Migrated")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Selected {{count}} schools have migrated to the next academic year.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("close-popup"));
    expect(handleCloseSuccessPopup).toHaveBeenCalled();
  });

  // TC 10.9: Render failure popup content and handle popup close action.
  it("should render failure popup and call close handler", () => {
    const handleCloseFailurePopup = jest.fn();
    mockUseLogic.mockReturnValue(
      createLogicState({
        isFailurePopupOpen: true,
        handleCloseFailurePopup,
      }),
    );

    render(<MigrateSchoolsPage />);
    expect(screen.getByTestId("failure-popup")).toBeInTheDocument();
    expect(screen.getByText("Migration Failed")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to migrate selected schools. Please try again."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("close-popup"));
    expect(handleCloseFailurePopup).toHaveBeenCalled();
  });
});
