import { IonToast } from '@ionic/react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { t } from 'i18next';
import GenericPopup from '../components/GenericPopUp/GenericPopUp';
import { PopupConfig } from '../components/GenericPopUp/GenericPopUpType';
import Loading from '../components/Loading';

type PopupLocalizedContent = PopupConfig['content'][string];

type PopupEventDetail = {
  config: PopupConfig;
  localized: PopupLocalizedContent;
};

type AppOverlaysProps = {
  isGlobalLoading: boolean;
  popupData: PopupEventDetail | null;
  onPopupClose: () => void;
  onPopupAction: () => void;
  showBreakModal: boolean;
  onContinueFromBreak: () => void;
  showBreakToast: boolean;
  onDismissBreakToast: () => void;
};

const AppOverlays = ({
  isGlobalLoading,
  popupData,
  onPopupClose,
  onPopupAction,
  showBreakModal,
  onContinueFromBreak,
  showBreakToast,
  onDismissBreakToast,
}: AppOverlaysProps) => (
  <>
    <Dialog
      open={showBreakModal}
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
        onContinueFromBreak();
      }}
      className="custom-dialog"
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        {t('Time for a break!') || ''}
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        {t(
          'Youâ€™ve used Chimple for 25 minutes today. Take a break to rest your eyes!',
        ) || ''}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="success"
          onClick={onContinueFromBreak}
          sx={{
            borderRadius: '1vh',
            padding: '1vh 2vw',
            minWidth: '20vh',
            fontWeight: 'bold',
          }}
        >
          {t('Continue')}
        </Button>
      </DialogActions>
    </Dialog>

    <IonToast
      isOpen={showBreakToast}
      onDidDismiss={onDismissBreakToast}
      message="You have resumed after exceeding the time limit."
      duration={3000}
    />

    {popupData && (
      <GenericPopup
        thumbnailImageUrl={popupData.localized.thumbnailImageUrl}
        backgroundImageUrl={popupData.localized.backgroundImageUrl}
        audioUrl={popupData.localized.audioUrl}
        heading={popupData.localized.heading}
        subHeading={popupData.localized.subHeading}
        details={popupData.localized.details}
        buttonText={popupData.localized.buttonText}
        onClose={onPopupClose}
        onAction={onPopupAction}
      />
    )}
    <Loading isLoading={isGlobalLoading} />
  </>
);

export default AppOverlays;
