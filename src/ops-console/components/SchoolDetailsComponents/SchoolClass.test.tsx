import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SchoolClasses, { ClassRow, SchoolDetailsData } from './SchoolClass';
import type { ClassMetricsForClassListingRow } from '../../../services/api/ServiceApi';

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: () => false,
}));

jest.mock('../../../redux/hooks', () => ({
  useAppSelector: () => ({ roles: [] }),
}));

jest.mock('../../../utility/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

type ApiHandlerMock = {
  getClassMetricsForClassListing: jest.Mock<
    Promise<ClassMetricsForClassListingRow[]>,
    [{ schoolId: string; date_range?: string }]
  >;
  getClassCodeById: jest.Mock<Promise<string | null>, [string]>;
  getWhatsappGroupDetails: jest.Mock<Promise<null>, [string, string]>;
  getPhoneDetailsByBotNum: jest.Mock<Promise<null>, [string, string | null]>;
  createClassCode: jest.Mock<Promise<string>, [string]>;
  addStudentWithParentValidation: jest.Mock<
    Promise<{ success: boolean; message?: string }>,
    [Record<string, unknown>]
  >;
};

const mockApiHandler: ApiHandlerMock = {
  getClassMetricsForClassListing: jest.fn(),
  getClassCodeById: jest.fn(),
  getWhatsappGroupDetails: jest.fn(),
  getPhoneDetailsByBotNum: jest.fn(),
  createClassCode: jest.fn(),
  addStudentWithParentValidation: jest.fn(),
};

jest.mock('../../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

jest.mock('./ClassDetailsPage', () => {
  return function MockClassDetailsPage() {
    return <div data-testid="mock-class-details" />;
  };
});

jest.mock('../ClassForm', () => {
  return function MockClassForm() {
    return <div data-testid="mock-class-form" />;
  };
});

jest.mock('./FormCard', () => ({
  __esModule: true,
  default: () => null,
}));

type ActionMenuItem = {
  name: string;
  onClick?: () => void;
};

jest.mock('./ActionMenu', () => {
  return function MockActionMenu({ items }: { items: ActionMenuItem[] }) {
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

jest.mock('../SchoolListDateRangeDropdown', () => {
  return function MockSchoolListDateRangeDropdown({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) {
    return (
      <select
        aria-label="Date range"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="7d">Last 7 Days</option>
        <option value="15d">Last 15 Days</option>
        <option value="30d">Last 30 Days</option>
      </select>
    );
  };
});

type MockColumn = {
  key: string;
  label: string;
};

type RenderableCell =
  | string
  | number
  | null
  | undefined
  | { render?: React.ReactNode };

type MockRow = Record<string, RenderableCell>;

jest.mock('../DataTableBody', () => {
  return function MockDataTableBody({
    columns,
    rows,
  }: {
    columns: MockColumn[];
    rows: MockRow[];
  }) {
    return (
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={String(row.id)} data-testid={`class-row-${row.id}`}>
              {columns.map((column) => {
                const cell = row[column.key];
                const content =
                  cell && typeof cell === 'object' && 'render' in cell
                    ? cell.render
                    : String(cell ?? '');
                return <td key={column.key}>{content}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };
});

const classRows = [
  {
    id: 'class-1',
    name: '1A',
    code: 'MATH1A2026',
    studentCount: 10,
    grade: 1,
    section: 'A',
  },
] as ClassRow[];

const baseData = {
  schoolData: {
    id: 'school-1',
    name: 'XYZ School',
    model: 'at_home',
    whatsapp_bot_number: null,
  },
  classData: classRows,
} as unknown as SchoolDetailsData;

describe('SchoolClasses class metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiHandler.getClassCodeById.mockResolvedValue(null);
    mockApiHandler.getWhatsappGroupDetails.mockResolvedValue(null);
    mockApiHandler.getPhoneDetailsByBotNum.mockResolvedValue(null);
    mockApiHandler.createClassCode.mockResolvedValue('123456');
    mockApiHandler.addStudentWithParentValidation.mockResolvedValue({
      success: true,
    });
  });

  it('renders class listing metrics and percentage chips from the metrics RPC', async () => {
    mockApiHandler.getClassMetricsForClassListing.mockResolvedValue([
      {
        class_id: 'class-1',
        class_name: '1A',
        class_code: 123456,
        onboarded_students: 10,
        activated_students: 7,
        active_students: 4,
        avg_time_spent: 22,
        active_teachers: 2,
        total_teachers: 4,
        activities_assigned: 12,
        avg_assignments_completed: 3.5,
        avg_activities_completed: 8.1,
      },
    ]);

    render(<SchoolClasses data={baseData} schoolId="school-1" />);

    await waitFor(() =>
      expect(
        mockApiHandler.getClassMetricsForClassListing,
      ).toHaveBeenCalledWith({
        schoolId: 'school-1',
        date_range: '7d',
      }),
    );

    const row = await screen.findByTestId('class-row-class-1');

    expect(within(row).getByText('1A')).toBeInTheDocument();
    expect(within(row).getByText('MATH1A2026')).toBeInTheDocument();
    expect(within(row).getByText('Needs Attention')).toBeInTheDocument();
    expect(within(row).getByText('10')).toBeInTheDocument();
    expect(within(row).getByText('7')).toBeInTheDocument();
    expect(within(row).getByText('70%')).toBeInTheDocument();
    expect(within(row).getByText('4')).toBeInTheDocument();
    expect(within(row).getByText('57%')).toBeInTheDocument();
    expect(within(row).getByText('22m')).toBeInTheDocument();
    expect(within(row).getByText('2')).toBeInTheDocument();
    expect(within(row).getByText('50%')).toBeInTheDocument();
    expect(within(row).getByText('12')).toBeInTheDocument();
    expect(within(row).getByText('3.5')).toBeInTheDocument();
    expect(within(row).getByText('8.1')).toBeInTheDocument();
  });

  it('refetches class metrics when the date range changes', async () => {
    mockApiHandler.getClassMetricsForClassListing.mockResolvedValue([]);

    render(<SchoolClasses data={baseData} schoolId="school-1" />);

    await waitFor(() =>
      expect(
        mockApiHandler.getClassMetricsForClassListing,
      ).toHaveBeenCalledWith({
        schoolId: 'school-1',
        date_range: '7d',
      }),
    );

    await userEvent.selectOptions(screen.getByLabelText('Date range'), '15d');

    await waitFor(() =>
      expect(
        mockApiHandler.getClassMetricsForClassListing,
      ).toHaveBeenCalledWith({
        schoolId: 'school-1',
        date_range: '15d',
      }),
    );
  });
});
