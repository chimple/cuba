import { t } from 'i18next';
import {
  ACTIVE_HEADER_ICON_CONFIGS,
  HOMEHEADERLIST,
} from '../common/constants';
import IconButton from './IconButton';
import { IonBadge } from '@ionic/react';
import { useFeatureIsOn } from '@growthbook/growthbook-react';
import { TRACKABLE_IDS, type TrackableId } from '../analytics/trackable';

const getHeaderTrackableId = (
  headerList: HOMEHEADERLIST,
  isProfile: boolean,
): TrackableId | undefined => {
  if (isProfile) return TRACKABLE_IDS.HOME_PROFILE_MENU;

  switch (headerList) {
    case HOMEHEADERLIST.HOME:
      return TRACKABLE_IDS.HOME_TAB;
    case HOMEHEADERLIST.ASSIGNMENT:
      return TRACKABLE_IDS.HOME_HOMEWORK_TAB;
    case HOMEHEADERLIST.SUBJECTS:
      return TRACKABLE_IDS.HOME_SUBJECTS_TAB;
    case HOMEHEADERLIST.LIVEQUIZ:
      return TRACKABLE_IDS.HOME_SPECIALS_TAB;
    default:
      return undefined;
  }
};

const HeaderIcon: React.FC<{
  headerConfig: any;
  currentHeader: string;
  pendingAssignmentCount: number | undefined;
  pendingLiveQuizCount: number | undefined;
  onHeaderIconClick: Function;
  isProfile?: boolean;
}> = ({
  headerConfig,
  currentHeader,
  pendingAssignmentCount,
  pendingLiveQuizCount,
  onHeaderIconClick,
  isProfile = false,
}) => {
  const isCurrentHeaderActive = currentHeader === headerConfig.headerList;
  const isHomeworkNotificationIconOn = useFeatureIsOn(
    'homework_notification_icon',
  );

  return (
    <div
      style={{
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {headerConfig.headerList === HOMEHEADERLIST.ASSIGNMENT &&
        pendingAssignmentCount !== undefined &&
        pendingAssignmentCount > 0 && (
          <div id="homework-notification">
            {!isHomeworkNotificationIconOn ? (
              // Show number badge
              <IonBadge class="badge-notification">
                {pendingAssignmentCount}
              </IonBadge>
            ) : (
              // Show image icon
              <img
                src="/assets/icons/BellNotifyIcon.svg"
                alt="Homework Notification"
                className="headericon-bell-notification"
              />
            )}
          </div>
        )}
      {headerConfig.headerList == HOMEHEADERLIST.LIVEQUIZ &&
        !!pendingLiveQuizCount &&
        pendingLiveQuizCount > 0 && (
          <div id="homework-notification">
            <IonBadge class="livequiz-badge-notification">
              {pendingLiveQuizCount}
            </IonBadge>
          </div>
        )}
      <IconButton
        name={t(headerConfig.displayName)}
        iconSrc={
          !isCurrentHeaderActive
            ? headerConfig.iconSrc
            : ACTIVE_HEADER_ICON_CONFIGS.get(headerConfig.headerList)?.iconSrc
        }
        onClick={() => {
          if (!isCurrentHeaderActive) {
            onHeaderIconClick(headerConfig.headerList);
          }
        }}
        isProfile={isProfile}
        trackableId={getHeaderTrackableId(headerConfig.headerList, isProfile)}
      />
    </div>
  );
};

export default HeaderIcon;
