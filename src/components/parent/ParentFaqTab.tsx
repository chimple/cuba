import { t } from 'i18next';
import { TfiWorld } from 'react-icons/tfi';

const ParentFaqTab = () => (
  <div
    id="faq-page"
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
