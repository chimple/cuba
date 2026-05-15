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
import EditProfileIcon from '../icons/EditProfileIcon';
import Loading from '../Loading';
import DialogBoxButtons from './DialogBoxButtons';
import './ProfileCard.css';

const editProfileDialogIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className="profile-card-dialog-button-icon"
    aria-hidden="true"
  >
    <path
      d="M15.625 3.95006L12.0505 0.374992C11.9317 0.256107 11.7906 0.1618 11.6352 0.0974584C11.4799 0.0331166 11.3135 0 11.1453 0C10.9772 0 10.8107 0.0331166 10.6554 0.0974584C10.5001 0.1618 10.359 0.256107 10.2401 0.374992L0.375211 10.2402C0.255833 10.3586 0.161187 10.4996 0.0967749 10.6549C0.0323627 10.8103 -0.000530757 10.9768 6.47604e-06 11.145V14.72C6.47604e-06 15.0595 0.134865 15.3851 0.374914 15.6251C0.614964 15.8651 0.94054 16 1.28002 16H4.85526C5.02342 16.0005 5.19 15.9676 5.34534 15.9032C5.50067 15.8388 5.64164 15.7442 5.76007 15.6248L15.625 5.76039C15.7439 5.64153 15.8382 5.50041 15.9025 5.3451C15.9669 5.18979 16 5.02333 16 4.85522C16 4.68711 15.9669 4.52065 15.9025 4.36534C15.8382 4.21003 15.7439 4.06891 15.625 3.95006ZM1.54482 10.8802L8.77291 3.65247L10.1073 4.98762L2.88004 12.2145L1.54482 10.8802ZM1.28002 12.4249L3.57525 14.72H1.28002V12.4249ZM5.12007 14.4553L3.78485 13.1201L11.0129 5.89238L12.3474 7.22753L5.12007 14.4553Z"
      fill="#300D37"
    />
  </svg>
);

const deleteProfileDialogIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="16"
    viewBox="0 0 14 16"
    fill="none"
    className="profile-card-dialog-button-icon"
    aria-hidden="true"
  >
    <path
      d="M3.11106 16C2.58716 16 2.1409 15.8136 1.77228 15.4407C1.40366 15.0678 1.21935 14.6164 1.21935 14.0865V3.14697H0V1.23343H4.68665V0H9.30241V1.23343H14V3.14697H12.7806V14.0765C12.7806 14.6177 12.5963 15.0736 12.2277 15.4441C11.8591 15.8147 11.4128 16 10.8889 16H3.11106ZM10.8889 3.14697H3.11106V14.0865H10.8889V3.14697ZM4.714 12.4871H6.48035V4.74075H4.714V12.4871ZM7.51965 12.4871H9.286V4.74075H7.51965V12.4871Z"
      fill="white"
    />
  </svg>
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
            <EditProfileIcon />
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
