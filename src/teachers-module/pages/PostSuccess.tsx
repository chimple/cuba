import { IonPage } from '@ionic/react';
import React, { useEffect } from 'react';
import Header from '../components/homePage/Header';
import { t } from 'i18next';
import './PostSuccess.css';
import { PAGES, MODES } from '../../common/constants';
import { useHistory } from 'react-router';
import { schoolUtil } from '../../utility/schoolUtil';
import { ServiceConfig } from '../../services/ServiceConfig';
import { STATUS } from '../../common/constants';

const PostSuccess: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    const redirectIfActiveSchoolExists = async () => {
      const currentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();
      if (!currentUser) return;

      const existingRequest =
        await ServiceConfig.getI().apiHandler.getExistingSchoolRequest(
          currentUser.id,
        );

      const activeSchools =
        await ServiceConfig.getI().apiHandler.getSchoolsForUser(
          currentUser.id,
          {
            page: 1,
            page_size: 20,
          },
        );

      if (activeSchools.length === 0) {
        if (existingRequest?.request_status === STATUS.REQUESTED) {
          return;
        }

        history.replace(PAGES.SEARCH_SCHOOL);
        return;
      }

      history.replace(PAGES.DISPLAY_SCHOOLS);
    };

    void redirectIfActiveSchoolExists();
  }, [history]);

  const onBackButtonClick = () => {
    schoolUtil.setCurrMode(MODES.PARENT);
    history.replace(PAGES.DISPLAY_STUDENT);
  };

  return (
    <IonPage className="post-success-page">
      <Header isBackButton={true} onBackButtonClick={onBackButtonClick} />
      <div className="post-success-confirm-page">
        <div className="post-success-confirm-message">
          <p className="post-success-sent-request-header">
            {t('Your request has been sent successfully')}
          </p>
          <p>{t('After a short while kindly check to access your school')}</p>
        </div>
        <div className="post-success-request-box">
          <a
            href="https://wa.me/919606018552"
            target="_blank"
            style={{ textDecoration: 'none' }}
            rel="noreferrer"
          >
            <div className="post-success-create-school-whatsapp-support">
              <div className="post-success-whatsapp-support-icon">
                <img
                  src="assets/icons/whatsapp.svg"
                  alt="whatsapp"
                  width="25"
                />
              </div>
              <div className="post-success-create-school-whatsapp-support-text">
                <p>{t('Chat with us on ')}</p>
                <p className="post-success-span-text-whatsapp">
                  {t('WhatsApp')}
                </p>
              </div>
            </div>
          </a>
          <div className="post-success-create-school-youtube-div">
            <iframe
              src="https://www.youtube.com/embed/G_OW3hNtZ3o?si=U5jhUwks05doZ_2R"
              width={'70%'}
              height={'315px'}
              title="YouTube video player"
              allowFullScreen
              className="post-success-create-school-youtube-video"
            ></iframe>
            <p className="post-success-create-school-youtube-subtext">
              {t("Take a look at our Teacher's App")}
            </p>
          </div>
        </div>
        <hr className="post-success-divider" />
        <div className="post-success-create-school-confirm-subtext">
          <p>{t('Click below to explore Chimple App')}</p>
        </div>
        <div className="post-success-create-school-app-links">
          <div
            className="post-success-app-card"
            onClick={onBackButtonClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === 'Enter' || e.key === ' ') && onBackButtonClick()
            }
            style={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            <div className="post-success-card-content">
              <span className="post-success-create-school-app-subtext">
                {t('Fun filled activities for children')}
              </span>
              <div className="post-success-create-school-card-content-div">
                <img
                  className="post-success-card-content-img"
                  src="assets/icons/switchToKidsMode.png"
                  alt=""
                />
                <p className="post-success-create-school-img-footer">
                  {t('Gamified Learning')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IonPage>
  );
};

export default PostSuccess;
