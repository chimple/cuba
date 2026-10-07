import { t } from 'i18next';
import { TfiWorld } from 'react-icons/tfi';
import { TRACKABLE_IDS, getTrackableProps } from '../../analytics/trackable';

const ParentFaqTab = () => (
  <div
    id="faq-page"
    {...getTrackableProps(TRACKABLE_IDS.OPEN_FAQ_WEBSITE)}
    onClick={() => {
      window.open(
        'https://www.chimple.org/in-school-guide-for-teachers',
        '_system',
      );
    }}
  >
    <p>{t('Please Visit Our Website')}</p>
    <TfiWorld size={'3vw'} />
  </div>
);

export default ParentFaqTab;
