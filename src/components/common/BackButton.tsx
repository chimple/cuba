import { useEffect, useRef } from 'react';
import './BackButton.css';
import { IoIosArrowBack } from 'react-icons/io';
import { registerBackButtonHandler } from '../../common/backButtonRegistry';
import { t } from 'i18next';
import {
  getTrackableProps,
  TRACKABLE_IDS,
  type TrackableId,
} from '../../analytics/trackable';

const BackButton: React.FC<{
  onClicked: any;
  trackableId?: TrackableId;
}> = ({ onClicked, trackableId }) => {
  const onClickedRef = useRef(onClicked);

  useEffect(() => {
    onClickedRef.current = onClicked;
  }, [onClicked]);

  useEffect(() => {
    const unregister = registerBackButtonHandler(() => {
      const handled = onClickedRef.current?.();
      return handled === undefined ? true : handled;
    });
    return unregister;
  }, []);

  return (
    <IoIosArrowBack
      id={TRACKABLE_IDS.COMMON_BACK_BUTTON}
      className="common-back-button"
      aria-label={String(t('Back'))}
      onClick={onClicked}
      {...getTrackableProps(trackableId ?? TRACKABLE_IDS.COMMON_BACK_BUTTON)}
    ></IoIosArrowBack>
  );
};
export default BackButton;
