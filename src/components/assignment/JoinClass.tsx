import { t } from 'i18next';
import './JoinClass.css';
import { FC, useEffect, useRef, useState } from 'react';
import { ServiceConfig } from '../../services/ServiceConfig';
import { Util } from '../../utility/util';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { useHistory, useLocation } from 'react-router';
import { useOnlineOfflineErrorMessageHandler } from '../../common/onlineOfflineErrorMessageHandler';
import { schoolUtil } from '../../utility/schoolUtil';
import InputWithIcons from '../common/InputWithIcons';
import Loading from '../Loading';
import logger from '../../utility/logger';
const urlClassCode: any = {};

const JoinClass: FC<{
  onClassJoin: () => void;
}> = ({ onClassJoin }) => {
  const [loading, setLoading] = useState(false);
  const [joiningClass, setJoiningClass] = useState(false);
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [codeResult, setCodeResult] = useState();
  const [error, setError] = useState('');
  const [schoolName, setSchoolName] = useState<string>();
  const scrollToRef = useRef<null | HTMLDivElement>(null);
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [fullName, setFullName] = useState('');
  const [currStudent] = useState<any>(Util.getCurrentStudent());
  const currentStudentName = currStudent?.name?.trim?.() ?? '';
  const hasExistingStudentName = currentStudentName.length > 0;

  const api = ServiceConfig.getI().apiHandler;
  const containerRef = useRef<HTMLDivElement>(null);
  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return String(error);
  };

  const isNextButtonEnabled = () => {
    let tempInviteCode = urlClassCode.inviteCode
      ? urlClassCode.inviteCode
      : inviteCode;
    return !!tempInviteCode && tempInviteCode.toString().length === 6;
  };

  const getClassData = async () => {
    if (!online) {
      presentToast({
        message: t(`Device is offline. Cannot join a class`),
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
    } else {
      if (!!error) setError('');
      // if (!isNextButtonEnabled()) return;
      setLoading(true);
      try {
        const codeToVerify = urlClassCode.inviteCode || inviteCode;
        const result = await api.getDataByInviteCode(
          parseInt(codeToVerify, 10),
        );
        setCodeResult(result);
        setShowDialogBox(true);
      } catch (error) {
        if (error instanceof Object) {
          logger.error('Error fetching class data:', error);
          const rawMessage = getErrorMessage(error);
          let eMsg: string =
            rawMessage === 'Invalid inviteCode'
              ? t('Invalid code. Please check and Try again.')
              : rawMessage;
          setError(eMsg);
        }
      }
      setLoading(false);
    }
  };

  const waitForJoinSyncToSettle = async () => {
    const pollIntervalMs = 100;
    const settleDurationMs = 400;
    const timeoutMs = 180000;
    const startedAt = Date.now();
    let syncIdleSince: number | null = null;

    while (Date.now() - startedAt < timeoutMs) {
      const syncing = api.isSyncInProgress();

      if (syncing) {
        syncIdleSince = null;
      } else if (syncIdleSince === null) {
        syncIdleSince = Date.now();
      } else if (Date.now() - syncIdleSince >= settleDurationMs) {
        return;
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, pollIntervalMs),
      );
    }

    logger.warn(
      'Join class timed out while waiting for sync to settle. Continuing anyway.',
    );
  };

  const onJoin = async () => {
    // setShowDialogBox(false);
    if (loading || joiningClass) return;
    setJoiningClass(true);

    try {
      const student = Util.getCurrentStudent();

      if (!student || inviteCode.length !== 6) {
        throw new Error('Student or invite code is missing.');
      }
      if (student.name == null || student.name === '') {
        await api.updateStudent(
          student,
          fullName,
          student.age!,
          student.gender!,
          student.avatar!,
          student.image!,
          student.curriculum_id!,
          student.grade_id!,
          student.language_id!,
        );
      }
      await api.linkStudent(parseInt(inviteCode, 10), student.id);
      await waitForJoinSyncToSettle();
      const RESET_ON_JOIN_KEY = `reset_on_join_${student.id}`;
      localStorage.setItem(RESET_ON_JOIN_KEY, 'true');
      if (!!codeResult) {
        Util.subscribeToClassTopic(
          codeResult['class_id'],
          codeResult['school_id'],
        );
        const currClass = await api.getClassById(codeResult['class_id']);
        if (currClass) {
          await schoolUtil.setCurrentClass(currClass);
        } else {
          logger.error('Class data not found.');
          throw new Error('Class data could not be fetched.');
        }
        await api.updateSchoolLastModified(codeResult['school_id']);
        await api.updateClassLastModified(codeResult['class_id']);
        await api.updateUserLastModified(student.id);
      }
      onClassJoin();
      const event = new CustomEvent('JoinClassListner', { detail: 'Joined' });
      window.dispatchEvent(event);
      // history.replace("/");
      // window.location.reload();
    } catch (error) {
      logger.error('Join class failed:', error);
      if (error instanceof Object) setError(getErrorMessage(error));
    } finally {
      setJoiningClass(false);
    }
  };
  const location = useLocation();

  useEffect(() => {
    setFullName(currStudent?.name || '');

    const urlParams = new URLSearchParams(location.search);
    const joinClassParam = urlParams.get('join-class');
    const classCode = urlParams.get('classCode');

    if (classCode && /^\d{1,6}$/.test(classCode)) {
      setInviteCode(classCode);
      urlClassCode.inviteCode = classCode;
      if (classCode.length === 6) {
        getClassData();
      }
    }
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.setScroll({ isDisabled: true });

      const handleKeyboardHide = () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      };

      let showSub: PluginListenerHandle;
      let hideSub: PluginListenerHandle;

      // Use an async IIFE to await the subscriptions
      (async () => {
        hideSub = await Keyboard.addListener(
          'keyboardWillHide',
          handleKeyboardHide,
        );
      })();

      return () => {
        hideSub?.remove();
      };
    }
  }, []);

  useEffect(() => {
    if (inviteCode && inviteCode.length === 6) {
      getClassData();
    }
  }, [inviteCode]);

  const isFormValid =
    !!codeResult &&
    !error &&
    (fullName.trim().length >= 3 || fullName === currentStudentName) &&
    inviteCode?.length === 6;

  return (
    <div className="join-class-parent-container">
      {joiningClass && <Loading isLoading={true} msg="Joining class..." />}
      <div
        className={`assignment-join-class-container-scroll`}
        ref={containerRef}
      >
        <h2>{t('Join a Class by entering the details below')}</h2>
        <div className="join-class-container">
          <InputWithIcons
            label={t('Full Name')}
            placeholder={t('Enter the child’s full name') ?? ''}
            value={fullName}
            setValue={setFullName}
            icon="assets/icons/BusinessCard.svg"
            readOnly={hasExistingStudentName && fullName === currentStudentName}
            statusIcon={
              fullName.length == 0 ? null : fullName &&
                (fullName.trim().length >= 3 ||
                  fullName === currentStudentName) ? (
                <img src="assets/icons/CheckIcon.svg" alt="Status icon" />
              ) : (
                <img src="assets/icons/Vector.svg" alt="Status icon" />
              )
            }
            required={true}
            labelOffsetClass="with-icon-label-offset-small"
          />

          <InputWithIcons
            label={t('Class Code')}
            placeholder={t('Enter the code to join a class') ?? ''}
            value={inviteCode}
            setValue={(val: string) => {
              // Only allow digits to be entered.
              if (/^\d*$/.test(val)) {
                setInviteCode(val);
              }
            }}
            icon="assets/icons/OpenBook.svg"
            type="text"
            maxLength={6}
            statusIcon={
              inviteCode?.length === 6 ? (
                codeResult && !error ? (
                  <img src="assets/icons/CheckIcon.svg" alt="Status icon" />
                ) : error && error !== '' ? (
                  <img src="assets/icons/Vector.svg" alt="Status icon" />
                ) : null
              ) : null
            }
            required={true}
            labelOffsetClass="with-icon-label-offset-small"
          />
        </div>

        <div className="join-class-message">
          {codeResult && !error && error == '' && inviteCode?.length === 6
            ? `${t('School')}: ${codeResult['school_name']}, ${t('Class')}: ${
                codeResult['class_name']
              }`
            : error && inviteCode?.length === 6
              ? error
              : null}
        </div>
        <button
          className="join-class-confirm-button"
          onClick={onJoin}
          disabled={loading || joiningClass || !isFormValid}
        >
          <span className="join-class-confirm-text">{t('Confirm')}</span>
        </button>
      </div>
    </div>
  );
};
export default JoinClass;
