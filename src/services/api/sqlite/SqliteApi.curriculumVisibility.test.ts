import { SqliteApiAssignmentCourseLookups } from './SqliteApi.assignment.courseLookups';
import { SqliteApiCourseCatalog } from './SqliteApi.course.catalog';

type QueryDb = {
  query: jest.Mock;
};

type AssignmentLookupTestApi = {
  getAllCourses: () => Promise<unknown>;
  getAllLessonsForCourse: (courseId: string) => Promise<unknown>;
};

type CourseCatalogTestApi = {
  currentStudent: undefined;
  resolveCourseLanguageIdForChapter: jest.Mock;
  getLessonsForChapter: (chapterId: string) => Promise<unknown>;
};

const sqliteApiWithDb = <T extends object>(
  prototype: T,
  db: QueryDb,
): T & { _db: QueryDb; ensureInitialized: jest.Mock } => {
  const api = Object.create(prototype) as T & {
    _db: QueryDb;
    ensureInitialized: jest.Mock;
  };
  api._db = db;
  api.ensureInitialized = jest.fn().mockResolvedValue(undefined);
  return api;
};

describe('SQLite curriculum visibility filters', () => {
  it('returns only active courses from the local catalog query', async () => {
    const db = {
      query: jest.fn().mockResolvedValue({ values: [{ id: 'active' }] }),
    };
    const api = sqliteApiWithDb(SqliteApiAssignmentCourseLookups.prototype, db);

    await (api as unknown as AssignmentLookupTestApi).getAllCourses();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE is_deleted = 0'),
    );
  });

  it('requires active course, chapter, link, and lesson rows for course lessons', async () => {
    const db = { query: jest.fn().mockResolvedValue({ values: [] }) };
    const api = sqliteApiWithDb(SqliteApiAssignmentCourseLookups.prototype, db);

    await (api as unknown as AssignmentLookupTestApi).getAllLessonsForCourse(
      'course-1',
    );

    const query = db.query.mock.calls[0][0] as string;
    expect(query).toContain('c.is_deleted = 0');
    expect(query).toContain('cl.is_deleted = 0');
    expect(query).toContain('l.is_deleted = 0');
  });

  it('requires an active chapter link and lesson for chapter lessons', async () => {
    const db = { query: jest.fn().mockResolvedValue({ values: [] }) };
    const api = sqliteApiWithDb(SqliteApiCourseCatalog.prototype, db);
    const testApi = api as unknown as CourseCatalogTestApi;
    testApi.currentStudent = undefined;
    testApi.resolveCourseLanguageIdForChapter = jest
      .fn()
      .mockResolvedValue(null);

    await testApi.getLessonsForChapter('chapter-1');

    const query = db.query.mock.calls[0][0] as string;
    expect(query).toContain('cl.is_deleted = 0');
    expect(query).toContain('lesson.is_deleted = 0');
  });
});
