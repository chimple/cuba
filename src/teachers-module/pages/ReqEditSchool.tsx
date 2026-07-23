import { useReqEditSchool } from '../hooks/useReqEditSchool';
import './EditSchool.css';

const ReqEditSchool = () => {
  const viewProps = useReqEditSchool();

  const {
    Box,
    EditSchoolSection,
    Header,
    IonButton,
    IonPage,
    ProfileDetails,
    URL,
    handleCityChange,
    handleDistrictChange,
    handleNameChange,
    handleProfilePicChange,
    handleSendRequest,
    handleStateChange,
    handleUDISE_IDChange,
    isButtonDisabled,
    isEditMode,
    isRequestSent,
    isSaving,
    onBackButtonClick,
    prevOrigin,
    profilePic,
    school,
    schoolData,
    t,
  } = viewProps;

  return (
    <IonPage className="edit-school-page">
      <Header
        isBackButton={true}
        onBackButtonClick={onBackButtonClick}
        disableBackButton={isSaving ? true : false}
      />
      {isRequestSent === true && !isSaving ? (
        // **SUCCESS SCREEN**
        <div className="edit-school-confirm-page">
          <div className="edit-school-confirm-message">
            <p className="edit-school-sent-request-header">
              {t('Your request has been sent successfully')}
            </p>
            <p>{t('After a short while kindly check to access your school')}</p>
          </div>
          <div className="edit-school-request-box">
            <a
              href="https://www.bit.ly/chimple-help-line"
              target="_blank"
              style={{ textDecoration: 'none' }}
              rel="norererrer"
            >
              <div className="edit-school-create-school-whatsapp-support">
                <div className="edit-school-whatsapp-support-icon">
                  <img
                    src="assets/icons/whatsapp.svg"
                    alt="whatsapp"
                    width="25"
                  />
                </div>
                <div className="edit-school-create-school-whatsapp-support-text">
                  <p>{t('Chat with us on ')}</p>
                  <p className="edit-school-span-text-whatsapp">
                    {t('WhatsApp')}
                  </p>
                </div>
              </div>
            </a>
            <div className="edit-school-create-school-youtube-div">
              <iframe
                src="https://www.youtube.com/embed/G_OW3hNtZ3o?si=U5jhUwks05doZ_2R"
                width={'70%'}
                height={'315px'}
                title="YouTube video player"
                allowFullScreen
                className="edit-school-create-school-youtube-video"
              ></iframe>
              <p className="edit-school-create-school-youtube-subtext">
                {t("Take a look at our Teacher's App")}
              </p>
            </div>
          </div>
          <hr className="edit-school-divider" />
          <div className="edit-school-create-school-confirm-subtext">
            <p>{t('Click below to explore Chimple App')}</p>
          </div>
          <div className="edit-school-create-school-app-links">
            <a
              href="https://youtu.be/G_OW3hNtZ3o?si=Txs7SMRDbjbhb4nq"
              target="_blank"
              rel="noopener norererrer"
              style={{ textDecoration: 'none' }}
            >
              <div className="edit-school-app-card">
                <div className="edit-school-card-content">
                  <span className="edit-school-create-school-app-subtext">
                    {t('Fun rilled activities for children')}
                  </span>
                  <div className="edit-school-create-school-card-content-div">
                    <img
                      className="edit-school-card-content-img"
                      src="assets/icons/switchToKidsMode.png"
                      alt=""
                    />
                    <p className="edit-school-create-school-img-rooter">
                      {t('Gamiried Learning')}
                    </p>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      ) : (
        // **FORM SCREEN**
        <>
          {!isEditMode && (
            <div className="edit-school-noSchool-text">
              <p>
                {prevOrigin == '/display-schools' &&
                  t('Your profile is not registered to any school.')}
                {t('Send Request to Chimple to add your school.')}
              </p>
              <hr className="edit-school-divider" />
            </div>
          )}
          <div className="edit-school-text-div">
            {isEditMode ? t('Edit School') : t('Add School')}
          </div>
          <div className="edit-school-single-container">
            <div className="profile-image">
              <ProfileDetails
                imgSrc={
                  profilePic
                    ? URL.createObjectURL(profilePic)
                    : school?.image || ''
                }
                imgAlt="Profile Pic"
                onImageChange={handleProfilePicChange}
                isEditMode={true}
              />
            </div>
            {/* <div className="edit-school-text">{schoolData.name}</div> */}
            <div className="edit-school-content">
              <Box className="edit-school-div">
                <EditSchoolSection
                  name={schoolData.name}
                  state={schoolData.state}
                  district={schoolData.district}
                  city={schoolData.city}
                  UDISE_ID={schoolData.UDISE_ID}
                  onNameChange={handleNameChange}
                  onStateChange={handleStateChange}
                  onDistrictChange={handleDistrictChange}
                  onCityChange={handleCityChange}
                  onUDISE_IDChange={handleUDISE_IDChange}
                />
                <div className="edit-school-button-container">
                  <IonButton
                    color="#7C5DB0"
                    onClick={handleSendRequest}
                    className="edit-school-update-button"
                    disabled={isButtonDisabled || isSaving}
                  >
                    {isSaving ? t('Saving') + '...' : t('Send Request')}
                  </IonButton>
                </div>
              </Box>
            </div>
          </div>
        </>
      )}
    </IonPage>
  );
};

export default ReqEditSchool;
