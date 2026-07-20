import { useEffect, useRef, useState } from 'react';
import './Parent.css';
import {
  CLASS,
  CURRENT_MODE,
  DEFAULT_LANGUAGE_ID_EN,
  EDIT_STUDENTS_MAP,
  LANGUAGE,
  MAX_STUDENTS_ALLOWED,
  MODES,
  PAGES,
  PARENTHEADERLIST,
  SCHOOL,
  SCHOOL_LOGIN,
  TableTypes,
  TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS,
} from '../common/constants';
import ProfileCard from '../components/parent/ProfileCard';

import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from 'react-share';
import { FaInstagramSquare } from 'react-icons/fa';
import { t } from 'i18next';
import { TfiWorld } from 'react-icons/tfi';
import i18n from '../i18n';
import { ServiceConfig } from '../services/ServiceConfig';
import { Box } from '@mui/material';
import { useHistory, useLocation } from 'react-router-dom';
import CustomAppBar from '../components/studentProgress/CustomAppBar';
import { Util } from '../utility/util';
import { getAppPathname } from '../utility/routerLocation';
import { schoolUtil } from '../utility/schoolUtil';
import { RoleType } from '../interface/modelInterfaces';
import { setUser } from '../redux/slices/auth/authSlice';
import { useAppDispatch } from '../redux/hooks';
import TeacherAuthenticationPopup from '../components/parent/TeacherAuthenticationPopup';
import {
  requireTeacherModeAuth,
  TeacherModeAuthResult,
} from '../services/TeacherModeAuth';
import DialogBoxButtons from '../components/parent/DialogBoxButtons';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { ClearCacheData } from '../components/parent/DataClear';
import { logAuthDebug } from '../utility/authDebug';

const parentHeaderIconList = [
  { header: 'profile', displayName: 'Profile' },
  { header: 'settings', displayName: 'Settings' },
  { header: 'help', displayName: 'Help' },
  { header: 'faq', displayName: 'FAQ' },
] as const;

const DEFAULT_PARENT_TAB = parentHeaderIconList[0].header;

