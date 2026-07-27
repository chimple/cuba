import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { type SelectChangeEvent } from '@mui/material';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import type {
  CampaignAssignmentSummaryRow,
  CampaignAssignmentUniqueSubject,
  CampaignOption,
} from '../../services/api/ServiceApi';

export const CAMPAIGN_ASSIGNMENT_ROWS_PER_PAGE = 20;

const getViewportWidth = () =>
  typeof window === 'undefined' ? 1024 : window.innerWidth;

export const useCampaignAssignmentTab = (campaignId?: string) => {
  const api = ServiceConfig.getI().apiHandler;
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth);
  const [grades, setGrades] = useState<CampaignOption[]>([]);
  const [subjects, setSubjects] = useState<CampaignAssignmentUniqueSubject[]>(
    [],
  );
  const [assignments, setAssignments] = useState<
    CampaignAssignmentSummaryRow[]
  >([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  useEffect(() => {
    const handleResize = () => setViewportWidth(getViewportWidth());

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFilters() {
      if (!campaignId) {
        setGrades([]);
        setSubjects([]);
        setIsLoadingFilters(false);
        return;
      }

      setIsLoadingFilters(true);
      try {
        const nextGrades = await api.getAllGrades();

        if (cancelled) return;

        setGrades(
          nextGrades.map((grade) => ({
            id: String(grade.id),
            name: String(grade.name),
          })),
        );
      } catch (err) {
        logger.error('Failed to load campaign assignment filters:', err);
      } finally {
        if (!cancelled) setIsLoadingFilters(false);
      }
    }

    loadFilters();

    return () => {
      cancelled = true;
    };
  }, [api, campaignId]);

  useEffect(() => {
    setSelectedGrades([]);
    setSelectedSubjects([]);
    setSubjects([]);
    setPage(1);
  }, [campaignId]);

  useEffect(() => {
    let cancelled = false;

    async function loadAssignments() {
      if (!campaignId) {
        setAssignments([]);
        setTotal(0);
        setIsLoadingAssignments(false);
        return;
      }

      setIsLoadingAssignments(true);
      try {
        const response = await api.getCampaignAssignments(campaignId, {
          page,
          pageSize: CAMPAIGN_ASSIGNMENT_ROWS_PER_PAGE,
          ...(selectedGrades.length ? { gradeIds: selectedGrades } : {}),
          ...(selectedSubjects.length ? { subjectIds: selectedSubjects } : {}),
        });

        if (cancelled) return;

        setAssignments(response.assignments ?? []);
        if (selectedGrades.length === 0 && selectedSubjects.length === 0) {
          setSubjects(response.uniqueSubjects ?? []);
        }
        setTotal(response.total ?? 0);
      } catch (err) {
        logger.error('Failed to load campaign assignments:', err);
        if (!cancelled) {
          setAssignments([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoadingAssignments(false);
      }
    }

    loadAssignments();

    return () => {
      cancelled = true;
    };
  }, [api, campaignId, page, selectedGrades, selectedSubjects]);

  const isSmallScreen = viewportWidth <= 600;
  const isMediumScreen = viewportWidth > 600 && viewportWidth <= 900;
  const pageCount = Math.max(
    1,
    Math.ceil(total / CAMPAIGN_ASSIGNMENT_ROWS_PER_PAGE),
  );
  const isLoading = isLoadingFilters || isLoadingAssignments;

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const gradeNameById = useMemo(
    () => new Map(grades.map((grade) => [grade.id, grade.name])),
    [grades],
  );

  const subjectNameById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.name])),
    [subjects],
  );

  const availableSubjects = subjects;
  const availableGrades = useMemo(() => {
    const relevantGradeIds = new Set(
      subjects.flatMap((subject) => subject.gradeIds),
    );

    return grades.filter((grade) => relevantGradeIds.has(grade.id));
  }, [grades, subjects]);

  useEffect(() => {
    const availableGradeIds = new Set(availableGrades.map((grade) => grade.id));
    setSelectedGrades((current) => {
      if (current.length === 0) return current;
      const next = current.filter((id) => availableGradeIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [availableGrades]);

  useEffect(() => {
    const availableSubjectIds = new Set(
      availableSubjects.map((subject) => subject.id),
    );
    setSelectedSubjects((current) => {
      if (current.length === 0) return current;
      const next = current.filter((id) => availableSubjectIds.has(id));
      return next.length === current.length ? current : next;
    });
  }, [availableSubjects]);

  const gradeOptionIds = useMemo(
    () => availableGrades.map((grade) => grade.id),
    [availableGrades],
  );
  const subjectOptionIds = useMemo(
    () => availableSubjects.map((subject) => subject.id),
    [availableSubjects],
  );
  const gradeSelectValues =
    selectedGrades.length === 0 ? gradeOptionIds : selectedGrades;
  const subjectSelectValues =
    selectedSubjects.length === 0 ? subjectOptionIds : selectedSubjects;
  const selectedGradeLabel = (id: string) => gradeNameById.get(id) ?? id;
  const selectedSubjectLabel = (id: string) => subjectNameById.get(id) ?? id;

  const handleMultiSelectChange =
    (
      options: CampaignOption[],
      setter: React.Dispatch<React.SetStateAction<string[]>>,
    ) =>
    (event: SelectChangeEvent<string[]>) => {
      const value = event.target.value;
      const nextValues = typeof value === 'string' ? value.split(',') : value;
      const optionIds = options.map((option) => option.id);

      setter(nextValues.length === optionIds.length ? [] : nextValues);
      setPage(1);
    };

  return {
    assignments,
    availableGrades,
    availableSubjects,
    gradeOptionIds,
    gradeSelectValues,
    handleMultiSelectChange,
    isLoading,
    isLoadingAssignments,
    isLoadingFilters,
    isMediumScreen,
    isSmallScreen,
    page,
    pageCount,
    selectedGradeLabel,
    selectedGrades,
    selectedSubjectLabel,
    selectedSubjects,
    setPage,
    setSelectedGrades,
    setSelectedSubjects,
    subjectOptionIds,
    subjectSelectValues,
    subjects,
  };
};
