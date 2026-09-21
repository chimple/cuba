import React from 'react';
import {
  Button,
  CircularProgress,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  Add,
  DeleteOutline,
  FileDownloadOutlined,
  FileUploadOutlined,
} from '@mui/icons-material';
import { t } from 'i18next';

export type OfflineCacheSelectionAction = 'save' | 'clear';

type SchoolListHeaderActionsProps = {
  actionsAnchorEl: HTMLElement | null;
  cacheOfflineEnabled: boolean;
  clearOfflineCacheLabel: string;
  handleCacheSelectedSchools: () => void;
  handleCancelOfflineCacheSelection: () => void;
  handleClearSelectedSchoolCaches: () => void;
  handleCloseActionsMenu: () => void;
  handleOpenActionsMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleOpenAddSchoolPage: () => void;
  handleOpenMigratePage: () => void;
  handleOpenUploadPage: () => void;
  handleStartOfflineCacheSelection: (
    action: OfflineCacheSelectionAction,
  ) => void;
  haveAccess: boolean;
  isActionsButtonCloseShine: boolean;
  isActionsMenuOpen: boolean;
  isCachingSchools: boolean;
  isClearingSchoolCaches: boolean;
  isExternalUser: boolean;
  isOfflineCacheSelectionMode: boolean;
  offlineCacheSelectionAction: OfflineCacheSelectionAction | null;
  saveOfflineCacheLabel: string;
  selectedSchoolIds: string[];
};

function OfflineCacheSelectionControls({
  clearOfflineCacheLabel,
  handleCacheSelectedSchools,
  handleCancelOfflineCacheSelection,
  handleClearSelectedSchoolCaches,
  isCachingSchools,
  isClearingSchoolCaches,
  offlineCacheSelectionAction,
  saveOfflineCacheLabel,
  selectedSchoolIds,
}: Pick<
  SchoolListHeaderActionsProps,
  | 'clearOfflineCacheLabel'
  | 'handleCacheSelectedSchools'
  | 'handleCancelOfflineCacheSelection'
  | 'handleClearSelectedSchoolCaches'
  | 'isCachingSchools'
  | 'isClearingSchoolCaches'
  | 'offlineCacheSelectionAction'
  | 'saveOfflineCacheLabel'
  | 'selectedSchoolIds'
>) {
  const isSelectionDisabled =
    selectedSchoolIds.length === 0 ||
    isCachingSchools ||
    isClearingSchoolCaches;

  return (
    <div className="school-list-cache-save-control">
      {offlineCacheSelectionAction === 'save' && (
        <Button
          variant="contained"
          className="school-list-cache-save-button"
          startIcon={
            isCachingSchools ? (
              <CircularProgress
                size={16}
                thickness={5}
                className="school-list-cache-save-spinner"
              />
            ) : (
              <FileDownloadOutlined className="school-list-cache-save-icon" />
            )
          }
          disabled={isSelectionDisabled}
          onClick={handleCacheSelectedSchools}
        >
          {saveOfflineCacheLabel}
        </Button>
      )}
      {offlineCacheSelectionAction === 'clear' && (
        <Button
          variant="outlined"
          className="school-list-cache-clear-button"
          startIcon={
            isClearingSchoolCaches ? (
              <CircularProgress
                size={16}
                thickness={5}
                className="school-list-cache-clear-spinner"
              />
            ) : (
              <DeleteOutline fontSize="small" />
            )
          }
          disabled={isSelectionDisabled}
          onClick={handleClearSelectedSchoolCaches}
        >
          {clearOfflineCacheLabel}
        </Button>
      )}
      <Button
        variant="text"
        className="school-list-cache-cancel-button"
        disabled={isCachingSchools || isClearingSchoolCaches}
        onClick={handleCancelOfflineCacheSelection}
      >
        {t('Cancel')}
      </Button>
    </div>
  );
}