const Parent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentHeader, setCurrentHeader] = useState<any>(undefined);
  const [soundFlag, setSoundFlag] = useState<number>();
  const [musicFlag, setMusicFlag] = useState<number>();
  const [userProfile, setUserProfile] = useState<TableTypes<'user'>[]>([]);
  const location = useLocation<{ activeTab?: string }>();
  const [tabIndex, setTabIndex] = useState<string>(DEFAULT_PARENT_TAB);
  const dispatch = useAppDispatch();

  const [langList, setLangList] = useState<
    {
      id: string;
      displayName: string;
    }[]
  >([]);
  const [langDocIds, setLangDocIds] = useState<Map<string, string>>(new Map());
  const [currentAppLang, setCurrentAppLang] = useState<string>();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  const [reloadProfiles, setReloadProfiles] = useState<boolean>(false);
  const [studentMode, setStudentMode] = useState<string | undefined>();
  const [currentUser, setCurrentUser] = useState<
    TableTypes<'user'> | undefined
  >();
  const [isTeacherAuthPopupOpen, setIsTeacherAuthPopupOpen] = useState(false);
  const [schools, setSchools] = useState<
    {
      school: TableTypes<'school'>;
      role: RoleType;
    }[]
  >();
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);
  let tempLangList: {
    id: string;
    displayName: string;
  }[] = [];

  const localAppLang = localStorage.getItem(LANGUAGE);
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const [tabs, setTabs] = useState({});
  const localSchool = JSON.parse(localStorage.getItem(SCHOOL)!);
  const localClass = JSON.parse(localStorage.getItem(CLASS)!);

  const normalizeTabValue = (value?: string) => {
    if (!value) {
      return DEFAULT_PARENT_TAB;
    }

    const matchedTab = parentHeaderIconList.find(
      (item) => item.header === value || t(item.header) === value,
    );

    return matchedTab?.header ?? DEFAULT_PARENT_TAB;
  };

  const switchToTeacherMode = () => {
    schoolUtil.setCurrMode(MODES.TEACHER);
    history.replace(PAGES.DISPLAY_SCHOOLS);
  };

  useEffect(() => {
    setIsLoading(true);
    setCurrentHeader(PARENTHEADERLIST.PROFILE);
    setTabIndex(normalizeTabValue(location.state?.activeTab));
    init();
    getStudentProfile();
  }, [reloadProfiles, location]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  async function getStudentProfile() {
    const userProfilePromise: TableTypes<'user'>[] =
      await ServiceConfig.getI().apiHandler.getParentStudentProfiles();
    let finalUser: any[] = [];
    const storedMapStr = sessionStorage.getItem(EDIT_STUDENTS_MAP);
    const mergedStudents = Util.mergeStudentsByUpdatedAt(
      userProfilePromise,
      storedMapStr,
    );
    for (let i = 0; i < MAX_STUDENTS_ALLOWED; i++) {
      finalUser.push(mergedStudents[i]);
    }
    setUserProfile(finalUser);
  }
  async function init(): Promise<void> {
    const parentUser = await ServiceConfig.getI().authHandler.getCurrentUser();
    if (parentUser) {
      setCurrentUser(parentUser);
      const schools = await api.getSchoolsForUser(parentUser.id);
      if (schools && schools.length > 0) {
        setSchools(schools);
      }
      const currMode = await schoolUtil.getCurrMode();
      setStudentMode(currMode);
      const sound = Util.getCurrentSound();
      const music = Util.getCurrentMusic();
      setSoundFlag(sound);
      setMusicFlag(music);

      const allLang = await ServiceConfig.getI().apiHandler.getAllLanguages();
      let tempLangDocIds: Map<string, string> = new Map();
      let keytempLangDocIds: Map<string, string> = new Map();
      if (!allLang || allLang.length == 0) return;
      const sortedLanguages = [...allLang].sort(
        (left, right) => (left.sort_index ?? 0) - (right.sort_index ?? 0),
      );
      for (let i = 0; i < sortedLanguages.length; i++) {
        const element = sortedLanguages[i];

        tempLangList.push({
          id: element.id,
          displayName: element.name,
        });
        tempLangDocIds.set(element.name, element.id);
        keytempLangDocIds.set(element.id, element.name);
      }

      setLangDocIds(tempLangDocIds);
      setLangList(tempLangList);

      // If the parent has no saved language, default to English.
      const userLangId = parentUser.language_id ?? DEFAULT_LANGUAGE_ID_EN;

      // Find the language object from allLang using the language_id
      const element =
        allLang.find((obj) => obj.id === userLangId) || allLang[0];

      if (!element) return;

      // Set the current language ID
      setCurrentAppLang(element.id);

      // Also update i18n language using its code
      if (element.code) {
        await i18n.changeLanguage(element.code);
        localStorage.setItem(LANGUAGE, element.code);
      }

      // ✅ FIX: set initial tabIndex so content renders immediately
      if (!tabIndex) {
        setTabIndex(DEFAULT_PARENT_TAB);
      }

      setIsLoading(false);
    }
  }

  function profileUI() {
    return (
      <div id="parent-page-profile">
        {userProfile.map((element, index) => {
          let studentUserType: boolean = true;
          if (element === undefined) {
            studentUserType = false;
          }
          return (
            <ProfileCard
              key={element?.id ?? `empty-profile-${index}`}
              width={'var(--profile-card-width)'}
              height={'auto'}
              userType={studentUserType}
              user={element}
              showText={true}
              setReloadProfiles={setReloadProfiles}
              profiles={userProfile}
              studentCurrMode={studentMode}
            />
          );
        })}
      </div>
    );
  }

  function settingUI() {
    const soundEnabled = soundFlag === 0;
    const musicEnabled = musicFlag === 0;
    const selectedLanguage =
      langList.find((lang) => lang.id === currentAppLang)?.displayName ?? '';

    const handleLanguageSelect = async (
      selectedLangDocId: string,
    ): Promise<void> => {
      const api = ServiceConfig.getI().apiHandler;
      const auth = ServiceConfig.getI().authHandler;
      const allLang = await api.getAllLanguages();

      const langDoc = allLang.find((obj) => obj.id === selectedLangDocId);

      if (!langDoc) return;
      localStorage.setItem(LANGUAGE, langDoc.code ?? '');
      await i18n.changeLanguage(langDoc.code ?? '');
      const currentUser = await auth.getCurrentUser();
      setTabIndex(parentHeaderIconList[1].header);

      if (!currentUser || !currentUser.id) return;
      if (selectedLangDocId) {
        api.updateLanguage(currentUser.id, selectedLangDocId);
      }
      setCurrentAppLang(selectedLangDocId);
      setIsLanguageMenuOpen(false);
      const updatedUserData: TableTypes<'user'> = {
        ...currentUser,
        language_id: selectedLangDocId,
      };
      dispatch(setUser(updatedUserData));
      auth.currentUser = updatedUserData;
    };

    const handleSoundToggle = async () => {
      const nextEnabled = !soundEnabled;
      const nextFlag = nextEnabled ? 0 : 1;
      setSoundFlag(nextFlag);
      const resolvedCurrentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();
      Util.setCurrentSound(nextFlag);
      if (resolvedCurrentUser) {
        ServiceConfig.getI().apiHandler.updateSoundFlag(
          resolvedCurrentUser.id,
          nextEnabled,
        );
      }
    };

    const handleMusicToggle = async () => {
      const nextEnabled = !musicEnabled;
      const nextFlag = nextEnabled ? 0 : 1;
      setMusicFlag(nextFlag);
      const resolvedCurrentUser =
        await ServiceConfig.getI().authHandler.getCurrentUser();
      Util.setCurrentMusic(nextFlag);
      if (resolvedCurrentUser) {
        ServiceConfig.getI().apiHandler.updateMusicFlag(
          resolvedCurrentUser.id,
          nextEnabled,
        );
      }
    };

    const handleTeachersAppClick = async () => {
      if (!currentUser?.name || currentUser.name.trim() === '') {
        history.replace(PAGES.ADD_TEACHER_NAME);
        return;
      }

      const teacherModeAuthResult = await requireTeacherModeAuth();

      if (teacherModeAuthResult === TeacherModeAuthResult.success) {
        switchToTeacherMode();
        return;
      }

      if (
        teacherModeAuthResult === TeacherModeAuthResult.popupFallbackRequired
      ) {
        setIsTeacherAuthPopupOpen(true);
      }
    };

    const handleTermsClick = () => {
      history.push({
        pathname: PAGES.TERMS_AND_CONDITIONS,
        state: {
          from: getAppPathname(),
          returnLocation: {
            pathname: getAppPathname(),
            state: {
              activeTab: 'settings',
            },
          },
        },
      });
    };

    const handleSignOut = async () => {
      const auth = ServiceConfig.getI().authHandler;
      logAuthDebug('User initiated parent logout.', {
        source: 'Parent.settingUI.handleSignOut',
        reason: 'parent_logout_button',
        from_page: getAppPathname(),
      });
      await auth.logOut();
      Util.unSubscribeToClassTopicForAllStudents();
      localStorage.removeItem(SCHOOL);
      localStorage.removeItem(CLASS);
      localStorage.removeItem(CURRENT_MODE);
      localStorage.removeItem(SCHOOL_LOGIN);
      await ClearCacheData();
      logAuthDebug('Navigating to login after parent logout.', {
        source: 'Parent.settingUI.handleSignOut',
        reason: 'logout_complete_navigate_login',
        from_page: getAppPathname(),
        to_page: PAGES.LOGIN,
      });
      history.replace(PAGES.LOGIN);
      if (Capacitor.isNativePlatform()) {
        window.location.reload();
      }
    };

    const handleDeleteAccount = async () => {
      await Browser.open({
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSd0q3StMO49k_MvBQ68F_Ygdytpmxv-vNuF5jqsk6dY-4N0BA/viewform?pli=1',
      });
    };

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
                <div className="parent-settings-toggle-group">
                  <p className="parent-settings-toggle-title">{t('Sound')}</p>
                  <div className="parent-settings-toggle-row">
                    <span className="parent-settings-toggle-state">
                      {t('OFF')}
                    </span>
                    <button
                      type="button"
                      className={`parent-settings-switch${soundEnabled ? ' is-on' : ''}`}
                      onClick={handleSoundToggle}
                      aria-label={String(t('Sound'))}
                      aria-pressed={soundEnabled}
                    >
                      <span className="parent-settings-switch-thumb" />
                    </button>
                    <span className="parent-settings-toggle-state">
                      {t('ON')}
                    </span>
                  </div>
                </div>

                <div className="parent-settings-toggle-group">
                  <p className="parent-settings-toggle-title">{t('Music')}</p>
                  <div className="parent-settings-toggle-row">
                    <span className="parent-settings-toggle-state">
                      {t('OFF')}
                    </span>
                    <button
                      type="button"
                      className={`parent-settings-switch${musicEnabled ? ' is-on' : ''}`}
                      onClick={handleMusicToggle}
                      aria-label={String(t('Music'))}
                      aria-pressed={musicEnabled}
                    >
                      <span className="parent-settings-switch-thumb" />
                    </button>
                    <span className="parent-settings-toggle-state">
                      {t('ON')}
                    </span>
                  </div>
                </div>
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
  }

  function helpUI() {
    return (
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
                  {/* Email Us */}
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
                {/* Visit Website */}
                {t('Visit Website')}
                <TfiWorld size={'2vw'} />
                {/* <IonIcon name="globe-outline" size={"2vw"}></IonIcon> */}
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
                  // allowfullscreen
                ></iframe>
              </div>
            </div>
            <div id="parent-page-help-title-e3">
              <div
                id="parent-page-help-share-button-e3"
                onClick={() => {
                  // let message = "Hiii !!!!";
                  window.open(
                    `https://api.instagram.com/chimple_learning/`,
                    '_system',
                  );
                  // https://api.instagram.com/chimple_learning/

                  // instagram://user?username=its_mee_skanda
                }}
              >
                {/* Instagram */}
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
  }
  function faqUI() {
    return (
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
  }

  const handleChange = (newValue: string) => {
    const normalizedTabValue = normalizeTabValue(newValue);
    const selectedHeader = parentHeaderIconList.find(
      (item) => item.header === normalizedTabValue,
    );
    if (selectedHeader) {
      setCurrentHeader(selectedHeader.header);
    }
    setTabIndex(normalizedTabValue);
  };

  const handleBackButton = () => {
    Util.setPathToBackButton(PAGES.DISPLAY_STUDENT, history);
  };

  useEffect(() => {
    if (!tabIndex && parentHeaderIconList.length > 0) {
      setTabIndex(DEFAULT_PARENT_TAB);
    }
  }, []);
  useEffect(() => {
    const updatedTabs: Record<string, string> = {};
    parentHeaderIconList.forEach((item) => {
      updatedTabs[item.header] = t(item.header);
    });
    setTabs(updatedTabs);
  }, [localAppLang]);

  return (
    <Box className="parent-page-shell">
      <div className="parent-page-main">
        <CustomAppBar
          tabs={tabs}
          value={tabIndex}
          onChange={handleChange}
          handleBackButton={handleBackButton}
          customStyle={true}
        />
        <div
          className={`parent-page-scroll-content${
            isLanguageMenuOpen ? ' parent-page-scroll-content--locked' : ''
          }`}
        >
          {tabIndex === 'profile' && <div>{profileUI()}</div>}
          {tabIndex === 'settings' && <div>{settingUI()}</div>}
          {tabIndex === 'help' && <div>{helpUI()}</div>}
          {tabIndex === 'faq' && <div>{faqUI()}</div>}
          <TeacherAuthenticationPopup
            isOpen={isTeacherAuthPopupOpen}
            sourceEntryPoint={
              TEACHER_AUTH_GATE_SOURCE_ENTRY_POINTS.PARENT_SETTINGS_TAB
            }
            onClose={() => setIsTeacherAuthPopupOpen(false)}
            onAuthenticated={() => {
              setIsTeacherAuthPopupOpen(false);
              switchToTeacherMode();
            }}
          />
        </div>
      </div>
    </Box>
  );
};

export default Parent;
