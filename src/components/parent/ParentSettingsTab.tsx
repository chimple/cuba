import { RefObject } from 'react';
import { t } from 'i18next';
import { TableTypes } from '../../common/constants';
import DialogBoxButtons from './DialogBoxButtons';

type ParentSettingsTabProps = {
  currentAppLang?: string;
  currentUser?: TableTypes<'user'>;
  handleDeleteAccount: () => Promise<void>;
  handleLanguageSelect: (selectedLangDocId: string) => Promise<void>;
  handleMusicToggle: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  handleSoundToggle: () => Promise<void>;
  handleTeachersAppClick: () => Promise<void>;
  handleTermsClick: () => void;
  isLanguageMenuOpen: boolean;
  langList: { id: string; displayName: string }[];
  languageDropdownRef: RefObject<HTMLDivElement | null>;
  musicFlag?: number;
  setIsLanguageMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDeleteAccountDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSignOutDialog: React.Dispatch<React.SetStateAction<boolean>>;
  showDeleteAccountDialog: boolean;
  showSignOutDialog: boolean;
  soundFlag?: number;
};

const ParentSettingsTab = ({
  currentAppLang,
  handleDeleteAccount,
  handleLanguageSelect,
  handleMusicToggle,
  handleSignOut,
  handleSoundToggle,
  handleTeachersAppClick,
  handleTermsClick,
  isLanguageMenuOpen,
  langList,
  languageDropdownRef,
  musicFlag,
  setIsLanguageMenuOpen,
  setShowDeleteAccountDialog,
  setShowSignOutDialog,
  showDeleteAccountDialog,
  showSignOutDialog,
  soundFlag,
}: ParentSettingsTabProps) => {
  const soundEnabled = soundFlag === 0;
  const musicEnabled = musicFlag === 0;
  const selectedLanguage =
    langList.find((lang) => lang.id === currentAppLang)?.displayName ?? '';

  return (
    <div className="parent-settings-layout">
      <div className="parent-settings-top-grid">
        <section className="parent-settings-card parent-settings-application-card">
          <h2 className="parent-settings-card-title">{t('Application')}</h2>

          <div className="parent-settings-application-content">
            <div className="parent-settings-language-block">
              <label
                htmlFor="parent-language-select"
                className="parent-settings-field-label"
              >
                {t("Parent's Language")}
              </label>
              <div
                ref={languageDropdownRef}
                className={`parent-settings-language-dropdown${
                  isLanguageMenuOpen ? ' is-open' : ''
                }`}
              >
                <button
                  id="parent-language-select"
                  type="button"
                  className="parent-settings-language-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={isLanguageMenuOpen}
                  onClick={() =>
                    setIsLanguageMenuOpen((previousState) => !previousState)
                  }
                >
                  <span className="parent-settings-language-trigger-label">
                    {selectedLanguage}
                  </span>
                  <span
                    className="parent-settings-language-trigger-arrow"
                    aria-hidden="true"
                  />
                </button>

                {isLanguageMenuOpen && (
                  <div
                    className="parent-settings-language-menu"
                    role="listbox"
                    aria-labelledby="parent-language-select"
                  >
                    {langList.map((option) => {
                      const isSelected = option.id === currentAppLang;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`parent-settings-language-option${
                            isSelected ? ' is-selected' : ''
                          }`}
                          onClick={() => handleLanguageSelect(option.id)}
                        >
                          {option.displayName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="parent-settings-toggle-column">
              <SettingsToggle
                enabled={soundEnabled}
                label="Sound"
                onClick={handleSoundToggle}
              />
              <SettingsToggle
                enabled={musicEnabled}
                label="Music"
                onClick={handleMusicToggle}
              />
            </div>
          </div>
        </section>

        <section className="parent-settings-card parent-settings-teachers-card">
          <h2 className="parent-settings-card-title">{t('For Teachers')}</h2>
          <button
            type="button"
            className="parent-settings-teachers-button"
            onClick={handleTeachersAppClick}
          >
            <img
              src="/assets/icons/teacherAppIcon.svg"
              alt=""
              aria-hidden="true"
              className="parent-settings-teachers-button-icon"
            />
            <span>{t('Teachers App')}</span>
          </button>
        </section>
      </div>

      <section className="parent-settings-card parent-settings-account-card">
        <h2 className="parent-settings-card-title">{t('Account')}</h2>
        <div className="parent-settings-account-actions">
          <button
            type="button"
            className="parent-settings-account-button parent-settings-account-button--terms"
            onClick={handleTermsClick}
          >
            <img
              src="/assets/icons/tAndCIcon.svg"
              alt=""
              aria-hidden="true"
              className="parent-settings-account-button-icon"
            />
            <span>{t('Terms & Conditions')}</span>
          </button>

          <button
            type="button"
            className="parent-settings-account-button parent-settings-account-button--signout"
            onClick={() => setShowSignOutDialog(true)}
          >
            <img
              src="/assets/icons/signOut.svg"
              alt=""
              aria-hidden="true"
              className="parent-settings-account-button-icon"
            />
            <span>{t('Sign out')}</span>
          </button>

          <button
            type="button"
            className="parent-settings-account-button parent-settings-account-button--delete"
            onClick={() => setShowDeleteAccountDialog(true)}
          >
            <img
              src="/assets/icons/deleteAccountIcon.svg"
              alt=""
              aria-hidden="true"
              className="parent-settings-account-button-icon"
            />
            <span>{t('Delete Account')}</span>
          </button>
        </div>

        <DialogBoxButtons
          width={'40vw'}
          height={'30vh'}
          message={t('Do you want to sign out')}
          showDialogBox={showSignOutDialog}
          yesText={t('Cancel')}
          noText={t('Sign Out')}
          handleClose={() => {
            setShowSignOutDialog(false);
          }}
          onYesButtonClicked={() => {
            setShowSignOutDialog(false);
          }}
          onNoButtonClicked={async () => {
            setShowSignOutDialog(false);
            await handleSignOut();
          }}
        />

        <DialogBoxButtons
          width={'40vw'}
          height={'30vh'}
          message={t("Do you want to delete the parent's account?")}
          showDialogBox={showDeleteAccountDialog}
          yesText={t('Cancel')}
          noText={t('Delete')}
          handleClose={() => {
            setShowDeleteAccountDialog(false);
          }}
          onYesButtonClicked={() => {
            setShowDeleteAccountDialog(false);
          }}
          onNoButtonClicked={async () => {
            setShowDeleteAccountDialog(false);
            await handleDeleteAccount();
          }}
        />
      </section>
    </div>
  );
};

const SettingsToggle = ({
  enabled,
  label,
  onClick,
}: {
  enabled: boolean;
  label: string;
  onClick: () => void;
}) => (
  <div className="parent-settings-toggle-group">
    <p className="parent-settings-toggle-title">{t(label)}</p>
    <div className="parent-settings-toggle-row">
      <span className="parent-settings-toggle-state">{t('OFF')}</span>
      <button
        type="button"
        className={`parent-settings-switch${enabled ? ' is-on' : ''}`}
        onClick={onClick}
        aria-label={String(t(label))}
        aria-pressed={enabled}
      >
        <span className="parent-settings-switch-thumb" />
      </button>
      <span className="parent-settings-toggle-state">{t('ON')}</span>
    </div>
  </div>
);

export default ParentSettingsTab;
