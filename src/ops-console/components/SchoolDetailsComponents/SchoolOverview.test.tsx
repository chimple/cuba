import { act, render, screen } from '@testing-library/react';
import SchoolOverview from './SchoolOverview';

jest.mock('i18next', () => ({ t: (key: string) => key }));
jest.mock('../../../utility/logger', () => ({ error: jest.fn() }));
jest.mock('../../../redux/hooks', () => ({
  useAppSelector: () => ({ roles: [] }),
}));
jest.mock('react-router', () => ({
  useHistory: () => ({ replace: jest.fn() }),
}));
jest.mock('../SubjectCurriculumCard', () => () => null);
jest.mock('./SchoolLocationCard', () => () => null);
jest.mock('./SchoolFieldCoordinatorsCard', () => () => null);
const mockApi = { getLanguageWithId: jest.fn() };
jest.mock('../../../services/ServiceConfig', () => ({
  ServiceConfig: { getI: () => ({ apiHandler: mockApi }) },
}));

it.each([false, true])(
  'resolves the school language name in the details card (mobile: %s)',
  async (isMobile) => {
    mockApi.getLanguageWithId.mockResolvedValue({ name: 'English' });
    render(
      <SchoolOverview
        isMobile={isMobile}
        data={{ schoolData: { language: 'english-id', model: 'at_school' } }}
      />,
    );
    expect(await screen.findByText('English')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(mockApi.getLanguageWithId).toHaveBeenCalledWith('english-id');
  },
);

it('ignores an old language response after the school language changes', async () => {
  let finishOldRequest!: (language: { name: string }) => void;
  mockApi.getLanguageWithId
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finishOldRequest = resolve;
      }),
    )
    .mockResolvedValueOnce({ name: 'Kannada' });
  const { rerender } = render(
    <SchoolOverview
      isMobile={false}
      data={{ schoolData: { language: 'english-id' } }}
    />,
  );
  rerender(
    <SchoolOverview
      isMobile={false}
      data={{ schoolData: { language: 'kannada-id' } }}
    />,
  );
  expect(await screen.findByText('Kannada')).toBeInTheDocument();
  await act(async () => {
    finishOldRequest({ name: 'English' });
  });
  expect(screen.queryByText('English')).not.toBeInTheDocument();
  expect(screen.getByText('Kannada')).toBeInTheDocument();
});

it('does not fetch a language when none is assigned', () => {
  render(<SchoolOverview isMobile={false} data={{ schoolData: {} }} />);
  expect(mockApi.getLanguageWithId).not.toHaveBeenCalled();
  expect(screen.getByText('Language')).toBeInTheDocument();
});