export default function SchoolListHeaderActions({
  actionsAnchorEl,
  cacheOfflineEnabled,
  clearOfflineCacheLabel,
  handleCacheSelectedSchools,
  handleCancelOfflineCacheSelection,
  handleClearSelectedSchoolCaches,
  handleCloseActionsMenu,
  handleOpenActionsMenu,
  handleOpenAddSchoolPage,
  handleOpenMigratePage,
  handleOpenUploadPage,
  handleStartOfflineCacheSelection,
  haveAccess,
  isActionsButtonCloseShine,
  isActionsMenuOpen,
  isCachingSchools,
  isClearingSchoolCaches,
  isExternalUser,
  isOfflineCacheSelectionMode,
  offlineCacheSelectionAction,
  saveOfflineCacheLabel,
  selectedSchoolIds,
}: SchoolListHeaderActionsProps) {
  const actionItems = !isExternalUser
    ? [
        ...(cacheOfflineEnabled
          ? [
              {
                key: 'add-cache',
                label: t('Add Cache'),
                icon: (
                  <FileDownloadOutlined className="school-list-upload-icon" />
                ),
                onClick: () => handleStartOfflineCacheSelection('save'),
                disabled: isCachingSchools || isClearingSchoolCaches,
              },
              {
                key: 'clear-cache',
                label: t('Clear Cache'),
                icon: <DeleteOutline className="school-list-upload-icon" />,
                onClick: () => handleStartOfflineCacheSelection('clear'),
                disabled: isCachingSchools || isClearingSchoolCaches,
              },
            ]
          : []),
        ...(haveAccess
          ? [
              {
                key: 'migrate',
                label: t('Migrate'),
                icon: (
                  <img
                    id="school-list-actions-migrate-icon"
                    src="assets/icons/migrateArrow.svg"
                    alt=""
                    className="school-list-actions-menu-icon-image"
                  />
                ),
                onClick: handleOpenMigratePage,
              },
            ]
          : []),
        {
          key: 'upload',
          label: t('Upload'),
          icon: <FileUploadOutlined className="school-list-upload-icon" />,
          onClick: handleOpenUploadPage,
        },
        ...(haveAccess
          ? [
              {
                key: 'add-school',
                label: t('Add School'),
                icon: <Add className="school-list-upload-icon" />,
                onClick: handleOpenAddSchoolPage,
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      {cacheOfflineEnabled && isOfflineCacheSelectionMode && (
        <OfflineCacheSelectionControls
          clearOfflineCacheLabel={clearOfflineCacheLabel}
          handleCacheSelectedSchools={handleCacheSelectedSchools}
          handleCancelOfflineCacheSelection={handleCancelOfflineCacheSelection}
          handleClearSelectedSchoolCaches={handleClearSelectedSchoolCaches}
          isCachingSchools={isCachingSchools}
          isClearingSchoolCaches={isClearingSchoolCaches}
          offlineCacheSelectionAction={offlineCacheSelectionAction}
          saveOfflineCacheLabel={saveOfflineCacheLabel}
          selectedSchoolIds={selectedSchoolIds}
        />
      )}
      <div className="school-list-actions-group">
        {!isExternalUser && (
          <Button
            variant="outlined"
            id="school-list-actions-button"
            className={`school-list-actions-button${
              isActionsButtonCloseShine
                ? ' school-list-actions-button-close-shine'
                : ''
            }`}
            onClick={handleOpenActionsMenu}
            aria-controls={
              isActionsMenuOpen ? 'school-list-actions-menu' : undefined
            }
            aria-expanded={isActionsMenuOpen ? 'true' : undefined}
            aria-haspopup="menu"
            endIcon={
              <ArrowDropDownIcon
                className={`school-list-actions-chevron ${
                  isActionsMenuOpen ? 'school-list-actions-chevron-open' : ''
                }`}
              />
            }
          >
            {t('Actions')}
          </Button>
        )}
        <Menu
          id="school-list-actions-menu"
          anchorEl={actionsAnchorEl}
          open={isActionsMenuOpen}
          onClose={handleCloseActionsMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          MenuListProps={{ disablePadding: true }}
          PaperProps={{ className: 'school-list-actions-menu' }}
        >
          {actionItems.flatMap((item, index) => [
            <MenuItem
              key={item.key}
              className="school-list-actions-menu-item"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                handleCloseActionsMenu();
                item.onClick();
              }}
            >
              <ListItemIcon className="school-list-actions-menu-item-icon">
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  className: 'school-list-actions-menu-item-label',
                }}
              />
            </MenuItem>,
            ...(index < actionItems.length - 1
              ? [
                  <Divider
                    key={`${item.key}-divider`}
                    className="school-list-actions-menu-divider"
                  />,
                ]
              : []),
          ])}
        </Menu>
      </div>
    </>
  );
}
