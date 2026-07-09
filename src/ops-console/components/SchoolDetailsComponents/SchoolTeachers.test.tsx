import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SchoolTeachers from './SchoolTeachers';
import { TeacherInfo } from '../../../common/constants';
import { ClassRow } from './SchoolClass';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => false,
}));

type ApiResponse<T> = {
  data: T[];
  total: number;
};

type SchoolClassLink = {
  id: string;
  name: string;
};

type ApiHandlerMock = {
  searchTeachersInSchool: jest.Mock<Promise<ApiResponse<TeacherInfo>>, []>;
  getTeacherInfoBySchoolId: jest.Mock<Promise<ApiResponse<TeacherInfo>>, []>;
  getRecentAssignmentCountByTeacher: jest.Mock<Promise<number>, []>;
  getClassesForSchool: jest.Mock<Promise<SchoolClassLink[]>, []>;
  addTeacherToClass: jest.Mock<Promise<void>, []>;
  deleteUserFromClass: jest.Mock<Promise<boolean>, []>;
  getOrcreateschooluser: jest.Mock<Promise<void>, []>;
  getWhatsappGroupDetails: jest.Mock<Promise<null>, []>;
};

const mockApiHandler: ApiHandlerMock = {
  searchTeachersInSchool: jest.fn(),
  getTeacherInfoBySchoolId: jest.fn(),
  getRecentAssignmentCountByTeacher: jest.fn(),
  getClassesForSchool: jest.fn(),
  addTeacherToClass: jest.fn(),
  deleteUserFromClass: jest.fn(),
  getOrcreateschooluser: jest.fn(),
  getWhatsappGroupDetails: jest.fn(),
};

jest.mock('../../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

jest.mock('../SearchAndFilter', () => {
  return function MockSearchAndFilter() {
    return <div data-testid="mock-search-filter" />;
  };
});

jest.mock('../FilterSlider', () => {
  return function MockFilterSlider() {
    return <div data-testid="mock-filter-slider" />;
  };
});

jest.mock('../SelectedFilters', () => {
  return function MockSelectedFilters() {
    return <div data-testid="mock-selected-filters" />;
  };
});

jest.mock('../DataTablePagination', () => {
  return function MockDataTablePagination() {
    return <div data-testid="mock-pagination" />;
  };
});

jest.mock('../fcInteractComponents/FcInteractPopUp', () => {
  return function MockFcInteractPopUp() {
    return <div data-testid="mock-fc-interact-popup" />;
  };
});

jest.mock('../../common/OpsGenericPopup', () => {
  return function MockOpsGenericPopup() {
    return <div data-testid="mock-generic-popup" />;
  };
});

jest.mock('../../OpsUtility/SearchFilterUtility', () => ({
  getGradeOptions: () => [],
  filterBySearchAndFilters: <T,>(items: T[]) => items,
}));

type ActionMenuItem = {
  name: string;
  onClick?: () => void;
};

type ActionMenuProps = {
  items: ActionMenuItem[];
};

jest.mock('./ActionMenu', () => {
  return function MockActionMenu({ items }: ActionMenuProps) {
    return (
      <div data-testid="mock-action-menu">
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => item.onClick?.()}
          >
            {item.name}
          </button>
        ))}
      </div>
    );
  };
});

type MockDataTableColumn<RowType> = {
  key: string;
  render?: (row: RowType) => React.ReactNode;
  renderCell?: (row: RowType) => React.ReactNode;
};

type MockDataTableBodyProps<RowType> = {
  columns: MockDataTableColumn<RowType>[];
  rows: RowType[];
};

