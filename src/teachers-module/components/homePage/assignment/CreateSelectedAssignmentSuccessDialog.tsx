import { useCreateSelectedAssignment } from '../../../hooks/useCreateSelectedAssignment';

type CreateSelectedAssignmentSuccessDialogProps = Pick<
  ReturnType<typeof useCreateSelectedAssignment>,
  | 'CommonDialogBox'
  | 'PAGES'
  | 'Util'
  | 'getShareText'
  | 'history'
  | 'parsePath'
  | 'setShowConfirm'
  | 'showConfirm'
  | 't'
>;

export const CreateSelectedAssignmentSuccessDialog = ({
  CommonDialogBox,
  PAGES,
  Util,
  getShareText,
  history,
  parsePath,
  setShowConfirm,
  showConfirm,
  t,
}: CreateSelectedAssignmentSuccessDialogProps) => (
  <div id="assignment-success-dialog">
    <CommonDialogBox
      header={t('Assignments are assigned Successfully.') ?? ''}
      message={t('Would you like to share the assignments?')}
      showConfirmFlag={showConfirm}
      leftButtonText={t('Cancel') ?? ''}
      leftButtonHandler={() => {
        setShowConfirm(false);
        history.replace({
          ...parsePath(PAGES.HOME_PAGE),
          state: { tabValue: 2 },
        });
      }}
      onDidDismiss={() => {
        setShowConfirm(false);
        history.replace({
          ...parsePath(PAGES.HOME_PAGE),
          state: { tabValue: 2 },
        });
      }}
      rightButtonText={t('Share') ?? ''}
      rightButtonHandler={async () => {
        const text = await getShareText();
        setShowConfirm(false);
        await Util.sendContentToAndroidOrWebShare(text, 'Assignment Assigned');
        history.replace({
          ...parsePath(PAGES.HOME_PAGE),
          state: { tabValue: 2 },
        });
      }}
    ></CommonDialogBox>
  </div>
);
