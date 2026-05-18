import { IonCard } from '@ionic/react';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  ACTION,
  ASSESSMENT_FAIL_KEY,
  AVATARS,
  EVENTS,
  FAIL_STREAK_KEY,
  MODES,
  PAGES,
  TableTypes,
} from '../../common/constants';
import { useOnlineOfflineErrorMessageHandler } from '../../common/onlineOfflineErrorMessageHandler';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import Loading from '../Loading';
import DialogBoxButtons from './DialogBoxButtons';
import './ProfileCard.css';

const EDIT_PROFILE_ICON_SRC = '/assets/edit-profile-icon.svg';
const EDIT_PROFILE_DIALOG_ICON_SRC =
  '/assets/profile-card-edit-dialog-icon.svg';
const DELETE_PROFILE_DIALOG_ICON_SRC =
  '/assets/profile-card-delete-dialog-icon.svg';

const editProfileDialogIcon = (
  <img
    src={EDIT_PROFILE_DIALOG_ICON_SRC}
    alt=""
    className="profile-card-dialog-button-icon"
    aria-hidden="true"
  />
);

const deleteProfileDialogIcon = (
  <img
    src={DELETE_PROFILE_DIALOG_ICON_SRC}
    alt=""
    className="profile-card-dialog-button-icon"
    aria-hidden="true"
  />
);

type ProfileCardActionType =
  | 'play'
  | 'view_progress'
  | 'edit_profile'
  | 'delete_profile';

