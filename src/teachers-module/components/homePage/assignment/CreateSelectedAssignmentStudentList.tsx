import { t } from 'i18next';
import {
  getTrackableIdForItem,
  getTrackableProps,
  TRACKABLE_IDS,
} from '../../../../analytics/trackable';
import type { GroupWiseStudents } from '../../../hooks/useCreateSelectedAssignment';

interface CreateSelectedAssignmentStudentListProps {
  allSelected: boolean;
  groupWiseStudents: GroupWiseStudents;
  toggleCollapse: (category: string) => void;
  toggleSelectAll: () => void;
  toggleStudentGroupSelection: (category: string) => void;
  toggleStudentSelection: (category: string, index: number) => void;
}

const CreateSelectedAssignmentStudentList = ({
  allSelected,
  groupWiseStudents,
  toggleCollapse,
  toggleSelectAll,
  toggleStudentGroupSelection,
  toggleStudentSelection,
}: CreateSelectedAssignmentStudentListProps) => (
  <section className="assignments-list">
    <div className="select-all">
      <label htmlFor={TRACKABLE_IDS.TEACHER_STUDENTS_SELECT_ALL}>
        {t('Select All')}
      </label>
      <input
        id={TRACKABLE_IDS.TEACHER_STUDENTS_SELECT_ALL}
        {...getTrackableProps(TRACKABLE_IDS.TEACHER_STUDENTS_SELECT_ALL)}
        className={`select-all-checkbox ${TRACKABLE_IDS.TEACHER_STUDENTS_SELECT_ALL}`}
        type="checkbox"
        checked={allSelected}
        onChange={toggleSelectAll}
      />
    </div>
    {Object.keys(groupWiseStudents).map((category) => {
      const group = groupWiseStudents[category];
      if (!group) return null;

      const groupSelectAllId = getTrackableIdForItem(
        TRACKABLE_IDS.TEACHER_STUDENT_GROUP_SELECT_ALL,
        category,
      );

      return (
        <div
          key={category}
          className={`assignment-category ${category
            .replace(' ', '-')
            .toLowerCase()}`}
        >
          <div
            className="category-header"
            style={{ backgroundColor: group.color }}
            onClick={() => toggleCollapse(category)}
          >
            <h4>{group.title}</h4>
            <div className="select-all">
              <div className="select-all-student-count">
                {group.students.filter((student) => student.selected).length}/
                {group.students.length}
              </div>
              <img
                src={
                  group.isCollapsed
                    ? 'assets/icons/iconDown.png'
                    : 'assets/icons/iconUp.png'
                }
                alt="toggle-icon"
                style={{ width: '15px', height: '15px' }}
              />
              <input
                id={groupSelectAllId}
                {...getTrackableProps(groupSelectAllId)}
                className={`select-all-checkbox ${groupSelectAllId}`}
                type="checkbox"
                aria-label={`${t('Select All')} ${group.title}`}
                checked={
                  group.students.length > 0
                    ? group.students.every((student) => student.selected)
                    : true
                }
                onClick={(event) => event.stopPropagation()}
                onChange={() => toggleStudentGroupSelection(category)}
              />
            </div>
          </div>
          {!group.isCollapsed && (
            <ul className="students-list">
              {group.students.map((student, index) => {
                const studentTrackableId = getTrackableIdForItem(
                  TRACKABLE_IDS.TEACHER_STUDENT_SELECT,
                  student.id,
                );

                return (
                  <div key={student.id}>
                    <li className="student-item">
                      <span>{student.name}</span>
                      <input
                        id={studentTrackableId}
                        {...getTrackableProps(studentTrackableId)}
                        className={`student-item-checkbox ${studentTrackableId}`}
                        type="checkbox"
                        aria-label={student.name ?? ''}
                        checked={student.selected}
                        onChange={() => toggleStudentSelection(category, index)}
                      />
                    </li>
                    <hr className="students-list-styled-line" />
                  </div>
                );
              })}
            </ul>
          )}
        </div>
      );
    })}
  </section>
);

export default CreateSelectedAssignmentStudentList;
