import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { BorderColor as BorderColorIcon, MoreHoriz } from '@mui/icons-material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { t } from 'i18next';
import type { TeacherInfo } from '../../../common/constants';
import type { Column } from '../DataTableBody';
import ActionMenu from './ActionMenu';
import type { DisplayTeacher } from './SchoolTeachers.types';
import {
  renderTeacherPerformancePill,
  renderTeacherWhatsappGroupChip,
} from './SchoolTeachers.utils';

type UseSchoolTeachersColumnsProps = {
  getTeacherInfo: (userId: string, classId: string) => TeacherInfo | null;
  handleOpenEditTeacherModal: (row: DisplayTeacher) => void;
  isExternalUser: boolean;
  setDeleteTargetTeacher: (teacher: TeacherInfo | null) => void;
  setIsDeleteModalOpen: (open: boolean) => void;
  setOpenPopup: (open: boolean) => void;
  setTeacherStatus: (
    status: import('../../../common/constants').EnumType<'fc_support_level'>,
  ) => void;
  setcurrentTeachers: (teacher: TeacherInfo) => void;
  teachersWithPerformance: DisplayTeacher[];
};

export const useSchoolTeachersColumns = ({
  getTeacherInfo,
  handleOpenEditTeacherModal,
  isExternalUser,
  setDeleteTargetTeacher,
  setIsDeleteModalOpen,
  setOpenPopup,
  setTeacherStatus,
  setcurrentTeachers,
  teachersWithPerformance,
}: UseSchoolTeachersColumnsProps): Column<DisplayTeacher>[] => [
  {
    key: 'name',
    label: t('Teacher Name'),
    align: 'left',
    headerAlign: 'left',
    width: 160,
    render: (teacher: DisplayTeacher) => (
      <Typography
        variant="body2"
        className="teacher-name-data schoolTeachers-firstColText"
      >
        {teacher.name}
      </Typography>
    ),
  },
  ...(!isExternalUser
    ? [
        {
          key: 'interactData',
          label: t('Interact'),
          align: 'center',
          width: 60,
          sortable: false,
          render: (row) => (
            <Box className="schoolTeachers-interactCell">
              <IconButton
                size="small"
                onClick={async () => {
                  setOpenPopup(true);
                  const currentTeacher = getTeacherInfo(row.id, row.classId);
                  if (currentTeacher) {
                    setcurrentTeachers(currentTeacher);
                  }
                  const performance =
                    teachersWithPerformance.find(
                      (teacher) =>
                        teacher.id === row.id &&
                        teacher.classId === row.classId,
                    )?.performance ?? null;
                  if (performance) setTeacherStatus(performance);
                }}
              >
                <img
                  src="/assets/icons/Interact.svg"
                  alt="Interact"
                  className="schoolTeachers-interactIcon"
                />
              </IconButton>
            </Box>
          ),
        } as Column<DisplayTeacher>,
      ]
    : []),
  {
    key: 'class',
    label: t('Class Name'),
    sortable: true,
    renderCell: (teacher: DisplayTeacher) => (
      <Typography variant="body2" className="student-name-data">
        {teacher.class}
      </Typography>
    ),
  },
  {
    key: 'performance',
    label: t('Performance (7 days)'),
    align: 'center',
    width: 120,
    sortable: false,
    render: (row) => renderTeacherPerformancePill(row.performance),
  },
  {
    key: 'whatsappGroupStatus',
    label: t('WhatsApp Group'),
    sortable: false,
    render: (row) => renderTeacherWhatsappGroupChip(row.whatsappGroupStatus),
  },
  ...(!isExternalUser
    ? [
        {
          key: 'phoneEmailDisplay',
          label: t('Phone / Email'),
          renderCell: (row: DisplayTeacher) => (
            <Typography variant="body2" className="truncate-text">
              {row.phoneEmailDisplay}
            </Typography>
          ),
        } as Column<DisplayTeacher>,
      ]
    : []),
  ...(!isExternalUser
    ? [
        {
          key: 'teacher_actions',
          label: '',
          sortable: false,
          render: (row: DisplayTeacher) => (
            <Box className="schoolTeachers-actionsCell">
              <ActionMenu
                items={[
                  {
                    name: t('Edit Details'),
                    icon: (
                      <BorderColorIcon
                        fontSize="small"
                        className="schoolTeachers-actionEditIcon"
                      />
                    ),
                    onClick: () => {
                      void handleOpenEditTeacherModal(row);
                    },
                  },
                  {
                    name: t('Delete'),
                    icon: (
                      <DeleteOutlineIcon
                        fontSize="small"
                        className="schoolTeachers-actionDeleteIcon"
                      />
                    ),
                    onClick: () => {
                      const fullTeacher =
                        row.interactPayload ??
                        getTeacherInfo(row.id, row.classId);
                      if (!fullTeacher) return;
                      setDeleteTargetTeacher(fullTeacher);
                      setIsDeleteModalOpen(true);
                    },
                  },
                ]}
                renderTrigger={(open) => (
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      open(event);
                    }}
                    className="schoolTeachers-actionTrigger"
                    id={`schoolTeachers-actionTrigger-${row.id}-${row.classId}`}
                  >
                    <MoreHoriz className="schoolTeachers-actionTriggerIcon" />
                  </IconButton>
                )}
              />
            </Box>
          ),
        } as Column<DisplayTeacher>,
      ]
    : []),
];
