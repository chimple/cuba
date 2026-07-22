import {
  TABLEDROPDOWN,
  TABLESORTBY,
  TableTypes,
} from '../../../common/constants';

export interface ReportTableProps {
  handleButtonClick?: (isOpen: boolean) => void;
  startDateProp?: Date;
  endDateProp?: Date;
  selectedTypeProp?: TABLEDROPDOWN;
  isAssignmentsProp?: boolean;
  sortTypeProp?: TABLESORTBY;
}

export type SubjectSelection =
  | TableTypes<'course'>
  | {
      id: string;
      name: string;
      icon?: string;
      subjectDetail?: string;
      code?: string;
      disabled?: boolean;
    };

export type DropdownOption = {
  id: string | number;
  name: string;
  icon?: string;
  subjectDetail?: string;
};

export type DateRangeValue = {
  startDate: Date;
  endDate: Date;
  isStudentProfilePage?: boolean;
};

export type AssignmentHeader = {
  headerName: string;
  startAt: string;
  endAt: string;
  belongsToClass?: boolean;
  subjectName?: string;
  courseId?: string;
};
