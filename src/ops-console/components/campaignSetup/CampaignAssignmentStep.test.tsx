import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { CampaignAssignmentOptions } from '../../../services/api/ServiceApi';
import { CampaignAssignmentStep } from './CampaignAssignmentStep';
import {
  createDefaultConfig,
  GradeAssignmentConfig,
} from './campaignAssignmentUtils';
import { CampaignSetupFormState } from './types';
import { CAMPAIGN_OBJECTIVE } from '../../../common/constants';

jest.mock('../../../utility/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const baseForm: CampaignSetupFormState = {
  objective: CAMPAIGN_OBJECTIVE.HOMEWORK,
  targetType: 'percentage_completion',
  targetValue: '90',
  learningPathCount: '',
  campaignName: 'Campaign',
  managerId: 'manager-1',
  startDate: '2026-05-01',
  endDate: '2026-05-31',
  programId: 'program-1',
  groupName: 'Group A',
  rewardType: '',
  rewardRanks: [
    { rank: 1, criteriaValue: '', reward: '' },
    { rank: 2, criteriaValue: '', reward: '' },
    { rank: 3, criteriaValue: '', reward: '' },
  ],
};

const grade = { id: 'grade-1', name: 'Grade 1' };

const assignmentOptions: CampaignAssignmentOptions = {
  grades: [
    {
      gradeId: 'grade-1',
      subjects: [
        {
          id: 'subject-1',
          gradeId: 'grade-1',
          name: 'Science',
          chapters: [
            {
              id: 'chapter-1',
              name: 'Plants Around Us',
              lessons: [
                { id: 'lesson-1', name: 'Parts of plant' },
                { id: 'lesson-2', name: 'Leaf observation' },
              ],
            },
            {
              id: 'chapter-2',
              name: 'Animals and Their Homes',
              lessons: [
                { id: 'lesson-3', name: 'Shelter types' },
                { id: 'lesson-4', name: 'Forest homes' },
              ],
            },
            {
              id: 'chapter-3',
              name: 'Our Body',
              lessons: [
                { id: 'lesson-5', name: 'Body parts' },
                { id: 'lesson-6', name: 'Body care' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const renderStep = ({
  form = baseForm,
  initialConfig,
}: {
  form?: CampaignSetupFormState;
  initialConfig?: GradeAssignmentConfig;
} = {}) => {
  const onCompletionChange = jest.fn();
  const onAssignmentsChange = jest.fn();

  const TestHarness = () => {
    const [configs, setConfigs] = React.useState<
      Record<string, GradeAssignmentConfig>
    >({
      [grade.id]: initialConfig ?? {
        ...createDefaultConfig(),
        subjectIds: ['subject-1'],
      },
    });

    return (
      <CampaignAssignmentStep
        form={form}
        campaignId="campaign-1"
        selectedGrades={[grade]}
        selectedSchoolIds={['school-1']}
        assignmentOptions={assignmentOptions}
        loadingAssignmentOptions={false}
        activeGradeId={grade.id}
        configs={configs}
        onActiveGradeChange={jest.fn()}
        onConfigsChange={setConfigs}
        onCompletionChange={onCompletionChange}
        onAssignmentsChange={onAssignmentsChange}
      />
    );
  };

  render(<TestHarness />);

  return {
    onAssignmentsChange,
    onCompletionChange,
  };
};

const openFrequencySelect = () => {
  const frequencySelect = screen
    .getAllByRole('combobox')
    .find((element) => element.textContent === 'Daily');
  fireEvent.mouseDown(frequencySelect as HTMLElement);
};

const getChapterRow = (chapterName: string) =>
  screen
    .getByText(chapterName)
    .closest('.chapter-selection-chapter-row') as HTMLElement;

describe('CampaignAssignmentStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('shows alternate week for a 14-day campaign and disables it for shorter campaigns', async () => {
    renderStep({
      form: {
        ...baseForm,
        startDate: '2026-05-01',
        endDate: '2026-05-14',
      },
    });

    await screen.findByText('Chapter Selection');
    openFrequencySelect();
    expect(
      await screen.findByRole('option', {
        name: 'Alternate Week (≥ 2 weeks)',
      }),
    ).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('listbox'), {
      key: 'Escape',
      code: 'Escape',
    });

    cleanup();
    renderStep({
      form: {
        ...baseForm,
        startDate: '2026-05-01',
        endDate: '2026-05-13',
      },
    });

    await screen.findByText('Chapter Selection');
    openFrequencySelect();
    expect(
      await screen.findByRole('option', {
        name: 'Alternate Week (≥ 2 weeks)',
      }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('marks the assignment step incomplete when the selected lessons do not cover the schedule', async () => {
    const { onCompletionChange } = renderStep({
      initialConfig: {
        ...createDefaultConfig(),
        subjectIds: ['subject-1'],
        chapterIds: ['chapter-1'],
      },
    });

    expect(
      await screen.findByText('Assignment Summary (2 assignments)'),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(onCompletionChange).toHaveBeenLastCalledWith(false),
    );
  });

  it('marks the assignment step incomplete when alternate week remains selected for a short campaign', async () => {
    const { onCompletionChange } = renderStep({
      form: {
        ...baseForm,
        startDate: '2026-05-01',
        endDate: '2026-05-13',
      },
      initialConfig: {
        ...createDefaultConfig(),
        subjectIds: ['subject-1'],
        chapterIds: ['chapter-1', 'chapter-2', 'chapter-3'],
        frequency: 'alternate_week',
      },
    });

    expect(
      await screen.findByText('Assignment Summary (6 assignments)'),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(onCompletionChange).toHaveBeenLastCalledWith(false),
    );
  });

  it('keeps assignment summary expanded on mobile', async () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width:48rem)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    renderStep({
      initialConfig: {
        ...createDefaultConfig(),
        subjectIds: ['subject-1'],
        chapterIds: ['chapter-1', 'chapter-2'],
      },
    });

    expect(
      await screen.findByText('Assignment Summary (4 assignments)'),
    ).toBeInTheDocument();
    const subjectHeader = document.querySelector(
      '.assignment-summary-subject',
    ) as HTMLElement;
    expect(screen.getByText('Parts of plant')).toBeInTheDocument();

    fireEvent.click(subjectHeader);

    expect(screen.getByText('Parts of plant')).toBeInTheDocument();
  });

  it('shows the helper only when multiple grades are selected', () => {
    const secondGrade = { id: 'grade-2', name: 'Grade 2' };
    const multiGradeOptions: CampaignAssignmentOptions = {
      grades: [
        assignmentOptions.grades[0],
        {
          gradeId: 'grade-2',
          subjects: [
            {
              id: 'subject-2',
              gradeId: 'grade-2',
              name: 'Maths',
              chapters: [],
            },
          ],
        },
      ],
    };

    const { rerender } = render(
      <CampaignAssignmentStep
        form={baseForm}
        campaignId="campaign-1"
        selectedGrades={[grade, secondGrade]}
        selectedSchoolIds={['school-1']}
        assignmentOptions={multiGradeOptions}
        loadingAssignmentOptions={false}
        activeGradeId={grade.id}
        configs={{
          [grade.id]: createDefaultConfig(),
          [secondGrade.id]: createDefaultConfig(),
        }}
        onActiveGradeChange={jest.fn()}
        onConfigsChange={jest.fn()}
        onCompletionChange={jest.fn()}
        onAssignmentsChange={jest.fn()}
      />,
    );

    expect(
      screen.getByText(
        /Assignments should be configured for all selected grades/,
      ),
    ).toBeInTheDocument();

    rerender(
      <CampaignAssignmentStep
        form={baseForm}
        campaignId="campaign-1"
        selectedGrades={[]}
        selectedSchoolIds={['school-1']}
        assignmentOptions={multiGradeOptions}
        loadingAssignmentOptions={false}
        activeGradeId={grade.id}
        configs={{
          [grade.id]: createDefaultConfig(),
          [secondGrade.id]: createDefaultConfig(),
        }}
        onActiveGradeChange={jest.fn()}
        onConfigsChange={jest.fn()}
        onCompletionChange={jest.fn()}
        onAssignmentsChange={jest.fn()}
      />,
    );

    expect(
      screen.queryByText(
        /Assignments should be configured for all selected grades/,
      ),
    ).not.toBeInTheDocument();
  });

  it('does not restore previously removed chapter lessons when assigning another chapter', async () => {
    renderStep({
      initialConfig: {
        ...createDefaultConfig(),
        subjectIds: ['subject-1'],
        chapterIds: ['chapter-1', 'chapter-2'],
      },
    });

    await screen.findByText('Assignment Summary (4 assignments)');

    const deleteButtons = Array.from(
      document.querySelectorAll('.assignment-summary-delete'),
    ) as HTMLButtonElement[];
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(
        document.querySelectorAll('.assignment-summary-delete'),
      ).toHaveLength(3),
    );
    fireEvent.click(
      document.querySelectorAll('.assignment-summary-delete')[0] as HTMLElement,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));

    await waitFor(() =>
      expect(
        within(getChapterRow('Plants Around Us')).getByRole('button', {
          name: 'Assign',
        }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Assignment Summary (2 assignments)'),
    ).toBeInTheDocument();

    fireEvent.click(
      within(getChapterRow('Our Body')).getByRole('button', { name: 'Assign' }),
    );

    expect(
      await screen.findByText('Assignment Summary (4 assignments)'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Parts of plant')).not.toBeInTheDocument();
    expect(
      within(getChapterRow('Plants Around Us')).getByRole('button', {
        name: 'Assign',
      }),
    ).toBeInTheDocument();
    expect(
      within(getChapterRow('Our Body')).getByRole('button', {
        name: 'Remove',
      }),
    ).toBeInTheDocument();
  });
});
