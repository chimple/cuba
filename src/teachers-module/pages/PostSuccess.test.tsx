import { render, waitFor } from '@testing-library/react';
import PostSuccess from './PostSuccess';
import { ServiceConfig } from '../../services/ServiceConfig';
import { PAGES } from '../../common/constants';

const mockReplace = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockGetSchoolsForUser = jest.fn();
const mockGetExistingSchoolRequest = jest.fn();

jest.mock('react-router', () => ({
  useHistory: () => ({ replace: mockReplace }),
}));

jest.mock('../../services/ServiceConfig', () => ({
  ServiceConfig: {
    getI: () => ({
      authHandler: {
        getCurrentUser: mockGetCurrentUser,
      },
      apiHandler: {
        getSchoolsForUser: mockGetSchoolsForUser,
        getExistingSchoolRequest: mockGetExistingSchoolRequest,
      },
    }),
  },
}));

jest.mock('../components/homePage/Header', () => () => null);
jest.mock('i18next', () => ({
  t: (key: string) => key,
}));
jest.mock('../../utility/schoolUtil', () => ({
  schoolUtil: {
    setCurrMode: jest.fn(),
  },
}));

describe('PostSuccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    mockGetExistingSchoolRequest.mockResolvedValue(null);
  });

  it('redirects to display schools when the user has active schools', async () => {
    mockGetSchoolsForUser.mockResolvedValue([
      { school: { id: 'school-1', name: 'School One' }, role: 'teacher' },
    ]);

    render(<PostSuccess />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(PAGES.DISPLAY_SCHOOLS);
    });
  });

  it('stays on request sent when no active schools exist but a pending request does', async () => {
    mockGetSchoolsForUser.mockResolvedValue([]);
    mockGetExistingSchoolRequest.mockResolvedValue({
      id: 'request-1',
      request_status: 'requested',
      school_id: 'school-1',
    });

    render(<PostSuccess />);

    await waitFor(() => {
      expect(mockGetSchoolsForUser).toHaveBeenCalledWith('teacher-1', {
        page: 1,
        page_size: 20,
      });
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to search school when no active schools and no pending request exist', async () => {
    mockGetSchoolsForUser.mockResolvedValue([]);

    render(<PostSuccess />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(PAGES.SEARCH_SCHOOL);
    });
  });
});
