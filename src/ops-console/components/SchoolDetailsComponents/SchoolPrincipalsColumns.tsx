import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { MoreHoriz } from '@mui/icons-material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { t } from 'i18next';
import type { Column } from '../DataTableBody';
import ActionMenu from './ActionMenu';
import type { DisplayPrincipal } from '../../hooks/useSchoolPrincipals';

export const buildSchoolPrincipalColumns = ({
  isExternalUser,
  onDeletePrincipal,
  onInteractPrincipal,
}: {
  isExternalUser: boolean;
  onDeletePrincipal: (principalId: string) => void;
  onInteractPrincipal: (principalId: string) => void;
}): Column<DisplayPrincipal>[] => [
  {
    key: 'name',
    label: t('Principal Name'),
    renderCell: (principal: DisplayPrincipal) => (
      <Typography variant="body2" className="principal-name-data">
        {principal.name}
      </Typography>
    ),
  },
  ...(!isExternalUser
    ? [
        {
          key: 'interactPayload',
          label: t('Interact'),
          align: 'center',
          width: 60,
          sortable: false,
          render: (row) => (
            <Box className="school-principals-interactCell">
              <IconButton
                size="small"
                onClick={async () => {
                  onInteractPrincipal(row.id);
                }}
              >
                <img
                  src="/assets/icons/Interact.svg"
                  alt="Interact"
                  className="school-principals-interactIcon"
                />
              </IconButton>
            </Box>
          ),
        } as Column<DisplayPrincipal>,
      ]
    : []),

  ...(!isExternalUser
    ? [
        {
          key: 'phoneEmailDisplay',
          label: t('Phone / Email'),
          renderCell: (row: DisplayPrincipal) => (
            <Typography variant="body2" className="truncate-text">
              {row.phoneEmailDisplay}
            </Typography>
          ),
        } as Column<DisplayPrincipal>,
      ]
    : []),
  ...(!isExternalUser
    ? [
        {
          key: 'principal_actions',
          label: '',
          sortable: false,
          render: (row) => (
            <Box className="school-principals-actionsCell">
              <ActionMenu
                items={[
                  {
                    name: t('Delete'),
                    icon: (
                      <DeleteOutlineIcon
                        fontSize="small"
                        className="school-principals-actionDeleteIcon"
                      />
                    ),
                    onClick: () => onDeletePrincipal(row.id),
                  },
                ]}
                renderTrigger={(open) => (
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      open(event);
                    }}
                    className="school-principals-actionTrigger"
                  >
                    <MoreHoriz className="school-principals-actionTriggerIcon" />
                  </IconButton>
                )}
              />
            </Box>
          ),
        } as Column<DisplayPrincipal>,
      ]
    : []),
];
