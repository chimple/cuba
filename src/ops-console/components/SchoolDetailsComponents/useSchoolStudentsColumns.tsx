import React, { useMemo } from 'react';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import {
  BorderColor as BorderColorIcon,
  ChatBubbleOutlineOutlined,
  DeleteOutline as DeleteOutlineIcon,
  MergeOutlined as MergeOutlinedIcon,
  MoreHoriz,
} from '@mui/icons-material';
import { t } from 'i18next';
import {
  OPS_PERFORMANCE_BANDS,
  WHATSAPP_GROUP_STATUS,
  WHATSAPP_GROUP_STATUS_KEYS,
  WHATSAPP_GROUP_TICK_ICON,
} from '../../../common/constants';
import type { StudentInfo } from '../../../common/constants';
import type { Column } from '../DataTableBody';
import ActionMenu from './ActionMenu';
import type {
  DisplayStudent,
  WhatsappGroupStatusKey,
} from './SchoolStudents.types';
import {
  getPerformanceChipClass,
  getWhatsappChipClass,
} from './SchoolStudents.utils';

const renderWhatsappGroupChip = (statusKey?: WhatsappGroupStatusKey) => {
  const key = statusKey ?? WHATSAPP_GROUP_STATUS_KEYS.NOT_CHECKED;
  return (
    <Chip
      icon={
        key === WHATSAPP_GROUP_STATUS_KEYS.IN_GROUP ? (
          <img
            src={WHATSAPP_GROUP_TICK_ICON}
            alt=""
            aria-hidden="true"
            className="schoolstudents-whatsapp-chip-icon"
          />
        ) : undefined
      }
      label={t(WHATSAPP_GROUP_STATUS[key])}
      size="small"
      className={`schoolstudents-whatsapp-chip ${getWhatsappChipClass(key)}`}
      sx={{
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 24,
        borderRadius: '9999px',
      }}
    />
  );
};

type UseSchoolStudentsColumnsParams = {
  getDeleteTargetStudent: (student: DisplayStudent) => StudentInfo;
  getStudentInfoById: (id: string) => StudentInfo | null;
  handleInteractClick: (student: DisplayStudent) => void;
  isExternalUser: boolean;
  issTotal: boolean;
  setDeleteTargetStudent: (student: StudentInfo) => void;
  setEditStudentData: (student: StudentInfo) => void;
  setIsDeleteModalOpen: (open: boolean) => void;
  setIsEditStudentModalOpen: (open: boolean) => void;
  setIsMergeStudentModalOpen: (open: boolean) => void;
  setMergePrimaryStudent: (student: DisplayStudent) => void;
};