jest.mock('../DataTableBody', () => {
  return function MockDataTableBody<RowType extends Record<string, unknown>>({
    columns,
    rows,
  }: MockDataTableBodyProps<RowType>) {
    return (
      <div data-testid="mock-data-table-body">
        {rows.map((row, rowIndex) => (
          <div data-testid={`mock-row-${rowIndex}`} key={`row-${rowIndex}`}>
            {columns.map((column) => (
              <div key={`${column.key}-${rowIndex}`}>
                {column.render
                  ? column.render(row)
                  : column.renderCell
                    ? column.renderCell(row)
                    : String(row[column.key] ?? '')}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };
});

type MockFormCardProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  fields: Array<{
    name: string;
    disabled?: boolean;
    column?: 0 | 1 | 2;
    multi?: boolean;
  }>;
  initialValues?: Record<string, string>;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
};

const mockFormCard = jest.fn((props: MockFormCardProps) => {
  if (!props.open) return null;
  return <div data-testid={`mock-formcard-${props.title}`}>{props.title}</div>;
});

jest.mock('./FormCard', () => ({
  __esModule: true,
  default: (props: MockFormCardProps) => mockFormCard(props),
}));

describe('SchoolTeachers', () => {
  const classRows = [
    { id: 'class-1', name: '6A' },
    { id: 'class-2', name: '6B' },
  ] as ClassRow[];

  const teacher = {
    user: {
      id: 'teacher-1',
      name: 'Gourav',
      gender: 'male',
      phone: '9110667875',
      email: 'gourav@example.com',
    },
    grade: 6,
    classSection: 'A',
    classWithidname: {
      id: 'class-1',
      name: '6A',
    },
  } as TeacherInfo;

  const baseProps: React.ComponentProps<typeof SchoolTeachers> = {
    schoolId: 'school-1',
    isMobile: false,
    data: {
      teachers: [teacher],
      totalTeacherCount: 1,
      classData: classRows,
      students: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockApiHandler.searchTeachersInSchool.mockResolvedValue({
      data: [teacher],
      total: 1,
    });
    mockApiHandler.getTeacherInfoBySchoolId.mockResolvedValue({
      data: [teacher],
      total: 1,
    });
    mockApiHandler.getRecentAssignmentCountByTeacher.mockResolvedValue(0);
    mockApiHandler.getClassesForSchool.mockResolvedValue([
      { id: 'class-1', name: '6A' },
    ]);
    mockApiHandler.addTeacherToClass.mockResolvedValue();
    mockApiHandler.deleteUserFromClass.mockResolvedValue(true);
    mockApiHandler.getOrcreateschooluser.mockResolvedValue();
    mockApiHandler.getWhatsappGroupDetails.mockResolvedValue(null);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <SchoolTeachers {...baseProps} />
      </MemoryRouter>,
    );

  const openEditModal = async () => {
    const user = userEvent.setup();

    renderComponent();

    const editButton = await screen.findByRole('button', {
      name: 'Edit Details',
    });

    await user.click(editButton);

    await waitFor(() =>
      expect(mockApiHandler.getClassesForSchool).toHaveBeenCalledWith(
        'school-1',
        'teacher-1',
      ),
    );
  };

  it('opens edit modal with assignment-only editable fields', async () => {
    await openEditModal();

    const editCall = mockFormCard.mock.calls
      .map((call) => call[0] as MockFormCardProps)
      .find((props) => props.open && props.title === 'Edit Teacher Details');

    expect(editCall).toBeDefined();
    expect(editCall?.initialValues).toEqual(
      expect.objectContaining({
        name: 'Gourav',
        class: 'class-1',
        phoneNumber: '9110667875',
        email: 'gourav@example.com',
      }),
    );
    expect(
      editCall?.fields.find((field) => field.name === 'name')?.disabled,
    ).toBe(true);
    expect(
      editCall?.fields.find((field) => field.name === 'phoneNumber')?.disabled,
    ).toBe(true);
    expect(
      editCall?.fields.find((field) => field.name === 'email')?.disabled,
    ).toBe(true);
    expect(
      editCall?.fields.find((field) => field.name === 'class')?.multi,
    ).toBe(true);
    expect(
      editCall?.fields.find((field) => field.name === 'class')?.column,
    ).toBe(0);
  });

  it('saves class assignment changes by adding and removing only diff classes', async () => {
    await openEditModal();

    const editCall = mockFormCard.mock.calls
      .map((call) => call[0] as MockFormCardProps)
      .find((props) => props.open && props.title === 'Edit Teacher Details');

    expect(editCall).toBeDefined();

    if (!editCall) return;

    await act(async () => {
      await editCall.onSubmit({
        ...(editCall.initialValues ?? {}),
        class: 'class-2',
      });
    });

    expect(mockApiHandler.addTeacherToClass).toHaveBeenCalledWith(
      'school-1',
      'class-2',
      expect.objectContaining({ id: 'teacher-1' }),
    );
    expect(mockApiHandler.deleteUserFromClass).toHaveBeenCalledWith(
      'teacher-1',
      'class-1',
    );
  });

  it('does not call assignment APIs when class selection is unchanged', async () => {
    await openEditModal();

    const editCall = mockFormCard.mock.calls
      .map((call) => call[0] as MockFormCardProps)
      .find((props) => props.open && props.title === 'Edit Teacher Details');

    expect(editCall).toBeDefined();

    if (!editCall) return;

    await act(async () => {
      await editCall.onSubmit({
        ...(editCall.initialValues ?? {}),
        class: editCall.initialValues?.class ?? '',
      });
    });

    expect(mockApiHandler.addTeacherToClass).not.toHaveBeenCalled();
    expect(mockApiHandler.deleteUserFromClass).not.toHaveBeenCalled();
  });
});
