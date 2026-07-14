import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  type SelectChangeEvent,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import './CampaignAssignmentTab.css';
import DataTableBody, { type Column } from '../components/DataTableBody';
import DataTablePagination from '../components/DataTablePagination';
import type {
  CampaignAssignmentSummaryRow,
  CampaignOption,
} from '../../services/api/ServiceApi';

const ROWS_PER_PAGE = 20;

interface CampaignAssignmentTabProps {
  campaignId?: string;
}

const CampaignAssignmentTab: React.FC<CampaignAssignmentTabProps> = ({
  campaignId,
}) => {
  const api = ServiceConfig.getI().apiHandler;
  const getViewportWidth = () =>
    typeof window === 'undefined' ? 1024 : window.innerWidth;
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth);

  useEffect(() => {
    const handleResize = () => setViewportWidth(getViewportWidth());

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isSmallScreen = viewportWidth <= 600;
  const isMediumScreen = viewportWidth > 600 && viewportWidth <= 900;

  const [grades, setGrades] = useState<CampaignOption[]>([]);
  const [subjects, setSubjects] = useState<CampaignOption[]>([]);
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
        const [nextGrades, nextSubjects] = await Promise.all([
          api.getAllGrades(),
          api.getCampaignSubjectsByCampaignId(campaignId),
        ]);

        if (cancelled) return;

        setGrades(
          nextGrades.map((grade) => ({
            id: String(grade.id),
            name: String(grade.name),
          })),
        );
        setSubjects(
          nextSubjects.map((subject) => ({
            id: String(subject.id),
            name: String(subject.name),
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
          pageSize: ROWS_PER_PAGE,
          ...(selectedGrades.length ? { gradeIds: selectedGrades } : {}),
          ...(selectedSubjects.length ? { subjectIds: selectedSubjects } : {}),
        });

        if (cancelled) return;

        setAssignments(response.assignments ?? []);
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

  const pageCount = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));
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

  const dateColumnWidth = isSmallScreen ? 180 : isMediumScreen ? 240 : 280;
  const gradeColumnWidth = isSmallScreen ? 100 : 140;
  const subjectColumnWidth = isSmallScreen ? 120 : 180;
  const tableMinWidth = isSmallScreen ? 760 : isMediumScreen ? 960 : 1260;

  const assignmentDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: isSmallScreen ? 'short' : 'long',
        year: 'numeric',
        month: isSmallScreen ? 'short' : 'long',
        day: 'numeric',
      }),
    [isSmallScreen],
  );

  const columns = useMemo<Column<CampaignAssignmentSummaryRow>[]>(
    () => [
      {
        key: 'assignmentDate',
        label: t('Date'),
        sortable: false,
        width: dateColumnWidth,
        render: (row) =>
          assignmentDateFormatter.format(new Date(row.assignmentDate)),
      },
      {
        key: 'gradeName',
        label: t('Grade'),
        sortable: false,
        width: gradeColumnWidth,
      },
      {
        key: 'subjectName',
        label: t('Subject'),
        sortable: false,
        width: subjectColumnWidth,
      },
      {
        key: 'lessonName',
        label: t('Lesson Name'),
        sortable: false,
      },
    ],
    [
      assignmentDateFormatter,
      dateColumnWidth,
      gradeColumnWidth,
      subjectColumnWidth,
    ],
  );

  const selectedGradeLabel = (id: string) => gradeNameById.get(id) ?? id;
  const selectedSubjectLabel = (id: string) => subjectNameById.get(id) ?? id;

  const handleMultiSelectChange =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (event: SelectChangeEvent<string[]>) => {
      const value = event.target.value;
      setter(typeof value === 'string' ? value.split(',') : value);
      setPage(1);
    };

  return (
    <div className="campaign-assignment-tab">
      <Box className="campaign-assignment-filterBar">
        <Box className="campaign-assignment-filterRow">
          <Box className="campaign-assignment-filterField">
            <Typography
              variant="caption"
              className="campaign-assignment-filterLabel"
            >
              {t('Grade')}
            </Typography>

            <FormControl
              size="small"
              className="campaign-assignment-filter"
              disabled={isLoadingFilters}
            >
              <Select
                multiple
                displayEmpty
                value={selectedGrades}
                onChange={handleMultiSelectChange(setSelectedGrades)}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  const values = selected as string[];
                  if (values.length === 0) return t('All grades');
                  return values.map(selectedGradeLabel).join(', ');
                }}
                className="campaign-assignment-select"
                MenuProps={{
                  PaperProps: { className: 'campaign-assignment-menu' },
                }}
              >
                {grades.map((grade) => (
                  <MenuItem key={grade.id} value={grade.id}>
                    <Checkbox checked={selectedGrades.includes(grade.id)} />
                    <ListItemText primary={grade.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box className="campaign-assignment-filterField">
            <Typography
              variant="caption"
              className="campaign-assignment-filterLabel"
            >
              {t('Subject')}
            </Typography>
            <FormControl
              size="small"
              className="campaign-assignment-filter campaign-assignment-filterField"
              disabled={isLoadingFilters}
            >
              <Select
                multiple
                displayEmpty
                value={selectedSubjects}
                onChange={handleMultiSelectChange(setSelectedSubjects)}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  const values = selected as string[];
                  if (values.length === 0) return t('All subjects');
                  return values.map(selectedSubjectLabel).join(', ');
                }}
                className="campaign-assignment-select"
                MenuProps={{
                  PaperProps: { className: 'campaign-assignment-menu' },
                }}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    <Checkbox checked={selectedSubjects.includes(subject.id)} />
                    <ListItemText primary={subject.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      <div className="campaign-assignment-content">
        <div className="campaign-assignment-table-container">
          {isLoading && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              minHeight={240}
              width="100%"
              flex="1 1 auto"
            >
              <CircularProgress size={28} />
            </Box>
          )}

          {!isLoading && assignments.length > 0 && (
            <DataTableBody
              columns={columns}
              rows={assignments}
              orderBy="assignmentDate"
              order="asc"
              onSort={() => {}}
              loading={false}
              tableMinWidth={tableMinWidth}
              tableWidth="100%"
              headerNoEllipsis
            />
          )}

          {!isLoading && assignments.length === 0 && (
            <Box className="campaign-assignment-emptyState">
              <Typography
                variant="h6"
                className="campaign-assignment-emptyStateTitle"
              >
                {t('No Assignments Found')}
              </Typography>
            </Box>
          )}
        </div>

        {!isLoading && assignments.length > 0 && (
          <div className="campaign-assignment-footer">
            <DataTablePagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignAssignmentTab;
