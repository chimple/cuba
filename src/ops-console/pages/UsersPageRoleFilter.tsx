import React, { useState } from 'react';
import FilterListIcon from '@mui/icons-material/FilterList';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { t } from 'i18next';
import { RoleLabels, RoleType } from '../../interface/modelInterfaces';

type UsersPageRoleFilterProps = {
  roles: string[];
  selectedRole: RoleType | null;
  onSelect: (role: RoleType | null) => void;
};

const getRoleFilterOptions = (roles: string[]): RoleType[] => {
  if (roles.includes(RoleType.SUPER_ADMIN)) {
    return [
      RoleType.SUPER_ADMIN,
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.PROGRAM_MANAGER,
      RoleType.FIELD_COORDINATOR,
      RoleType.EXTERNAL_USER,
    ];
  }
  if (roles.includes(RoleType.OPERATIONAL_DIRECTOR)) {
    return [
      RoleType.OPERATIONAL_DIRECTOR,
      RoleType.PROGRAM_MANAGER,
      RoleType.FIELD_COORDINATOR,
      RoleType.EXTERNAL_USER,
    ];
  }
  return roles.includes(RoleType.PROGRAM_MANAGER)
    ? [RoleType.FIELD_COORDINATOR]
    : [];
};

export const UsersPageRoleFilter: React.FC<UsersPageRoleFilterProps> = ({
  roles,
  selectedRole,
  onSelect,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const options = getRoleFilterOptions(roles);

  if (options.length === 0) return null;

  return (
    <>
      <IconButton
        size="small"
        aria-label={String(t('Filter Roles'))}
        className={`users-page-role-filter-button${
          selectedRole ? ' users-page-role-filter-button-active' : ''
        }`}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
          setAnchorEl(event.currentTarget)
        }
      >
        <FilterListIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ className: 'users-page-role-filter-menu' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {options.map((role) => (
          <MenuItem
            key={role}
            className="users-page-role-filter-menu-item"
            onClick={() => {
              onSelect(selectedRole === role ? null : role);
              setAnchorEl(null);
            }}
            selected={selectedRole === role}
          >
            {RoleLabels[role]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
