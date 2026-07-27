import React, { useMemo } from 'react';
import {
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import './CampaignAssignmentTab.css';
import DataTableBody, { type Column } from '../components/DataTableBody';
import DataTablePagination from '../components/DataTablePagination';
import type { CampaignAssignmentSummaryRow } from '../../services/api/ServiceApi';
import { useCampaignAssignmentTab } from '../hooks/useCampaignAssignmentTab';

interface CampaignAssignmentTabProps {
  campaignId?: string;
}

const CampaignAssignmentTab: React.FC<CampaignAssignmentTabProps> = ({
  campaignId,
}) => {
  const {
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
  } = useCampaignAssignmentTab(campaignId);

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
              disabled={
                isLoadingFilters ||
                (isLoadingAssignments && subjects.length === 0)
              }
            >
              <Select
                multiple
                displayEmpty
                value={gradeSelectValues}
                onChange={handleMultiSelectChange(
                  availableGrades,
                  setSelectedGrades,
                )}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  const values = selected as string[];
                  if (
                    values.length === 0 ||
                    values.length === gradeOptionIds.length
                  ) {
                    return t('All grades');
                  }
                  return values.map(selectedGradeLabel).join(', ');
                }}
                className="campaign-assignment-select"
                MenuProps={{
                  PaperProps: { className: 'campaign-assignment-menu' },
                }}
              >
                {availableGrades.map((grade) => (
                  <MenuItem
                    key={grade.id}
                    value={grade.id}
                    className={
                      selectedGrades.length === 0 ||
                      selectedGrades.includes(grade.id)
                        ? 'campaign-assignment-menu-item-selected'
                        : undefined
                    }
                  >
                    <Checkbox
                      checked={
                        selectedGrades.length === 0 ||
                        selectedGrades.includes(grade.id)
                      }
                    />
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
              disabled={
                isLoadingFilters ||
                (isLoadingAssignments && subjects.length === 0)
              }
            >
              <Select
                multiple
                displayEmpty
                value={subjectSelectValues}
                onChange={handleMultiSelectChange(
                  availableSubjects,
                  setSelectedSubjects,
                )}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  const values = selected as string[];
                  if (
                    values.length === 0 ||
                    values.length === subjectOptionIds.length
                  ) {
                    return t('All subjects');
                  }
                  return values.map(selectedSubjectLabel).join(', ');
                }}
                className="campaign-assignment-select"
                MenuProps={{
                  PaperProps: { className: 'campaign-assignment-menu' },
                }}
              >
                {availableSubjects.map((subject) => (
                  <MenuItem
                    key={subject.id}
                    value={subject.id}
                    className={
                      selectedSubjects.length === 0 ||
                      selectedSubjects.includes(subject.id)
                        ? 'campaign-assignment-menu-item-selected'
                        : undefined
                    }
                  >
                    <Checkbox
                      checked={
                        selectedSubjects.length === 0 ||
                        selectedSubjects.includes(subject.id)
                      }
                    />
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