export const useSchoolStudentsColumns = ({
  getDeleteTargetStudent,
  getStudentInfoById,
  handleInteractClick,
  isExternalUser,
  issTotal,
  setDeleteTargetStudent,
  setEditStudentData,
  setIsDeleteModalOpen,
  setIsEditStudentModalOpen,
  setIsMergeStudentModalOpen,
  setMergePrimaryStudent,
}: UseSchoolStudentsColumnsParams): Column<DisplayStudent>[] =>
  useMemo(() => {
    const actionColumn: Column<DisplayStudent>[] = isExternalUser
      ? []
      : [
          {
            key: 'schstudents_actions',
            label: '',
            sortable: false,
            render: (s) => (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActionMenu
                  items={[
                    {
                      name: t('Send Message'),
                      icon: (
                        <ChatBubbleOutlineOutlined
                          fontSize="small"
                          sx={{ color: 'black' }}
                        />
                      ),
                    },
                    {
                      name: t('Edit Details'),
                      icon: (
                        <BorderColorIcon
                          fontSize="small"
                          sx={{ color: 'black' }}
                        />
                      ),
                      onClick: () => {
                        const fullStudent = getStudentInfoById(s.id);
                        if (!fullStudent) return;
                        setEditStudentData(fullStudent);
                        setIsEditStudentModalOpen(true);
                      },
                    },
                    {
                      name: t('Merge'),
                      icon: (
                        <MergeOutlinedIcon
                          fontSize="small"
                          sx={{ color: 'black' }}
                          style={{ transform: 'rotate(90deg)' }}
                        />
                      ),
                      onClick: () => {
                        setMergePrimaryStudent(s);
                        setIsMergeStudentModalOpen(true);
                      },
                    },
                    {
                      name: t('Delete'),
                      icon: (
                        <DeleteOutlineIcon
                          fontSize="small"
                          sx={{ color: 'black' }}
                        />
                      ),
                      onClick: () => {
                        setDeleteTargetStudent(getDeleteTargetStudent(s));
                        setIsDeleteModalOpen(true);
                      },
                    },
                  ]}
                  renderTrigger={(open) => (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        open(e);
                      }}
                      sx={{
                        color: '#6B7280',
                        '&:hover': { bgcolor: '#F3F4F6' },
                      }}
                    >
                      <MoreHoriz sx={{ fontSize: 20, fontWeight: 800 }} />
                    </IconButton>
                  )}
                />
              </Box>
            ),
          },
        ];
    const commonColumns: Column<DisplayStudent>[] = [
      {
        key: 'studentIdDisplay',
        label: t('Student ID'),
        sortable: !issTotal ? false : undefined,
      },
      {
        key: 'name',
        label: t('Student Name'),
        align: 'left',
        render: (s) => (
          <Typography variant="body2" className="student-name-data">
            {s.name}
          </Typography>
        ),
      },
      ...(!isExternalUser
        ? ([
            {
              key: 'schstudents_interact',
              label: t('Interact'),
              sortable: false,
              render: (s) => (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'left',
                    alignItems: 'left',
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleInteractClick(s)}
                  >
                    <img
                      src="/assets/icons/Interact.svg"
                      alt="Interact"
                      style={{ width: 30, height: 30 }}
                    />
                  </IconButton>
                </Box>
              ),
            },
          ] as Column<DisplayStudent>[])
        : []),
    ];
    const genderColumn: Column<DisplayStudent> = {
      key: 'gender',
      label: t('Gender'),
      sortable: !issTotal ? false : undefined,
      render: (s) => (
        <Typography variant="body2" className="student-name-data">
          {s.gender
            ? s.gender.charAt(0).toUpperCase() + s.gender.slice(1).toLowerCase()
            : ''}
        </Typography>
      ),
    };
    const performanceColumn: Column<DisplayStudent> = {
      key: 'schstudents_performance',
      label: t('Performance'),
      sortable: false,
      render: (s) => (
        <Chip
          label={t(
            s.schstudents_performance || OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED,
          )}
          size="small"
          className={getPerformanceChipClass(
            s.schstudents_performance || OPS_PERFORMANCE_BANDS.NOT_DOWNLOADED,
          )}
          sx={{
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24,
            borderRadius: '4px',
          }}
        />
      ),
    };
    const whatsappGroupColumn: Column<DisplayStudent> = {
      key: 'whatsappGroupStatus',
      label: t('WhatsApp Group'),
      sortable: false,
      render: (s) => renderWhatsappGroupChip(s.whatsappGroupStatus),
    };
    if (!issTotal) {
      return [
        ...commonColumns,
        genderColumn,
        performanceColumn,
        whatsappGroupColumn,
        ...actionColumn,
      ];
    }
    return [
      ...commonColumns,
      genderColumn,
      performanceColumn,
      { key: 'class', label: t('Class') },
      whatsappGroupColumn,
      ...actionColumn,
    ];
  }, [
    getDeleteTargetStudent,
    getStudentInfoById,
    handleInteractClick,
    issTotal,
    isExternalUser,
    setDeleteTargetStudent,
    setEditStudentData,
    setIsDeleteModalOpen,
    setIsEditStudentModalOpen,
    setIsMergeStudentModalOpen,
    setMergePrimaryStudent,
  ]);
