import EditIcon from '@mui/icons-material/Edit';
import { t } from 'i18next';
import React from 'react';
import { getTrackableProps, TRACKABLE_IDS } from '../../analytics/trackable';
import Header from '../components/homePage/Header';
import ProfileDetails from '../components/library/ProfileDetails';
import UserProfileSection from '../components/UserProfileSection';
import { useUserProfilePage } from '../hooks/useUserProfilePage';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const {
    currentClass,
    currentSchool,
    hasCurrentClass,
    isEditMode,
    isTeacherSchoolMode,
    profilePic,
    fullName,
    email,
    phoneNum,
    language,
    languages,
    setFullName,
    setEmail,
    setPhoneNum,
    handleEditClick,
    handleUpdate,
    handleLanguageChange,
    handleProfilePicChange,
    onBackButtonClick,
  } = useUserProfilePage();
  const placeholderImgBase64 = 'data:image/png;base64,....';

  if (!hasCurrentClass) return null;

  return (
    <div className="main-page">
      <Header
        isBackButton={true}
        showClass={true}
        showSchool={true}
        className={currentClass?.name}
        schoolName={currentSchool?.name}
        onBackButtonClick={onBackButtonClick}
      />
      <div className="profile-details-container">
        <ProfileDetails
          imgSrc={profilePic || placeholderImgBase64}
          imgAlt="Profile Pic"
          onImageChange={handleProfilePicChange}
          isEditMode={isEditMode}
          trackableId={
            isEditMode ? TRACKABLE_IDS.TEACHER_PROFILE_IMAGE_SELECT : undefined
          }
        />
      </div>
      <div className="profile-info">
        <div className="login-user-name">{fullName}</div>
        {!isEditMode && !isTeacherSchoolMode && (
          <EditIcon
            aria-label={String(t('Edit'))}
            id={TRACKABLE_IDS.TEACHER_PROFILE_EDIT_BUTTON}
            {...getTrackableProps(TRACKABLE_IDS.TEACHER_PROFILE_EDIT_BUTTON)}
            className="edit-icon teacher_profile_edit_button"
            onClick={handleEditClick}
          />
        )}
      </div>
      <UserProfileSection
        languageOptions={languages}
        fullName={fullName}
        email={email}
        phoneNum={phoneNum}
        language={language}
        onFullNameChange={setFullName}
        onEmailChange={setEmail}
        onPhoneNumChange={setPhoneNum}
        onLanguageChange={handleLanguageChange}
        isEditMode={isEditMode}
      />
      {isEditMode && (
        <div className="form-actions">
          <button
            id={TRACKABLE_IDS.TEACHER_PROFILE_UPDATE_BUTTON}
            {...getTrackableProps(TRACKABLE_IDS.TEACHER_PROFILE_UPDATE_BUTTON)}
            className="update-button teacher_profile_update_button"
            type="button"
            onClick={handleUpdate}
          >
            {t('Update')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
