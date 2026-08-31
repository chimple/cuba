import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { IonCheckbox } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import SearchAndFilter from './SearchAndFilter';

interface StudentPendingStudentsTableProps {
  currentPage: number;
  displayedStudents: any[];
  filteredTotalStudents: number;
  handlePageChange: (event: unknown, newPage: number) => void;
  handleRadioChange: (studentId: string, checked: boolean) => void;
  pageSize: number;
  parsedGrade: number;
  parsedSection: string;
  searchTerm: string;
  selectedStudent: string | null;
  setSearchTerm: (value: string) => void;
  formatFirstLetterUpper: (value?: string) => string;
}

const StudentPendingStudentsTable: React.FC<
  StudentPendingStudentsTableProps
> = ({
  currentPage,
  displayedStudents,
  filteredTotalStudents,
  handlePageChange,
  handleRadioChange,
  pageSize,
  parsedGrade,
  parsedSection,
  searchTerm,
  selectedStudent,
  setSearchTerm,
  formatFirstLetterUpper,
}) => {
  const { t } = useTranslation();

  return (
    <Paper className="student-pending-request-details-table-card" elevation={0}>
      <div className="student-pending-request-details-table-header-row">
        <Typography
          variant="subtitle1"
          className="student-pending-request-details-section-title"
        >
          {t(
            `Students in Grade ${parsedGrade > 0 ? parsedGrade : 'N/A'} - ${
              parsedSection || 'N/A'
            }`,
          )}
        </Typography>
        <div className="student-pending-request-details-table-search">
          <SearchAndFilter
            searchTerm={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            filters={{}}
            onFilterClick={() => undefined}
            isFilter={false}
          />
        </div>
      </div>
      <Typography className="student-pending-request-details-total-students-count">
        {t(`Total: ${filteredTotalStudents} students`)}
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell className="student-pending-request-details-table-header-cell">
                {t('Student ID')}
              </TableCell>
              <TableCell className="student-pending-request-details-table-header-cell">
                {t('Student Name')}
              </TableCell>
              <TableCell className="student-pending-request-details-table-header-cell">
                {t('Gender')}
              </TableCell>
              <TableCell className="student-pending-request-details-table-header-cell">
                {t('Phone Number')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedStudents.map((stu) => (
              <TableRow key={stu.user.id}>
                <TableCell>
                  <IonCheckbox
                    className="radio-like-checkbox"
                    checked={selectedStudent === stu.user.id}
                    onIonChange={(e) =>
                      handleRadioChange(stu.user.id, e.detail.checked)
                    }
                    value={stu.user.id}
                    color="primary"
                  />
                  {stu.user.student_id || t('N/A')}
                </TableCell>
                <TableCell>{stu.user.name || t('N/A')}</TableCell>
                <TableCell>
                  {formatFirstLetterUpper(stu.user.gender) || t('N/A')}
                </TableCell>
                <TableCell>{stu.parent?.phone || t('N/A')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filteredTotalStudents}
        page={currentPage - 1}
        onPageChange={handlePageChange}
        rowsPerPage={pageSize}
        className="student-pending-request-details-table-pagination"
      />
    </Paper>
  );
};

export default StudentPendingStudentsTable;
