import React from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Typography,
} from '@mui/material';
import { t } from 'i18next';
import CommonPopup from '../components/CommonPopup';

type MigrateSchoolsDialogsProps = {
  handleCloseFailurePopup: () => void;
  handleCloseMigrateDialog: () => void;
  handleCloseSuccessPopup: () => void;
  handleConfirmMigrate: () => void;
  isFailurePopupOpen: boolean;
  isMigrateDialogOpen: boolean;
  isMigrating: boolean;
  isSuccessPopupOpen: boolean;
  selectedCount: number;
};

export const MigrateSchoolsDialogs = ({
  handleCloseFailurePopup,
  handleCloseMigrateDialog,
  handleCloseSuccessPopup,
  handleConfirmMigrate,
  isFailurePopupOpen,
  isMigrateDialogOpen,
  isMigrating,
  isSuccessPopupOpen,
  selectedCount,
}: MigrateSchoolsDialogsProps) => (
  <>
    <Dialog
      open={isMigrateDialogOpen}
      onClose={handleCloseMigrateDialog}
      id="migrate-schools-confirm-dialog"
      className="migrate-schools-confirm-dialog"
      maxWidth="sm"
      fullWidth
    >
      <DialogContent
        id="migrate-schools-confirm-content"
        className="migrate-schools-confirm-content"
      >
        <Typography
          id="migrate-schools-confirm-text"
          className="migrate-schools-confirm-text"
        >
          {t(
            'Are you sure you want to migrate the selected {{count}} schools to the next academic year?',
            { count: selectedCount },
          )}
        </Typography>
        <div
          id="migrate-schools-confirm-warning"
          className="migrate-schools-confirm-warning"
        >
          {t('This cannot be reversed. Please be certain.')}
        </div>
        <div
          id="migrate-schools-confirm-actions"
          className="migrate-schools-confirm-actions"
        >
          <Button
            variant="text"
            id="migrate-schools-cancel-button"
            className="migrate-schools-confirm-cancel"
            onClick={handleCloseMigrateDialog}
            disabled={isMigrating}
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            id="migrate-schools-confirm-button"
            className="migrate-schools-confirm-migrate"
            onClick={handleConfirmMigrate}
            disabled={isMigrating}
            startIcon={
              isMigrating ? (
                <CircularProgress size={14} color="inherit" />
              ) : undefined
            }
          >
            {isMigrating ? t('Migrating...') : t('Migrate')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    <CommonPopup
      open={isSuccessPopupOpen}
      onClose={handleCloseSuccessPopup}
      icon={
        <img
          src="assets/icons/migratesuccess.svg"
          alt={String(t('Migration success'))}
          id="migrate-schools-success-icon"
          className="migrate-schools-success-icon"
        />
      }
      title={t('Successfully Migrated')}
      subtitle={t(
        'Selected {{count}} schools have migrated to the next academic year.',
        { count: selectedCount },
      )}
    />
    <CommonPopup
      open={isFailurePopupOpen}
      onClose={handleCloseFailurePopup}
      icon={
        <img
          src="assets/icons/migratefailure.svg"
          alt={String(t('Something went wrong'))}
          id="migrate-schools-failure-icon"
          className="migrate-schools-failure-icon"
        />
      }
      title={t('Something went wrong')}
      subtitle={t("We couldn't complete the migration. Please try again later")}
    />
  </>
);
