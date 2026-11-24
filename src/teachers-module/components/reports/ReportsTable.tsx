import React from 'react';
import './ReportTable.css';
import ExpandedUser from './ExpandedUser';
import TableChoiceHeader from './TableChoiceHeader';
import TableRightHeader from './TableRightHeader';
import TableStudentData from './TableStudentData';
import ExpandedTable from './ExpandedTable';
import type { ReportTableProps } from './ReportsTableTypes';
import { ReportsNoReportFound } from './ReportsNoReportFound';
import { useReportsTable } from '../../hooks/useReportsTable';
import ReportsDropdowns from './ReportsDropdowns';

const ReportTable = (props: ReportTableProps) => {
  const viewProps = useReportsTable(props);
  const {
    Loading,
    TABLEDROPDOWN,
    assignmentMapObject,
    dateRange,
    expandedRow,
    handleButtonClick,
    handleDateSelect,
    handleIsAssignmets,
    handleNameSort,
    handleRowClick,
    handleViewClickDetails,
    headerData,
    isAssignments,
    isExternalUser,
    isLoading,
    reportData,
    selectedSubject,
    selectedType,
    sortType,
    t,
  } = viewProps;

  return !isLoading ? (
    reportData.size == 0 ? (
      <div className="no-students-container ">
        <div>{t('No students in class')}</div>
      </div>
    ) : (
      <div className="table-container ">
        <ReportsDropdowns
          handleSelectChapter={viewProps.handleSelectChapter}
          handleSelectSubject={viewProps.handleSelectSubject}
          handleTypeSelect={viewProps.handleTypeSelect}
          mappedChaptersOptions={viewProps.mappedChaptersOptions}
          selectedChapter={viewProps.selectedChapter}
          selectedSubject={selectedSubject}
          selectedType={selectedType}
          selectedTypeOption={viewProps.selectedTypeOption}
          subjectOptionsWithAll={viewProps.subjectOptionsWithAll}
          t={t}
        />
        <div className="table-container-body">
          <div
            className="table"
            style={{
              maxHeight:
                selectedType === TABLEDROPDOWN.CHAPTER ? '65vh' : '70vh',
            }}
          >
            <table className="Reports-Table-capture-report-table">
              <thead>
                <tr>
                  <th>
                    <TableChoiceHeader
                      onDateChange={handleDateSelect}
                      isAssignmentsOnlyProp={isAssignments}
                      onIsAssignments={handleIsAssignmets}
                      isMonthly={selectedType === TABLEDROPDOWN.MONTHLY}
                      handleNameSort={handleNameSort}
                      sortBy={sortType}
                      dateRangeValue={dateRange}
                      isAssignmentReport={
                        selectedType === TABLEDROPDOWN.ASSIGNMENTS ||
                        selectedType === TABLEDROPDOWN.LIVEQUIZ
                      }
                    />
                  </th>

                  <TableRightHeader
                    headerDetails={headerData}
                    courseCode={
                      selectedSubject?.code
                        ? selectedSubject.code
                        : selectedSubject?.id === 'all'
                          ? selectedSubject.id
                          : ''
                    }
                  />
                </tr>
              </thead>
              <tbody>
                {Array.from(reportData).map(([key, value], index) => (
                  <React.Fragment key={key}>
                    <tr>
                      <td
                        style={{
                          borderRight: expandedRow === key ? '0' : '',
                          borderBottom:
                            expandedRow === key
                              ? '0'
                              : '2px solid #rgb(255, 255, 255)',
                        }}
                        onClick={() => {
                          if (
                            selectedType !== TABLEDROPDOWN.ASSIGNMENTS &&
                            selectedType !== TABLEDROPDOWN.CHAPTER
                          ) {
                            handleRowClick(key);
                          }
                        }}
                      >
                        {expandedRow === key ? (
                          <ExpandedUser
                            name={value.student.name ?? ''}
                            onClickViewDetails={() => {
                              handleViewClickDetails(value.student);
                            }}
                          />
                        ) : (
                          <div>{value.student.name}</div>
                        )}
                      </td>
                      {expandedRow !== key && (
                        <TableStudentData
                          studentData={value.results}
                          isScore={
                            selectedType === TABLEDROPDOWN.CHAPTER ||
                            selectedType === TABLEDROPDOWN.ASSIGNMENTS ||
                            selectedType === TABLEDROPDOWN.LIVEQUIZ
                          }
                          assignmentMap={assignmentMapObject}
                          selectedType={selectedType}
                        />
                      )}
                    </tr>

                    {expandedRow === key && (
                      <ExpandedTable expandedData={value.results} />
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {headerData.length == 0 ? (
              <ReportsNoReportFound
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                isExternalUser={isExternalUser}
                onLibraryClick={() => handleButtonClick?.(true)}
              />
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    )
  ) : (
    <Loading isLoading={isLoading} />
  );
};

export default ReportTable;
