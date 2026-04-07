import { t } from 'i18next';
import './DeleteParentAccount.css';
import { ImBin } from 'react-icons/im';
import { useState } from 'react';
import DialogBoxButtons from './DialogBoxButtons​';
import { ServiceConfig } from '../../services/ServiceConfig';
import { useHistory } from 'react-router';
import { ACTION, EVENTS, PAGES } from '../../common/constants';
import { Util } from '../../utility/util';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import Loading from '../Loading';
import { logAuthDebug } from '../../utility/authDebug';

const DeleteParentAccount: React.FC = () => {
  const [showDialogBox, setShowDialogBox] = useState(false);
  const history = useHistory();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const ondelete = async () => {
    setIsLoading(true);
    const auth = ServiceConfig.getI().authHandler;
    const api = ServiceConfig.getI().apiHandler;
    const user = await auth.getCurrentUser();
    logAuthDebug('User initiated parent account deletion flow.', {
      source: 'DeleteParentAccount.ondelete',
      reason: 'delete_parent_account_confirmed',
      user_id: user?.id,
    });
    await api.deleteAllUserData();
    await auth.logOut();
    Util.unSubscribeToClassTopicForAllStudents();

    const eventParams = {
      user_id: user?.id,
      user_name: user?.name,
      user_gender: user?.gender!,
      user_age: user?.age!,
      phone_number: user?.phone,
      action_type: ACTION.DELETE,
    };

    Util.logEvent(EVENTS.USER_PROFILE, eventParams);
    setIsLoading(false);
    logAuthDebug('Navigating to login after parent account deletion.', {
      source: 'DeleteParentAccount.ondelete',
      reason: 'account_deleted_navigate_login',
      from_page: window.location.pathname,
      to_page: PAGES.LOGIN,
      user_id: user?.id,
    });
    history.replace(PAGES.LOGIN);
    if (Capacitor.isNativePlatform()) window.location.reload();
  };

  const handleDeleteParent = async () => {
    await Browser.open({
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSd0q3StMO49k_MvBQ68F_Ygdytpmxv-vNuF5jqsk6dY-4N0BA/viewform?pli=1',
    });
  };

  return (
    <div
      onClick={() => {
        setShowDialogBox(!showDialogBox);
      }}
      className="parent-delete-btn"
    >
      <ImBin className="parent-delete-icon" />
      <div>{t("Delete Parent's Account")}</div>
      <DialogBoxButtons
        width={'40vw'}
        height={'30vh'}
        message={t("Do you want to delete the parent's account?")}
        showDialogBox={showDialogBox}
        yesText={t('Cancel')}
        noText={t('Delete')}
        handleClose={() => {
          setShowDialogBox(false);
        }}
        onYesButtonClicked={() => {
          setShowDialogBox(false);
        }}
        onNoButtonClicked={handleDeleteParent}
      />
      <Loading isLoading={isLoading} />
    </div>
  );
};

export default DeleteParentAccount;
