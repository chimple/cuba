import { Button as MuiButton } from '@mui/material';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PersonAddAlt1Outlined from '@mui/icons-material/PersonAddAlt1Outlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { t } from 'i18next';
import ActionMenu from './ActionMenu';
import type { ClassRow } from './SchoolClass.types';

type SchoolClassActionsProps = {
  classRow: ClassRow;
  isExternalUser: boolean;
  onAddStudent: (classRow: ClassRow) => void;
  onEditClass: (classRow: ClassRow) => void;
  onDeleteClass: (classRow: ClassRow) => void;
};

export default function SchoolClassActions({
  classRow,
  isExternalUser,
  onAddStudent,
  onEditClass,
  onDeleteClass,
}: SchoolClassActionsProps) {
  if (isExternalUser) return null;

  return (
    <div
      className="schoolclass-actions"
      onClick={(event) => event.stopPropagation()}
    >
      <ActionMenu
        items={[
          {
            name: t('Edit Class'),
            icon: <EditOutlined fontSize="small" />,
            onClick: () => onEditClass(classRow),
          },
          {
            name: t('Add Student'),
            icon: <PersonAddAlt1Outlined fontSize="small" />,
            onClick: () => onAddStudent(classRow),
          },
          {
            name: t('Delete Class'),
            icon: <DeleteOutline fontSize="small" />,
            onClick: () => onDeleteClass(classRow),
          },
        ]}
        renderTrigger={(open, isOpen) => (
          <MuiButton
            className="schoolclass-actions__trigger"
            size="medium"
            onClick={(event) => {
              event.stopPropagation();
              open(event);
            }}
            endIcon={
              isOpen ? (
                <KeyboardArrowUpIcon
                  className="schoolclass-actions__arrow"
                  fontSize="medium"
                />
              ) : (
                <KeyboardArrowDownIcon
                  className="schoolclass-actions__arrow"
                  fontSize="medium"
                />
              )
            }
          />
        )}
      />
    </div>
  );
}
