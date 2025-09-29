import { IonPage } from '@ionic/react'
import React from 'react'
import Header from '../components/homePage/Header'
import { t } from 'i18next';
import './PostSuccess.css';
import { PAGES } from '../../common/constants';
import { useHistory } from 'react-router';

function PostSuccess() {

  const history = useHistory();

  const onBackButtonClick = () => {
    history.replace(PAGES.DISPLAY_STUDENT);
  }

  return (
    <IonPage className="edit-school-page">
      <Header isBackButton={true}
        onBackButtonClick={onBackButtonClick}
      />
      <div className="edit-school-confirm-page">
        <div className="edit-school-confirm-message">
          <p className="edit-school-sent-request-header">
            {t("Your request has been sent successfully")}
          </p>
          <p>
            {t("After a short while kindly check to access your school")}
          </p>
        </div>
        <div className="edit-school-request-box">
          <a href="https://www.bit.ly/chimple-help-line" target="_blank" style={{ textDecoration: "none" }}>
            <div className="edit-school-create-school-whatsapp-support">
              <div className="edit-school-whatsapp-support-icon">
                <img src="assets/icons/whatsapp.svg" alt="whatsapp" width="25" />
              </div>
              <div className="edit-school-create-school-whatsapp-support-text">
                <p>{t("Chat with us on ")}</p><p className="edit-school-span-text-whatsapp">{t("WhatsApp")}</p>
              </div>
            </div>
          </a>
          <div className="edit-school-create-school-youtube-div">
            <iframe src="https://www.youtube.com/embed/G_OW3hNtZ3o?si=U5jhUwks05doZ_2R" width={"70%"} height={"315px"} title="YouTube video player" allowFullScreen className="edit-school-create-school-youtube-video"></iframe>
            <p className="edit-school-create-school-youtube-subtext">
              {t("Take a look at our Teacher's App")}
            </p>
          </div>
        </div>
        <hr className="edit-school-divider" />
        <div className="edit-school-create-school-confirm-subtext">
          <p>
            {t("Click below to explore Chimple App")}
          </p>
        </div>
        <div className="edit-school-create-school-app-links">
          <a
            href="https://youtu.be/G_OW3hNtZ3o?si=Txs7SMRDbjbhb4nq"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <div
              className="edit-school-app-card"
            >
              <div className="edit-school-card-content">
                <span className="edit-school-create-school-app-subtext">
                  {t("Fun filled activities for children")}
                </span>
                <div className="edit-school-create-school-card-content-div">
                  <img className="edit-school-card-content-img" src="assets/icons/switchToKidsMode.png" alt="" />
                  <p className="edit-school-create-school-img-footer">{t("Gamified Learning")}</p>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>

    </IonPage>
  )
}

export default PostSuccess