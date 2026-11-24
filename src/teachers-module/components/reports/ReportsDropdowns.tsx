import React from 'react';
import { ALL_SUBJECT, TABLEDROPDOWN } from '../../../common/constants';
import { getTrackableProps, TRACKABLE_IDS } from '../../../analytics/trackable';
import CustomDropdown from '../CustomDropdown';
import ImageDropdown from '../imageDropdown';
import type { useReportsTable } from '../../hooks/useReportsTable';

type ReportsDropdownsProps = Pick<
  ReturnType<typeof useReportsTable>,
  | 'handleSelectChapter'
  | 'handleSelectSubject'
  | 'handleTypeSelect'
  | 'mappedChaptersOptions'
  | 'selectedChapter'
  | 'selectedSubject'
  | 'selectedType'
  | 'selectedTypeOption'
  | 'subjectOptionsWithAll'
  | 't'
>;

const ReportsDropdowns: React.FC<ReportsDropdownsProps> = ({
  handleSelectChapter,
  handleSelectSubject,
  handleTypeSelect,
  mappedChaptersOptions,
  selectedChapter,
  selectedSubject,
  selectedType,
  selectedTypeOption,
  subjectOptionsWithAll,
  t,
}) => {
  const selectedSubjectOption = subjectOptionsWithAll.find(
    (option) => option.id === selectedSubject?.id,
  );
  const selectedSubjectValue = {
    id: selectedSubject?.id ?? '',
    name: selectedSubject?.name ?? '',
    icon: selectedSubjectOption?.icon ?? '',
    subjectDetail: selectedSubjectOption?.subjectDetail ?? '',
  };

  return (
    <div className="reports-dropdown">
      <div
        id={TRACKABLE_IDS.TEACHER_REPORT_TYPE_DROPDOWN}
        {...getTrackableProps(TRACKABLE_IDS.TEACHER_REPORT_TYPE_DROPDOWN)}
        className="type-dropdown teacher_report_type_dropdown"
      >
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
            trackableId={TRACKABLE_IDS.TEACHER_REPORT_SUBJECT_DROPDOWN}
            options={subjectOptionsWithAll}
            selectedValue={selectedSubjectValue}
            onOptionSelect={handleSelectSubject}
            placeholder={t('Select Language') as string}
          />
          <div className="custom-chapter-dropdown">
            <CustomDropdown
              options={mappedChaptersOptions ?? []}
              onOptionSelect={handleSelectChapter}
              selectedValue={{
                id: selectedChapter?.id ?? mappedChaptersOptions?.[0]?.id ?? '',
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
          trackableId={TRACKABLE_IDS.TEACHER_REPORT_SUBJECT_DROPDOWN}
          options={subjectOptionsWithAll}
          selectedValue={selectedSubjectValue}
          onOptionSelect={handleSelectSubject}
          placeholder={t('Select Language') as string}
        />
      )}
    </div>
  );
};

export default ReportsDropdowns;
