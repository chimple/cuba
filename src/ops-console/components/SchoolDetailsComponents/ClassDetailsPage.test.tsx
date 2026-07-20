import { render, waitFor } from '@testing-library/react';
import ClassDetailsPage from './ClassDetailsPage';
import type { ClassRow, SchoolDetailsData } from './SchoolClass';

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
  info: jest.fn(),
  error: jest.fn(),
}));

const mockSchoolStudents = jest.fn((_props: unknown) => (
  <div data-testid="school-students" />
));

jest.mock('./SchoolStudents', () => ({
  __esModule: true,
  default: (props: unknown) => mockSchoolStudents(props),
}));

jest.mock('./ClassInfoCard', () => () => <div data-testid="class-info-card" />);
jest.mock('./WhatsAppInfoCard', () => () => (
  <div data-testid="whatsapp-info-card" />
));
jest.mock('./AddNoteModal', () => () => null);

type ApiHandlerMock = {
  getStudentInfoBySchoolId: jest.Mock;
  getActiveStudentsCountByClass: jest.Mock;
  createNoteForSchool: jest.Mock;
};

const mockApiHandler: ApiHandlerMock = {
  getStudentInfoBySchoolId: jest.fn(),
  getActiveStudentsCountByClass: jest.fn(),
  createNoteForSchool: jest.fn(),
};

jest.mock('../../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      apiHandler: mockApiHandler,
    }),
  },
}));

describe('ClassDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiHandler.getStudentInfoBySchoolId.mockResolvedValue({
      data: [],
      total: 0,
    });
    mockApiHandler.getActiveStudentsCountByClass.mockResolvedValue(0);
  });

  it('passes the full school class list into the nested student editor', async () => {
    const classRows = [
      { id: 'class-1', name: '1A' },
      { id: 'class-2', name: '1B' },
    ] as ClassRow[];

    const data = {
      schoolData: {
        id: 'school-1',
        model: 'at_school',
      },
      classData: classRows,
    } as SchoolDetailsData;

    render(
      <ClassDetailsPage
        data={data}
        schoolId="school-1"
        classId="class-1"
        classRow={classRows[0]}
      />,
    );

    await waitFor(() => expect(mockSchoolStudents).toHaveBeenCalled());

    expect(mockSchoolStudents.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          classData: classRows,
        }),
      }),
    );
  });
});
