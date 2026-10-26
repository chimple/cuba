import { useEffect, useState } from 'react';
import type { TableTypes } from '../../../common/constants';
import type { ServiceApi } from '../../../services/api/ServiceApi';
import type { ClassRow } from './SchoolClass.types';

export function useSelectedClassDetails(
  api: ServiceApi,
  selectedClassId: string | null,
  selectedRow: ClassRow | null,
) {
  const [classDetailsById, setClassDetailsById] = useState<
    Record<string, ClassRow>
  >({});

  useEffect(() => {
    if (!selectedClassId || !selectedRow || classDetailsById[selectedClassId]) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          setClassDetailsById((prev) => ({
            ...prev,
            [selectedClassId]: selectedRow,
          }));
          return;
        }
        const links = (await api.getCoursesByClassId(selectedClassId)) ?? [];
        const detailArrays = await Promise.all(
          links.map((link: { course_id: string }) =>
            api.getCourse(link.course_id),
          ),
        );
        const courses: TableTypes<'course'>[] = detailArrays
          .flatMap(
            (
              courseRows:
                | TableTypes<'course'>
                | TableTypes<'course'>[]
                | undefined,
            ) => (Array.isArray(courseRows) ? courseRows : [courseRows]),
          )
          .filter((course): course is TableTypes<'course'> =>
            Boolean(course?.id),
          );
        const curriculumIds = [
          ...new Set(
            courses
              .map((course) => course.curriculum_id)
              .filter(
                (courseId: unknown): courseId is string =>
                  typeof courseId === 'string' && courseId.length > 0,
              ),
          ),
        ];
        const curriculums: TableTypes<'curriculum'>[] = curriculumIds.length
          ? await api.getCurriculumsByIds(curriculumIds)
          : [];
        const subjectsNames = [
          ...new Set(
            courses
              .map((course) =>
                typeof course?.name === 'string' ? course.name.trim() : '',
              )
              .filter((subjectName: string) => subjectName.length > 0),
          ),
        ].join(', ');
        const curriculumNames = [
          ...new Set(
            curriculums
              .map((curriculum) => curriculum.name?.trim() ?? '')
              .filter((name: string) => name.length > 0),
          ),
        ].join(', ');

        if (!cancelled) {
          setClassDetailsById((prev) => ({
            ...prev,
            [selectedClassId]: {
              ...selectedRow,
              course_links: links,
              courses,
              curriculum: curriculums,
              subjects: courses,
              subjectsNames,
              curriculumNames,
            },
          }));
        }
      } catch {
        if (!cancelled) {
          setClassDetailsById((prev) => ({
            ...prev,
            [selectedClassId]: selectedRow,
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, classDetailsById, selectedClassId, selectedRow]);

  return classDetailsById;
}
