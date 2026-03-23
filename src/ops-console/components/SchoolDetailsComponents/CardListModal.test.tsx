import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardListModal from './CardListModal';
import { ServiceConfig } from '../../../services/ServiceConfig';

/* ================= MOCKS ================= */

jest.mock('i18next', () => ({
  t: (key: string) => key,
}));

jest.mock('../SearchAndFilter', () => (props: any) => (
  <input
    data-testid="search-input"
    value={props.searchTerm}
    onChange={props.onSearchChange}
  />
));

jest.mock('../DataTablePagination', () => (props: any) => (
  <div data-testid="pagination">
    <button onClick={() => props.onPageChange(2)}>go-page-2</button>
  </div>
));

describe('CardListModal', () => {
  const mockApiHandler = {
    searchStudentsInSchool: jest.fn(),
    getStudentInfoBySchoolId: jest.fn(),
  };

  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  const baseProps = {
    open: true,
    schoolId: 'school-1',
    classId: 'class-1',
    primaryStudentId: '1',
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  };

  const baseStudents = [
    {
      user: {
        id: '1',
        name: 'Primary Student',
        student_id: 'ST001',
        gender: 'male',
        phone: '9999999999',
      },
      parent: { phone: '8888888888' },
    },
    {
      user: {
        id: '2',
        name: 'John Doe',
        student_id: 'ST002',
        gender: 'female',
        phone: '7777777777',
      },
      parent: { phone: '6666666666' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(ServiceConfig, 'getI').mockReturnValue({
      apiHandler: mockApiHandler,
    } as any);

    mockApiHandler.getStudentInfoBySchoolId.mockResolvedValue({
      data: baseStudents,
      total: 2,
    });
  });

  /* ================= BASIC ================= */

  it('returns null when open is false', () => {
    const { container } = render(<CardListModal {...baseProps} open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal title', async () => {
    render(<CardListModal {...baseProps} />);

    await waitFor(() =>
      expect(mockApiHandler.getStudentInfoBySchoolId).toHaveBeenCalled(),
    );

    expect(screen.getByText('Merge Student')).toBeInTheDocument();
  });

  it('filters out primary student', async () => {
    render(<CardListModal {...baseProps} />);

    await screen.findByText('John Doe');

    expect(screen.queryByText('Primary Student')).not.toBeInTheDocument();
  });

  it('shows primary contact in subtitle', async () => {
    render(<CardListModal {...baseProps} />);

    await screen.findByText(/\(8888888888\)/);
  });

  /* ================= LOADING / EMPTY ================= */

  it('shows loading state', async () => {
    mockApiHandler.getStudentInfoBySchoolId.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: [], total: 0 }), 50),
        ),
    );

    render(<CardListModal {...baseProps} />);

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state', async () => {
    mockApiHandler.getStudentInfoBySchoolId.mockResolvedValue({
      data: [],
      total: 0,
    });

    render(<CardListModal {...baseProps} />);

    await screen.findByText('No students found');
  });

  /* ================= GENDER ================= */

  it('formats female gender correctly', async () => {
    render(<CardListModal {...baseProps} />);

    await screen.findByText('Female');
  });

  /* ================= PHONE FALLBACK ================= */

  it('uses parent phone first', async () => {
    render(<CardListModal {...baseProps} />);

    await screen.findByText('6666666666');
  });

  it('falls back to email if no phone', async () => {
    mockApiHandler.getStudentInfoBySchoolId.mockResolvedValue({
      data: [
        {
          user: {
            id: '2',
            name: 'Email User',
            email: 'email@test.com',
          },
        },
      ],
      total: 1,
    });

    render(<CardListModal {...baseProps} />);

    await screen.findByText('email@test.com');
  });

  it('shows N/A when no contact', async () => {
    mockApiHandler.getStudentInfoBySchoolId.mockResolvedValue({
      data: [
        {
          user: {
            id: '2',
            name: 'No Contact',
          },
        },
      ],
      total: 1,
    });

    render(<CardListModal {...baseProps} />);

    await waitFor(() =>
      expect(screen.getAllByText('N/A').length).toBeGreaterThan(0),
    );
  });

  /* ================= MERGE FLOW ================= */

  it('merge disabled initially', async () => {
    render(<CardListModal {...baseProps} />);

    await waitFor(() =>
      expect(mockApiHandler.getStudentInfoBySchoolId).toHaveBeenCalled(),
    );

    expect(screen.getByText('Merge')).toBeDisabled();
  });

  it('enables merge after selecting', async () => {
    const user = userEvent.setup();

    render(<CardListModal {...baseProps} />);

    await screen.findByText('John Doe');

    await user.click(screen.getByRole('radio'));

    expect(screen.getByText('Merge')).not.toBeDisabled();
  });

  it('calls onSubmit when merge clicked', async () => {
    const user = userEvent.setup();

    render(<CardListModal {...baseProps} />);

    await screen.findByText('John Doe');

    await user.click(screen.getByRole('radio'));
    await user.click(screen.getByText('Merge'));

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel clicked', async () => {
    const user = userEvent.setup();

    render(<CardListModal {...baseProps} />);

    await user.click(screen.getByText('Cancel'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  /* ================= SEARCH ================= */

  it('calls search API when typing', async () => {
    const user = userEvent.setup();

    mockApiHandler.searchStudentsInSchool.mockResolvedValue({
      data: baseStudents,
      total: 2,
    });

    render(<CardListModal {...baseProps} />);

    await waitFor(() =>
      expect(mockApiHandler.getStudentInfoBySchoolId).toHaveBeenCalled(),
    );

    await user.type(screen.getByTestId('search-input'), 'John');

    await waitFor(() =>
      expect(mockApiHandler.searchStudentsInSchool).toHaveBeenCalled(),
    );
  });

  /* ================= PAGINATION ================= */

  it('changes page when pagination clicked', async () => {
    const user = userEvent.setup();

    mockApiHandler.getStudentInfoBySchoolId.mockResolvedValue({
      data: baseStudents,
      total: 40, // must be > 20
    });

    render(<CardListModal {...baseProps} />);

    await waitFor(() =>
      expect(mockApiHandler.getStudentInfoBySchoolId).toHaveBeenCalled(),
    );

    const button = await screen.findByText('go-page-2');

    await user.click(button);

    await waitFor(() =>
      expect(mockApiHandler.getStudentInfoBySchoolId).toHaveBeenLastCalledWith(
        'school-1',
        2,
        20,
        'class-1',
      ),
    );
  });
});
