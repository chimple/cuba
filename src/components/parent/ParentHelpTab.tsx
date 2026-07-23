import { t } from 'i18next';
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from 'react-share';
import { FaInstagramSquare } from 'react-icons/fa';
import { TfiWorld } from 'react-icons/tfi';

const ParentHelpTab = () => (
  <div id="parent-page-help">
    <h1 id="parent-page-help-title">{t('Chimple Help Desk')}</h1>
    <div id="parent-page-help-title-container">
      <div id="parent-page-help-title-link">
        <div id="parent-page-help-title-e1">
          <div id="parent-page-help-share-button">
            <EmailShareButton
              url={'help@sutara.org'}
              subject={'Chimple Kids app- Help Desk'}
              body=""
              className="Demo__some-network__share-button"
            >
              {t('Email Us')}
            </EmailShareButton>
            <EmailIcon size={'2vw'} round />
          </div>
          <div
            id="parent-page-help-share-button"
            onClick={() => {
              window.open('https://www.chimple.org/', '_system');
            }}
          >
            {t('Visit Website')}
            <TfiWorld size={'2vw'} />
          </div>
          <div
            id="parent-page-help-share-button"
            onClick={() => {
              let message = 'Hiii !!!!';
              window.open(
                `https://api.whatsapp.com/send?phone=919606018552&text=${message}`,
                '_system',
              );
            }}
          >
            {t('WhatsApp Us')}
            <WhatsappIcon size={'2vw'} round />
          </div>
        </div>
        <div id="parent-page-help-title-e2">
          <div id="help">{t('Help Video')}</div>
          <div id="parent-page-help-title-e2-video">
            <iframe
              id="parent-page-help-title-e2-video-youtude"
              className="embed-responsive-item"
              allowFullScreen={true}
              src="https://www.youtube.com/embed/Ez9oouE2pOE"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            ></iframe>
          </div>
        </div>
        <div id="parent-page-help-title-e3">
          <div
            id="parent-page-help-share-button-e3"
            onClick={() => {
              window.open(`https://api.instagram.com/chimple_learning/`, '_system');
            }}
          >
            {t('Instagram')}
            <FaInstagramSquare size={'2vw'} />
          </div>
          <div
            id="parent-page-help-share-button-e3"
            onClick={() => {
              window.open(`https://www.facebook.com/chimple`, '_system');
            }}
          >
            {t('Facebook')}
            <FacebookIcon size={'2vw'} round />
          </div>
          <div
            id="parent-page-help-share-button-e3"
            onClick={() => {
              window.open(`https://twitter.com/chimple_org`, '_system');
            }}
          >
            {t('Twitter')}
            <TwitterIcon size={'2vw'} round />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ParentHelpTab;
