import { buildScoreCardProgressRows } from './scoreCardLogic';
import { Util } from '../../utility/util';
import type { TableTypes } from '../../common/constants';

jest.mock('../../utility/util', () => ({
  Util: {
    getLatestLearningPathByUpdatedAt: jest.fn(),
  },
}));

const mockGetLatestLearningPathByUpdatedAt =
  Util.getLatestLearningPathByUpdatedAt as jest.Mock;

type UserRow = TableTypes<'user'>;
type UserStickerBookRow = TableTypes<'user_sticker_book'>;

const makeStudent = (overrides: Partial<UserRow> = {}): UserRow =>
  ({
    id: 'student-1',
    reward: null,
    learning_path: null,
    ...overrides,
  }) as UserRow;

const stringifiedStickerIds = (
  ids: string[],
): UserStickerBookRow['stickers_collected'] =>
  JSON.stringify(ids) as unknown as UserStickerBookRow['stickers_collected'];

const mockApi = {
  getCurrentStickerBookWithProgress: jest.fn().mockResolvedValue({
    book: { id: 'book-1', svg_url: 'book.svg' },
  }),
  getNextWinnableSticker: jest.fn().mockResolvedValue('next-sticker'),
  getStickersByIds: jest.fn().mockResolvedValue([]),
  getUserStickerBook: jest.fn().mockResolvedValue([]),
};

