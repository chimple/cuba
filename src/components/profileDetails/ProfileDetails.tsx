import './ProfileDetails.css';
import { useProfileDetails } from '../../hooks/useProfileDetails';

const ProfileDetails = () => {
  const {
    AGE_OPTIONS,
    AVATARS,
    GENDER,
    InputWithIcons,
    Loading,
    PAGES,
    SelectWithIcons,
    Util,
    age,
    avatar,
    className,
    currentStudent,
    fullName,
    gender,
    handleSave,
    handleSkip,
    history,
    isCreatingProfile,
    isEdit,
    isSaveEnabled,
    labelRef,
    languageId,
    languages,
    logProfileClick,
    logger,
    parentHasStudent,
    profileRef,
    schoolName,
    setAge,
    setFullName,
    setGender,
    setLanguageId,
    shouldShowSkip,
    t,
  } = useProfileDetails();

  return (
    <div
      ref={profileRef}
      className="profiledetails-container"
      onClick={(e) => {
        logProfileClick(e).catch((err) =>
          logger.error('Error in logProfileClick', err),
        );
      }}
    >
      {parentHasStudent && (
        <button
          className="profiledetails-back-button"
          onClick={() => {
            const state = history.location.state as any;
            const tmpPath = state?.from ?? PAGES.HOME;
            if (tmpPath === PAGES.HOME) {
              if (currentStudent)
                Util.setCurrentStudent(currentStudent, undefined, false, true);
            }
            Util.setPathToBackButton(tmpPath, history);
          }}
          aria-label="Back"
          id="click_on_profile_details_back_button"
        >
          <img src="/assets/icons/BackButtonIcon.svg" alt="BackButtonIcon" />
        </button>
      )}
      <div className="profiledetails-avatar-form">
        <div className="profiledetails-avatar-section">
          <img
            src={'assets/avatars/' + (avatar ?? AVATARS[0]) + '.png'}
            className="profiledetails-avatar-image"
          />
        </div>

        <div className="profiledetails-form-fields">
          {/* Header Info: Class Name | School Name */}
          {isEdit && (className || schoolName) && (
            <div className="profiledetails-header-info">
              {className && (
                <div className="pd-info-item">
                  <img
                    src="/assets/icons/classIcon.svg"
                    alt="class"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span>{className}</span>
                </div>
              )}
              {className && schoolName && <span className="pd-divider">|</span>}
              {schoolName && (
                <div className="pd-info-item">
                  <img
                    src="/assets/icons/scholarIcon.svg"
                    alt="school"
                    className="profiledetails-info-icon"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span>{schoolName}</span>
                </div>
              )}
            </div>
          )}

          {/* {mode !== FORM_MODES.ALL_OPTIONAL && (
            <div className="profiledetails-required-indicator">
              {`* ${t("Indicates Required Information")}`}
            </div>
          )} */}

          <div className="profiledetails-full-name">
            <InputWithIcons
              id="click_on_profile_details_full_name"
              label={t('Full Name')}
              placeholder={t('Name Surname')}
              value={fullName ?? ''}
              setValue={setFullName}
              icon="/assets/icons/BusinessCard.svg"
              // required={
              //   mode === FORM_MODES.ALL_REQUIRED ||
              //   mode === FORM_MODES.NAME_REQUIRED
              // }
            />
          </div>

          <div className="profiledetails-row-group">
            <div className="profiledetails-flex-item">
              <SelectWithIcons
                id="click_on_profile_details_age"
                label={t('Age')}
                value={age?.toString() ?? ''}
                setValue={(age) => setAge(parseInt(age))}
                icon="/assets/icons/age.svg"
                optionId={`click_on_profile_details_age_option_${age}`}
                options={[
                  {
                    value: AGE_OPTIONS.LESS_THAN_EQUAL_4,
                    label: `=${t('4 years')}`,
                  },
                  { value: AGE_OPTIONS.FIVE, label: t('5 years') },
                  { value: AGE_OPTIONS.SIX, label: t('6 years') },
                  { value: AGE_OPTIONS.SEVEN, label: t('7 years') },
                  { value: AGE_OPTIONS.EIGHT, label: t('8 years') },
                  { value: AGE_OPTIONS.NINE, label: t('9 years') },
                  {
                    value: AGE_OPTIONS.GREATER_THAN_EQUAL_10,
                    label: `=${t('10 years')}`,
                  },
                ]}
                // required={mode === FORM_MODES.ALL_REQUIRED}
              />
            </div>

            <div className="profiledetails-flex-item">
              <SelectWithIcons
                id="click_on_profile_details_language"
                label={t('Language')}
                value={languageId}
                setValue={setLanguageId}
                icon="/assets/icons/language.svg"
                optionId={
                  `click_on_profile_details_language_option_` +
                  (languageId || '')
                }
                options={languages.map((lang) => ({
                  value: lang.id,
                  label: lang.name,
                }))}
                // required={mode === FORM_MODES.ALL_REQUIRED}
              />
            </div>
          </div>

          <fieldset className="profiledetails-form-group profiledetails-gender-fieldset">
            <legend className="profiledetails-gender-label">
              <div className="profiledetails-gender-label-text" ref={labelRef}>
                {t('Gender')}
                {/* {mode === FORM_MODES.ALL_REQUIRED && (
                  <span className="profiledetails-required">*</span>
                )} */}
              </div>
            </legend>
            <div className="profiledetails-gender-buttons">
              {[
                { label: t('GIRL'), value: GENDER.GIRL, name: 'GIRL' },
                { label: t('BOY'), value: GENDER.BOY, name: 'BOY' },
                {
                  label: t('UNSPECIFIED'),
                  value: GENDER.OTHER,
                  name: 'UNSPECIFIED',
                },
              ].map(({ label, value, name }) => {
                const isSelected = gender === value;
                const iconName = isSelected
                  ? `${name.toLowerCase()}Selected`
                  : name.toLowerCase();

                return (
                  <button
                    key={label}
                    id={`click_on_profile_details_gender_${label.toLowerCase()}`}
                    type="button"
                    className={`profiledetails-gender-btn ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => setGender(value)}
                  >
                    <img
                      src={`/assets/icons/${iconName}.svg`}
                      alt={`${label} icon`}
                    />
                    {t(label)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="profiledetails-button-group">
            {shouldShowSkip && (
              <button
                id="click_on_profile_details_skip"
                className="profiledetails-skip-button"
                onClick={handleSkip}
              >
                {t('SKIP FOR NOW')}
              </button>
            )}
            <button
              id="click_on_profile_details_save"
              className="profiledetails-save-button"
              disabled={!isSaveEnabled || isCreatingProfile}
              onClick={handleSave}
            >
              {t('SAVE')}
            </button>
          </div>
        </div>
      </div>
      <Loading isLoading={isCreatingProfile} />
    </div>
  );
};

export default ProfileDetails;