const ProfileCard: React.FC<{
  width: string;
  height: string;
  //true for User, false for no user
  userType: boolean;
  user: TableTypes<'user'>;
  showText?: boolean;
  setReloadProfiles: (event: boolean) => void;
  profiles?: TableTypes<'user'>[];
  studentCurrMode: string | undefined;
}> = ({
  width,
  height,
  userType,
  user,
  setReloadProfiles,
  profiles,
  studentCurrMode,
}) => {
  const history = useHistory();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [showWarningDialogBox, setShowWarningDialogBox] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const areProfilesAvailable = (profiles && profiles[0] == null) || undefined;
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const getProfileCardActionParams = (
    actionType: ProfileCardActionType,
  ): Record<string, string> => {
    const currentClass = Util.getCurrentClass();
    return {
      action_type: actionType,
      target_student_id: user.id,
      target_student_grade: user.grade_id ?? '',
      ...(studentCurrMode === MODES.TEACHER_SCHOOL && currentClass?.id
        ? { class_id: currentClass.id }
        : {}),
    };
  };

  const logProfileCardAction = (actionType: ProfileCardActionType): void => {
    void Util.logEvent(
      EVENTS.PROFILE_CARD_ACTION_CLICKED,
      getProfileCardActionParams(actionType),
    );
  };

  return (
    <IonCard
      id="profile-card"
      className={userType ? 'profile-card-user' : 'profile-card-add-child'}
      style={{
        width: width,
        height: height,
      }}
      onClick={() => {}}
    >
      <div id="profile-card-edit-icon-div">
        {userType ? (
          <button
            type="button"
            id="profile-card-edit-icon"
            aria-label="Edit"
            onClick={(event) => {
              event.stopPropagation();
              if (!online) {
                presentToast({
                  message: t(
                    `Device is offline. Cannot edit or delete child profile`,
                  ),
                  color: 'danger',
                  duration: 3000,
                  position: 'bottom',
                  buttons: [
                    {
                      text: 'Dismiss',
                      role: 'cancel',
                    },
                  ],
                });
                return;
              }
              setShowDialogBox(true);
            }}
          >
            <img src={EDIT_PROFILE_ICON_SRC} alt="" aria-hidden="true" />
          </button>
        ) : (
          <p className="profile-card-empty-element">&#9679;</p>
        )}
      </div>
      {userType ? (
        <div id="profile-card-image-div">
          <img
            id="profile-card-image"
            loading="lazy"
            src={
              (studentCurrMode === MODES.SCHOOL && user.image) ||
              'assets/avatars/' + (user.avatar ?? AVATARS[0]) + '.png'
            }
            alt=""
          />
          <p id="profile-card-user-name">{user.name ? user.name : '\u00A0'}</p>
        </div>
      ) : (
        <div id="profile-card-new-user">
          <button
            type="button"
            id="profile-card-new-user-icon"
            aria-label={t('Add a Child') ?? undefined}
            onClick={() => {
              if (!online) {
                presentToast({
                  message: t(
                    `Device is offline. Cannot create a new child profile`,
                  ),
                  color: 'danger',
                  duration: 3000,
                  position: 'bottom',
                  buttons: [
                    {
                      text: 'Dismiss',
                      role: 'cancel',
                    },
                  ],
                });
                return;
              }
              void Util.logEvent(EVENTS.PROFILE_CREATION_CLICKED, {});
              history.replace(PAGES.CREATE_STUDENT, {
                showBackButton: !areProfilesAvailable,
              });
            }}
          >
            <span className="profile-card-new-user-icon-horizontal" />
            <span className="profile-card-new-user-icon-vertical" />
          </button>
          <p>{t('Add a Child')}</p>
        </div>
      )}

      {userType ? (
        <div
          id="profile-card-image-report"
          onClick={async () => {
            logProfileCardAction('view_progress');
            await Util.setCurrentStudent(user, undefined, false, false);

            Util.setPathToBackButton(PAGES.STUDENT_PROGRESS, history);
          }}
        >
          Progress
        </div>
      ) : (
        <p className="profile-card-empty-element">&#9679;</p>
      )}
      {showDialogBox ? (
        <DialogBoxButtons
          width={'40vw'}
          height={'30vh'}
          message={t("Choose the below options to manage your kid's profile.")}
          showDialogBox={showDialogBox}
          yesText={t('Edit Profile')}
          noText={t('Delete Profile')}
          className="profile-card-manage-dialog"
          showCloseButton={true}
          yesIcon={editProfileDialogIcon}
          noIcon={deleteProfileDialogIcon}
          handleClose={() => {
            setShowDialogBox(false);
          }}
          onYesButtonClicked={async ({}) => {
            logProfileCardAction('edit_profile');
            // Passing false to not change the student language as it is not required for edit student screen
            await Util.setCurrentStudent(user, undefined, false, false);
            history.replace(PAGES.EDIT_STUDENT, {
              from: history.location.pathname,
            });
            setShowDialogBox(false);
          }}
          onNoButtonClicked={async ({}) => {
            logProfileCardAction('delete_profile');
            setShowWarningDialogBox(true);
          }}
        ></DialogBoxButtons>
      ) : null}
      {showWarningDialogBox ? (
        <DialogBoxButtons
          width={'40vw'}
          height={'30vh'}
          message={t('Are you sure you want to delete this profile?')}
          showDialogBox={showWarningDialogBox}
          yesText={t('Yes')}
          noText={t('No')}
          className="profile-card-delete-dialog"
          showCloseButton={true}
          handleClose={() => {
            void Util.logEvent(EVENTS.PROFILE_DELETION_CANCELLED, {
              target_student_id: user.id,
            });
            setShowWarningDialogBox(false);
          }}
          onYesButtonClicked={async ({}) => {
            void Util.logEvent(EVENTS.PROFILE_DELETION_CONFIRMED, {
              target_student_id: user.id,
            });
            setShowWarningDialogBox(false);
            setShowDialogBox(false);
            setIsLoading(true);
            setReloadProfiles(false);
            localStorage.removeItem(`${ASSESSMENT_FAIL_KEY}_${user.id}`);
            localStorage.removeItem(`${FAIL_STREAK_KEY}_${user.id}`);
            await ServiceConfig.getI().apiHandler.deleteProfile(user.id);
            setReloadProfiles(true);
            const eventParams = {
              user_id: user.id,

              user_name: user.name,
              user_gender: user.gender!,
              user_age: user.age!,
              phone_number: user.phone,

              action_type: ACTION.DELETE,
            };
            Util.logEvent(EVENTS.USER_PROFILE, eventParams);
            setIsLoading(false);
          }}
          onNoButtonClicked={async ({}) => {
            void Util.logEvent(EVENTS.PROFILE_DELETION_CANCELLED, {
              target_student_id: user.id,
            });
            setShowWarningDialogBox(false);
          }}
        ></DialogBoxButtons>
      ) : null}
      <Loading isLoading={isLoading} />
    </IonCard>
  );
};

export default ProfileCard;
