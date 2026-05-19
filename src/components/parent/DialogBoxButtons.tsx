import React, { MouseEventHandler, ReactNode } from 'react';
import './DialogBoxButtons.css';
import { OverlayEventDetail } from '@ionic/react/dist/types/components/react-component-lib/interfaces';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

const DialogBoxButtons: React.FC<{
  width: string;
  height: string;
  showDialogBox: boolean;
  message: string;
  yesText: string;
  noText: string;
  handleClose: (event: CustomEvent<OverlayEventDetail<unknown>>) => void;
  onYesButtonClicked: MouseEventHandler<HTMLDivElement>;
  onNoButtonClicked: MouseEventHandler<HTMLDivElement>;
  className?: string;
  noIcon?: ReactNode;
  showCloseButton?: boolean;
  yesIcon?: ReactNode;
}> = ({
  width,
  height,
  showDialogBox,
  message,
  yesText,
  noText,
  handleClose,
  onYesButtonClicked,
  onNoButtonClicked,
  className,
  noIcon,
  showCloseButton = false,
  yesIcon,
}) => {
  const [pressedButtonId, setPressedButtonId] = React.useState<string | null>(
    null,
  );
  const clearPressedButton = (): void => {
    window.setTimeout(() => setPressedButtonId(null), 120);
  };

  return (
    <div>
      <Dialog
        open={showDialogBox}
        onClose={handleClose}
        PaperProps={{ className }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '20px !important',
            maxWidth: '75vw !important',
            minWidth: '42vw !important',
          },
          '& .MuiTypography-root': {
            margin: className ? '0 !important' : '13% 0% 0% 0% !important',
          },
        }}
      >
        {showCloseButton && (
          <button
            type="button"
            className="dialog-box-close-button"
            aria-label="Close"
            onClick={() =>
              handleClose({} as CustomEvent<OverlayEventDetail<unknown>>)
            }
          >
            <img src="assets/popup-close.svg" alt="" />
          </button>
        )}
        <DialogContent
          style={{
            // padding: "8% 5%",
            textAlign: 'center',
            width: width,
            height: height,
            maxWidth: '70vw',
            maxHeight: '40vh',
          }}
        >
          <DialogContentText
            style={{
              textAlign: 'center',
              color: 'var(--text-color)',
              fontWeight: 'normal',
            }}
          >
            {message}
          </DialogContentText>
        </DialogContent>
        <DialogActions
          style={{
            justifyContent: 'space-around',
            margin: '3%',
          }}
        >
          <div
            id={'yes-button'}
            className={`dialog-box-button-style ${
              pressedButtonId === 'yes-button'
                ? 'dialog-box-button-style-pressed'
                : ''
            }`}
            onPointerDown={() => setPressedButtonId('yes-button')}
            onPointerLeave={clearPressedButton}
            onPointerUp={clearPressedButton}
            onClick={onYesButtonClicked}
          >
            {yesIcon}
            {yesText}
          </div>
          <div
            id={'no-button'}
            className={`dialog-box-button-style ${
              pressedButtonId === 'no-button'
                ? 'dialog-box-button-style-pressed'
                : ''
            }`}
            onPointerDown={() => setPressedButtonId('no-button')}
            onPointerLeave={clearPressedButton}
            onPointerUp={clearPressedButton}
            onClick={onNoButtonClicked}
          >
            {noIcon}
            {noText}
          </div>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DialogBoxButtons;