describe('buildScoreCardProgressRows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValue({
      book: { id: 'book-1', svg_url: 'book.svg' },
    });
    mockApi.getNextWinnableSticker.mockResolvedValue('next-sticker');
    mockApi.getStickersByIds.mockResolvedValue([]);
    mockApi.getUserStickerBook.mockResolvedValue([]);
  });

  test('marks daily reward row animated only once for a collected reward', async () => {
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValue(null);
    const reward = JSON.stringify({
      reward_id: 'reward-today',
      timestamp: new Date().toISOString(),
    });

    const staticRows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
    });
    const animatedRows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent({ reward }),
      studentId: 'student-1',
    });
    const replayRows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent({ reward }),
      studentId: 'student-1',
    });

    expect(staticRows[0]).toMatchObject({
      id: 'dailyReward',
      completed: true,
      animateCompletion: false,
    });
    expect(animatedRows[0]).toMatchObject({
      id: 'dailyReward',
      completed: true,
      animateCompletion: true,
    });
    expect(replayRows[0]).toMatchObject({
      id: 'dailyReward',
      completed: true,
      animateCompletion: false,
    });
  });

  test('uses the completed lesson course when currentCourseIndex already advanced', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 1,
          courseList: [
            {
              course_id: 'course-1',
              path: [
                { lesson_id: 'lesson-1', isPlayed: true },
                { lesson_id: 'lesson-2', isPlayed: true },
                { lesson_id: 'lesson-3', isPlayed: false },
              ],
            },
            {
              course_id: 'course-2',
              path: [{ lesson_id: 'lesson-4', isPlayed: false }],
            },
          ],
        },
      }),
    );

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'course-1',
      completedLessonId: 'lesson-3',
    });

    expect(rows[1]).toMatchObject({
      id: 'sticker',
      current: 3,
      total: 5,
    });
  });

  test('ignores reward snapshot when completion context is missing', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'old-course',
              path: [
                { lesson_id: 'old-1', isPlayed: true },
                { lesson_id: 'old-2', isPlayed: true },
                { lesson_id: 'old-3', isPlayed: true },
                { lesson_id: 'old-4', isPlayed: true },
                { lesson_id: 'old-5', isPlayed: false },
              ],
            },
          ],
        },
      }),
    );
    sessionStorage.setItem(
      'RewardLearningPath',
      JSON.stringify({ courses: {} }),
    );

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent({
        learning_path: JSON.stringify({
          courses: {
            currentCourseIndex: 0,
            courseList: [
              {
                course_id: 'new-course',
                path: [
                  { lesson_id: 'new-1', isPlayed: true },
                  { lesson_id: 'new-2', isPlayed: false },
                ],
              },
            ],
          },
        }),
      }),
      studentId: 'student-1',
    });

    expect(rows[1]).toMatchObject({
      id: 'sticker',
      current: 1,
      total: 5,
    });
  });
  test('falls back to the real current course when reward snapshot is from an old completed course', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'old-course',
              path: [
                { lesson_id: 'old-1', isPlayed: true },
                { lesson_id: 'old-2', isPlayed: true },
                { lesson_id: 'old-3', isPlayed: true },
                { lesson_id: 'old-4', isPlayed: true },
                { lesson_id: 'old-5', isPlayed: false },
              ],
            },
          ],
        },
      }),
    );
    sessionStorage.setItem(
      'RewardLearningPath',
      JSON.stringify({ courses: {} }),
    );

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent({
        learning_path: JSON.stringify({
          courses: {
            currentCourseIndex: 0,
            courseList: [
              {
                course_id: 'new-course',
                path: [
                  { lesson_id: 'new-1', isPlayed: true },
                  { lesson_id: 'new-2', isPlayed: true },
                  { lesson_id: 'new-3', isPlayed: false },
                ],
              },
            ],
          },
        }),
      }),
      studentId: 'student-1',
      completedCourseId: 'new-course',
      completedLessonId: 'new-3',
    });

    expect(rows[1]).toMatchObject({
      id: 'sticker',
      current: 3,
      total: 5,
    });
  });

  test('shows the awarded sticker from the completed book even when current book already advanced', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'course-1',
              path: [
                { lesson_id: 'lesson-1', isPlayed: true },
                { lesson_id: 'lesson-2', isPlayed: true },
                { lesson_id: 'lesson-3', isPlayed: true },
                { lesson_id: 'lesson-4', isPlayed: true },
                { lesson_id: 'lesson-5', isPlayed: false },
              ],
            },
          ],
        },
      }),
    );
    const now = new Date().toISOString();
    sessionStorage.setItem(
      'pending_pathway_sticker_reward',
      JSON.stringify({
        studentId: 'student-1',
        stickerBookId: 'completed-book',
        awardedStickerId: 'sticker-earned',
        createdAt: now,
      }),
    );
    sessionStorage.setItem(
      'auto_open_sticker_preview',
      JSON.stringify({
        studentId: 'student-1',
        stickerBookId: 'completed-book',
        awardedStickerId: 'sticker-earned',
        stickerBookSvgUrl: 'completed-book.svg',
      }),
    );
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValueOnce({
      book: { id: 'next-book', svg_url: 'next-book.svg' },
    });
    mockApi.getStickersByIds.mockResolvedValueOnce([
      { id: 'sticker-earned', name: 'Earned Sticker', image: 'earned.png' },
    ]);

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'course-1',
      completedLessonId: 'lesson-5',
    });

    expect(mockApi.getNextWinnableSticker).not.toHaveBeenCalled();
    expect(rows[1]).toMatchObject({
      id: 'sticker',
      current: 5,
      iconSrc: 'earned.png',
      iconAlt: 'Earned Sticker',
    });
  });
  test('shows the final 5/5 row on the completion day even if pathway progress already moved on', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'next-course',
              path: [
                { lesson_id: 'next-1', isPlayed: true },
                { lesson_id: 'next-2', isPlayed: false },
              ],
            },
          ],
        },
      }),
    );
    const now = new Date().toISOString();
    sessionStorage.setItem(
      'pending_pathway_sticker_reward',
      JSON.stringify({
        studentId: 'student-1',
        stickerBookId: 'completed-book',
        awardedStickerId: 'sticker-earned',
        createdAt: now,
      }),
    );
    sessionStorage.setItem(
      'auto_open_sticker_preview',
      JSON.stringify({
        studentId: 'student-1',
        stickerBookId: 'completed-book',
        awardedStickerId: 'sticker-earned',
        stickerBookSvgUrl: 'completed-book.svg',
      }),
    );
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValueOnce(null);
    mockApi.getStickersByIds.mockResolvedValueOnce([
      { id: 'sticker-earned', name: 'Earned Sticker', image: 'earned.png' },
    ]);

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'old-course',
      completedLessonId: 'old-5',
    });

    expect(rows[1]).toMatchObject({
      id: 'sticker',
      current: 5,
      total: 5,
      iconSrc: 'earned.png',
      completed: true,
    });
  });
  test('shows the final 5/5 row from preview/completion session when pending reward key is gone', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'next-course',
              path: [
                { lesson_id: 'next-1', isPlayed: true },
                { lesson_id: 'next-2', isPlayed: false },
              ],
            },
          ],
        },
      }),
    );
    const now = new Date().toISOString();
    sessionStorage.setItem(
      'auto_open_sticker_preview',
      JSON.stringify({
        studentId: 'student-1',
        stickerBookId: 'completed-book',
        awardedStickerId: 'sticker-earned',
        createdAt: now,
        stickerBookSvgUrl: 'completed-book.svg',
      }),
    );
    sessionStorage.setItem(
      'auto_open_sticker_completion_popup',
      JSON.stringify({
        studentId: 'student-1',
        createdAt: now,
        payload: {
          stickerBookId: 'completed-book',
          stickerBookSvgUrl: 'completed-book.svg',
          collectedStickerIds: ['older', 'sticker-earned'],
        },
      }),
    );
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValueOnce(null);
    mockApi.getStickersByIds.mockResolvedValueOnce([
      { id: 'sticker-earned', name: 'Earned Sticker', image: 'earned.png' },
    ]);

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'old-course',
      completedLessonId: 'old-5',
    });

    expect(rows[1]).toMatchObject({
      id: 'sticker',
      current: 5,
      total: 5,
      iconSrc: 'earned.png',
      completed: true,
    });
  });
  test('shows the final 5/5 row from completed sticker-book updated today even without session keys', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'next-course',
              path: [
                { lesson_id: 'next-1', isPlayed: true },
                { lesson_id: 'next-2', isPlayed: false },
              ],
            },
          ],
        },
      }),
    );
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValueOnce(null);
    mockApi.getUserStickerBook.mockResolvedValueOnce([
      {
        id: 'usb-1',
        user_id: 'student-1',
        sticker_book_id: 'completed-book',
        stickers_collected: ['older', 'sticker-earned'],
        status: 'completed',
        updated_at: new Date().toISOString(),
      },
    ]);
    mockApi.getStickersByIds.mockResolvedValueOnce([
      { id: 'sticker-earned', name: 'Earned Sticker', image: 'earned.png' },
    ]);

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'old-course',
      completedLessonId: 'old-5',
    });

    expect(rows[1]).toMatchObject({
      id: 'sticker',
      current: 5,
      total: 5,
      iconSrc: 'earned.png',
      completed: true,
    });
  });

  test('animates completed sticker row only once for the same collected sticker today', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'next-course',
              path: [
                { lesson_id: 'next-1', isPlayed: true },
                { lesson_id: 'next-2', isPlayed: false },
              ],
            },
          ],
        },
      }),
    );
    const completedBook = {
      id: 'usb-1',
      user_id: 'student-1',
      sticker_book_id: 'completed-book',
      stickers_collected: ['older', 'sticker-earned'],
      status: 'completed',
      updated_at: new Date().toISOString(),
    };
    mockApi.getCurrentStickerBookWithProgress
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockApi.getUserStickerBook
      .mockResolvedValueOnce([completedBook])
      .mockResolvedValueOnce([completedBook]);
    mockApi.getStickersByIds
      .mockResolvedValueOnce([
        { id: 'sticker-earned', name: 'Earned Sticker', image: 'earned.png' },
      ])
      .mockResolvedValueOnce([
        { id: 'sticker-earned', name: 'Earned Sticker', image: 'earned.png' },
      ]);

    const animatedRows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'old-course',
      completedLessonId: 'old-5',
    });
    const replayRows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'old-course',
      completedLessonId: 'old-5',
    });

    expect(animatedRows[1]).toMatchObject({
      id: 'sticker',
      current: 5,
      total: 5,
      completed: true,
      animateCompletion: true,
    });
    expect(replayRows[1]).toMatchObject({
      id: 'sticker',
      current: 5,
      total: 5,
      completed: true,
      animateCompletion: false,
    });
  });

  test('hides the final sticker row when the latest completed sticker-book is not from today', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'next-course',
              path: [{ lesson_id: 'next-1', isPlayed: true }],
            },
          ],
        },
      }),
    );
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValueOnce(null);
    mockApi.getUserStickerBook.mockResolvedValueOnce([
      {
        id: 'usb-1',
        user_id: 'student-1',
        sticker_book_id: 'completed-book',
        stickers_collected: ['older', 'sticker-earned'],
        status: 'completed',
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'old-course',
      completedLessonId: 'old-5',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'dailyReward' });
  });

  test('uses last collected sticker from stringified completed sticker-book progress', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'next-course',
              path: [{ lesson_id: 'next-1', isPlayed: true }],
            },
          ],
        },
      }),
    );
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValueOnce(null);
    mockApi.getUserStickerBook.mockResolvedValueOnce([
      {
        id: 'usb-1',
        user_id: 'student-1',
        sticker_book_id: 'completed-book',
        stickers_collected: stringifiedStickerIds(['older', 'sticker-earned']),
        status: 'completed',
        updated_at: new Date().toISOString(),
      },
    ]);
    mockApi.getStickersByIds.mockResolvedValueOnce([
      { id: 'sticker-earned', name: 'Earned Sticker', image: 'earned.png' },
    ]);

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'old-course',
      completedLessonId: 'old-5',
    });

    expect(rows[1]).toMatchObject({
      id: 'sticker',
      current: 5,
      total: 5,
      iconSrc: 'earned.png',
      completed: true,
    });
  });
  test('shows the final 5/5 row on the completion day when no sticker book remains', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'course-1',
              path: [
                { lesson_id: 'lesson-1', isPlayed: true },
                { lesson_id: 'lesson-2', isPlayed: true },
                { lesson_id: 'lesson-3', isPlayed: true },
                { lesson_id: 'lesson-4', isPlayed: true },
                { lesson_id: 'lesson-5', isPlayed: false },
              ],
            },
          ],
        },
      }),
    );
    const now = new Date().toISOString();
    sessionStorage.setItem(
      'pending_pathway_sticker_reward',
      JSON.stringify({
        studentId: 'student-1',
        stickerBookId: 'completed-book',
        awardedStickerId: 'sticker-earned',
        createdAt: now,
      }),
    );
    sessionStorage.setItem(
      'auto_open_sticker_preview',
      JSON.stringify({
        studentId: 'student-1',
        stickerBookId: 'completed-book',
        awardedStickerId: 'sticker-earned',
        stickerBookSvgUrl: 'completed-book.svg',
      }),
    );
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValueOnce(null);
    mockApi.getStickersByIds.mockResolvedValueOnce([
      { id: 'sticker-earned', name: 'Earned Sticker', image: 'earned.png' },
    ]);

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'course-1',
      completedLessonId: 'lesson-5',
    });

    expect(rows[1]).toMatchObject({
      id: 'sticker',
      current: 5,
      total: 5,
      iconSrc: 'earned.png',
      completed: true,
    });
  });

  test('hides the sticker row on later days when all sticker books are complete', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'course-1',
              path: [
                { lesson_id: 'lesson-1', isPlayed: true },
                { lesson_id: 'lesson-2', isPlayed: true },
                { lesson_id: 'lesson-3', isPlayed: true },
                { lesson_id: 'lesson-4', isPlayed: true },
                { lesson_id: 'lesson-5', isPlayed: false },
              ],
            },
          ],
        },
      }),
    );
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    sessionStorage.setItem(
      'pending_pathway_sticker_reward',
      JSON.stringify({
        studentId: 'student-1',
        stickerBookId: 'completed-book',
        awardedStickerId: 'sticker-earned',
        createdAt: yesterday,
      }),
    );
    sessionStorage.setItem(
      'auto_open_sticker_preview',
      JSON.stringify({
        studentId: 'student-1',
        stickerBookId: 'completed-book',
        awardedStickerId: 'sticker-earned',
        stickerBookSvgUrl: 'completed-book.svg',
      }),
    );
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValueOnce(null);

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'course-1',
      completedLessonId: 'lesson-5',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'dailyReward' });
  });
  test('shows the awarded sticker image for a completed 5/5 pathway row', async () => {
    mockGetLatestLearningPathByUpdatedAt.mockReturnValue(
      JSON.stringify({
        courses: {
          currentCourseIndex: 0,
          courseList: [
            {
              course_id: 'course-1',
              path: [
                { lesson_id: 'lesson-1', isPlayed: true },
                { lesson_id: 'lesson-2', isPlayed: true },
                { lesson_id: 'lesson-3', isPlayed: true },
                { lesson_id: 'lesson-4', isPlayed: true },
                { lesson_id: 'lesson-5', isPlayed: false },
              ],
            },
          ],
        },
      }),
    );
    const now = new Date().toISOString();
    sessionStorage.setItem(
      'pending_pathway_sticker_reward',
      JSON.stringify({
        studentId: 'student-1',
        stickerBookId: 'book-1',
        awardedStickerId: 'sticker-earned',
        createdAt: now,
      }),
    );
    mockApi.getCurrentStickerBookWithProgress.mockResolvedValueOnce({
      book: { id: 'book-1', svg_url: 'book.svg' },
    });
    mockApi.getStickersByIds.mockResolvedValueOnce([
      { id: 'sticker-earned', name: 'Earned Sticker', image: 'earned.png' },
    ]);

    const rows = await buildScoreCardProgressRows({
      api: mockApi,
      student: makeStudent(),
      studentId: 'student-1',
      completedCourseId: 'course-1',
      completedLessonId: 'lesson-5',
    });

    expect(mockApi.getNextWinnableSticker).not.toHaveBeenCalled();
    expect(mockApi.getStickersByIds).toHaveBeenCalledWith(['sticker-earned']);
    expect(rows[1]).toMatchObject({
      id: 'sticker',
      current: 5,
      iconSrc: 'earned.png',
      iconAlt: 'Earned Sticker',
    });
  });
});
