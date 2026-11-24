import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { useHistory } from 'react-router-dom';
import { PAGES, TableTypes } from '../../common/constants';
import { ServiceConfig } from '../../services/ServiceConfig';
import logger from '../../utility/logger';
import { schoolUtil } from '../../utility/schoolUtil';
import { Util } from '../../utility/util';
import { parsePath } from 'history';

type LanguageOption = { label: string; value: string; id: string };

interface UserProfilePageState {
  currentClass: TableTypes<'class'> | undefined;
  currentSchool: TableTypes<'school'> | undefined;
  hasCurrentClass: boolean;
  isEditMode: boolean;
  isTeacherSchoolMode: boolean;
  profilePic: string | null;
  fullName: string;
  email: string;
  phoneNum: string;
  language: string;
  languages: LanguageOption[];
  setFullName: Dispatch<SetStateAction<string>>;
  setEmail: Dispatch<SetStateAction<string>>;
  setPhoneNum: Dispatch<SetStateAction<string>>;
  handleEditClick: () => void;
  handleUpdate: () => Promise<void>;
  handleLanguageChange: (languageCode: string) => Promise<void>;
  handleProfilePicChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBackButtonClick: () => void;
}

export const useUserProfilePage = (): UserProfilePageState => {
  const history = useHistory();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState<TableTypes<'user'>>();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNum, setPhoneNum] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [languageId, setLanguageId] = useState<string>('');
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [currentClass, setCurrentClass] = useState<
    TableTypes<'class'> | undefined
  >(() => Util.getCurrentClass());
  const [currentSchool, setCurrentSchool] = useState<
    TableTypes<'school'> | undefined
  >(() => Util.getCurrentSchool());
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const api = ServiceConfig.getI().apiHandler;
  const isTeacherSchoolMode = schoolUtil.isTeacherSchoolMode();

  const fetchLanguages = useCallback(async (): Promise<void> => {
    try {
      const fetchedLanguages: TableTypes<'language'>[] =
        await api.getAllLanguages();
      const sanitizedLanguages: LanguageOption[] = [...fetchedLanguages]
        .sort((left, right) => (left.sort_index ?? 0) - (right.sort_index ?? 0))
        .filter((lang) => lang.code && lang.name)
        .map((lang) => ({
          label: lang.name,
          value: lang.code as string,
          id: lang.id,
        }));

      setLanguages(sanitizedLanguages);

      const user = await ServiceConfig.getI().authHandler.getCurrentUser();
      if (!user) return;

      setLoginUser(user);
      setFullName(user.name || '');
      setEmail(user.email || '');
      setPhoneNum(user.phone || '');
      setLanguageId(user.language_id || '');
      setProfilePic(user.image || '');
      const userLanguage = sanitizedLanguages.find(
        (lang) => lang.id === user.language_id,
      );
      if (userLanguage) setLanguage(userLanguage.value);
    } catch (error) {
      logger.error('Error fetching languages:', error);
    }
  }, [api]);

  const fetchClassDetails = useCallback(async (): Promise<void> => {
    try {
      const tempSchool = Util.getCurrentSchool();
      if (tempSchool) setCurrentSchool(tempSchool);
      const tempClass = Util.getCurrentClass();
      if (tempClass) setCurrentClass(tempClass);
    } catch (error) {
      logger.error('Failed to load class details', error);
    }
  }, []);

  useEffect(() => {
    void fetchClassDetails();
    void fetchLanguages();
  }, [fetchClassDetails, fetchLanguages]);

  const handleEditClick = (): void => setIsEditMode(!isEditMode);

  const handleUpdate = async (): Promise<void> => {
    try {
      if (!loginUser) {
        throw new Error('User is not logged in or user data is not available.');
      }
      const selectedLanguageId =
        languageId ||
        languages.find((lang) => lang.value === language)?.id ||
        loginUser.language_id ||
        '';
      const updatedUser = await api.updateUserProfile(
        loginUser,
        fullName,
        email,
        phoneNum,
        selectedLanguageId,
        profilePic || undefined,
      );
      setLoginUser(updatedUser);
      setFullName(updatedUser.name || '');
      setEmail(updatedUser.email || '');
      setPhoneNum(updatedUser.phone || '');
      setLanguageId(updatedUser.language_id || selectedLanguageId);
      ServiceConfig.getI().authHandler.currentUser = updatedUser;
    } catch (error) {
      logger.error('Error adding student:', error);
    }
    setIsEditMode(false);
  };

  const handleLanguageChange = async (languageCode: string): Promise<void> => {
    try {
      const selectedLanguage = languages.find(
        (lang) => lang.value === languageCode,
      );
      if (!selectedLanguage) return;
      setLanguage(selectedLanguage.value);
      setLanguageId(selectedLanguage.id);
      await Util.updateUserLanguage(languageCode);
    } catch (error) {
      logger.error('Error updating user language:', error);
    }
  };

  const handleProfilePicChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onBackButtonClick = (): void => {
    history.replace({ ...parsePath(PAGES.HOME_PAGE), state: { tabValue: 0 } });
  };

  if (!currentClass?.id) logger.error('No current class selected.');

  return {
    currentClass,
    currentSchool,
    hasCurrentClass: Boolean(currentClass?.id),
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
  };
};
