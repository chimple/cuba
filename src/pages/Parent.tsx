import './Parent.css';
import { Box } from '@mui/material';
import CustomAppBar from '../components/studentProgress/CustomAppBar';
import TeacherAuthenticationPopup from '../components/parent/TeacherAuthenticationPopup';
import ParentFaqTab from '../components/parent/ParentFaqTab';
import ParentHelpTab from '../components/parent/ParentHelpTab';
import ParentProfileTab from '../components/parent/ParentProfileTab';
import ParentSettingsTab from '../components/parent/ParentSettingsTab';
import { TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS } from '../common/constants';
import { useParentPage } from '../hooks/useParentPage';

const Parent: React.FC = () => {
  const parent = useParentPage();

  return (
    <Box className="parent-page-shell">
      <div className="parent-page-main">
        <CustomAppBar
          tabs={parent.tabs}
          value={parent.tabIndex}
          onChange={parent.handleChange}
          handleBackButton={parent.handleBackButton}
          customStyle={true}
        />
        <div
          className={`parent-page-scroll-content${
            parent.isLanguageMenuOpen ? ' parent-page-scroll-content--locked' : ''
          }`}
        >
          {parent.tabIndex === 'profile' && (
            <div>
              <ParentProfileTab
                setReloadProfiles={parent.setReloadProfiles}
                studentMode={parent.studentMode}
                userProfile={parent.userProfile}
              />
            </div>
          )}
          {parent.tabIndex === 'settings' && (
            <div>
              <ParentSettingsTab
                currentAppLang={parent.currentAppLang}
                currentUser={parent.currentUser}
                handleDeleteAccount={parent.handleDeleteAccount}
                handleLanguageSelect={parent.handleLanguageSelect}
                handleMusicToggle={parent.handleMusicToggle}
                handleSignOut={parent.handleSignOut}
                handleSoundToggle={parent.handleSoundToggle}
                handleTeachersAppClick={parent.handleTeachersAppClick}
                handleTermsClick={parent.handleTermsClick}
                isLanguageMenuOpen={parent.isLanguageMenuOpen}
                langList={parent.langList}
                languageDropdownRef={parent.languageDropdownRef}
                musicFlag={parent.musicFlag}
                setIsLanguageMenuOpen={parent.setIsLanguageMenuOpen}
                setShowDeleteAccountDialog={parent.setShowDeleteAccountDialog}
                setShowSignOutDialog={parent.setShowSignOutDialog}
                showDeleteAccountDialog={parent.showDeleteAccountDialog}
                showSignOutDialog={parent.showSignOutDialog}
                soundFlag={parent.soundFlag}
              />
            </div>
          )}
          {parent.tabIndex === 'help' && (
            <div>
              <ParentHelpTab />
            </div>
          )}
          {parent.tabIndex === 'faq' && (
            <div>
              <ParentFaqTab />
            </div>
          )}
          <TeacherAuthenticationPopup
            isOpen={parent.isTeacherAuthPopupOpen}
            sourceEntryPoint={
              TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS.PARENT_SETTINGS_TAB
            }
            onClose={() => parent.setIsTeacherAuthPopupOpen(false)}
            onAuthenticated={() => {
              parent.setIsTeacherAuthPopupOpen(false);
              parent.switchToTeacherMode();
            }}
          />
        </div>
      </div>
    </Box>
  );
};

export default Parent;
