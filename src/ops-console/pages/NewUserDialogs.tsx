import React from 'react';
import { t } from 'i18next';
import CommonDialogBox from '../../common/CommonDialogBox';

type DialogState = {
  open: boolean;
  message: string;
};

type NewUserDialogsProps = {
  errorDialog: DialogState;
  handleSuccessOk: () => void;
  setErrorDialog: (state: DialogState) => void;
  setSuccessDialog: (state: DialogState) => void;
  setValidationDialog: (state: DialogState) => void;
  successDialog: DialogState;
  validationDialog: DialogState;
};

export const NewUserDialogs = ({
  errorDialog,
  handleSuccessOk,
  setErrorDialog,
  setSuccessDialog,
  setValidationDialog,
  successDialog,
  validationDialog,
}: NewUserDialogsProps) => (
  <>
    <CommonDialogBox
      showConfirmFlag={validationDialog.open}
      onDidDismiss={() => setValidationDialog({ open: false, message: '' })}
      header={t('Invalid Format') ?? ''}
      message={t(validationDialog.message)}
      rightButtonText={t('OK') ?? ''}
      rightButtonHandler={() =>
        setValidationDialog({ open: false, message: '' })
      }
    />
    <CommonDialogBox
      showConfirmFlag={successDialog.open}
      onDidDismiss={() => setSuccessDialog({ open: false, message: '' })}
      header={t('Success') ?? ''}
      message={t(successDialog.message)}
      rightButtonText={t('OK') ?? ''}
      rightButtonHandler={handleSuccessOk}
    />
    <CommonDialogBox
      showConfirmFlag={errorDialog.open}
      onDidDismiss={() => setErrorDialog({ open: false, message: '' })}
      header={t('Error') ?? ''}
      message={t(errorDialog.message ?? '')}
      rightButtonText={t('OK') ?? ''}
      rightButtonHandler={() => setErrorDialog({ open: false, message: '' })}
    />
  </>
);
