import React from 'react';
import './ReportTable.css';
import ExpandedUser from './ExpandedUser';
import TableChoiceHeader from './TableChoiceHeader';
import TableRightHeader from './TableRightHeader';
import TableStudentData from './TableStudentData';
import ExpandedTable from './ExpandedTable';
import CustomDropdown from '../CustomDropdown';
import ImageDropdown from '../imageDropdown';
import type { ReportTableProps } from './ReportsTableTypes';
import { ReportsNoReportFound } from './ReportsNoReportFound';
import { useReportsTable } from '../../hooks/useReportsTable';

const ReportTable = (props: ReportTableProps) => {
  const {
    ALL_SUBJECT,
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
    handleSelectChapter,
    handleSelectSubject,
    handleTypeSelect,
    handleViewClickDetails,
    headerData,
    isAssignments,
    isExternalUser,
    isLoading,
    mappedChaptersOptions,
    reportData,
    selectedChapter,
    selectedSubject,
    selectedType,
    selectedTypeOption,
    sortType,
    subjectOptionsWithAll,
    t,
  } = useReportsTable(props);

  return !isLoading ? (
    reportData.size == 0 ? (
      <div className="no-students-container ">
        <div>{t('No students in class')}</div>
      </div>
    ) : (
      <div className="table-container ">
        <div className="reports-dropdown">
          <div className="type-dropdown">
            <CustomDropdown
              options={Object.entries(TABLEDROPDOWN).map(([key, value]) => ({
                id: key,
                name: value,
                disabled:
                  selectedSubject?.id === ALL_SUBJECT.id &&
                  value === TABLEDROPDOWN.CHAPTER,
              }))}
              onOptionSelect={handleTypeSelect}
              placeholder={t(selectedType) ?? ''}
              selectedValue={{
                id: selectedTypeOption?.[0] ?? '',
                name: selectedType,
              }}
            />
          </div>

          {selectedType === TABLEDROPDOWN.CHAPTER ? (
            <div className="reports-chapter-dropdowns">
              <ImageDropdown
                options={subjectOptionsWithAll}
                selectedValue={{
                  id: selectedSubject?.id ?? '',
                  name: selectedSubject?.name ?? '',
                  icon:
                    (selectedSubject as any)?.icon ??
                    subjectOptionsWithAll.find(
                      (option) => option.id === selectedSubject?.id,
                    )?.icon ??
                    '',
                  subjectDetail:
                    (selectedSubject as any)?.subject ??
                    subjectOptionsWithAll.find(
                      (option) => option.id === selectedSubject?.id,
                    )?.subjectDetail ??
                    '',
                }}
                onOptionSelect={handleSelectSubject}
                placeholder={t('Select Language') as string}
              />
              <div className="custom-chapter-dropdown">
                <CustomDropdown
                  options={mappedChaptersOptions ?? []}
                  onOptionSelect={handleSelectChapter}
                  selectedValue={{
                    id:
                      selectedChapter?.id ??
                      mappedChaptersOptions?.[0]?.id ??
                      '',
                    name:
                      selectedChapter?.name ??
                      mappedChaptersOptions?.[0]?.name ??
                      '',
                  }}
                />
              </div>
            </div>
          ) : (
            <ImageDropdown
              options={subjectOptionsWithAll}
              selectedValue={{
                id: selectedSubject?.id ?? '',
                name: selectedSubject?.name ?? '',
                icon:
                  (selectedSubject as any)?.icon ??
                  subjectOptionsWithAll.find(
                    (option) => option.id === selectedSubject?.id,
                  )?.icon ??
                  '',
                subjectDetail:
                  (selectedSubject as any)?.subject ??
                  subjectOptionsWithAll.find(
                    (option) => option.id === selectedSubject?.id,
                  )?.subjectDetail ??
                  '',
              }}
              onOptionSelect={handleSelectSubject}
              placeholder={t('Select Language') as string}
            />
          )}
        </div>
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
                      isMonthly={selectedType == TABLEDROPDOWN.MONTHLY}
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
                            selectedType != TABLEDROPDOWN.ASSIGNMENTS &&
                            selectedType != TABLEDROPDOWN.CHAPTER
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