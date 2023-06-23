import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import { AVATARS, LANG, PAGES } from "../common/constants";
import IconButton from "./IconButton";
import "./ProfileHeader.css";
import { ServiceConfig } from "../services/ServiceConfig";
import i18n from "../i18n";
import BackButton from "./common/BackButton";

const ProfileHeader: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const student = api.currentStudent;

  return (
    <div className="header">
      <BackButton
        onClicked={() => {
          history.replace(PAGES.HOME);
        }}
      />
      
      <IconButton
        name={student?.name ?? "Chimp"}
        iconSrc={"assets/avatars/" + (student?.avatar ?? AVATARS[0]) + ".png"}
      />
      <IconButton
        name={t("Sign Out")}
        iconSrc="assets/icons/SignOutIcon.svg"
        onClick={async () => {
          api.currentStudent = undefined;
          const user = await auth.getCurrentUser();
          if (!!user && !!user.language?.id) {
            const langDoc = await api.getLanguageWithId(user.language.id);
            if (langDoc) {
              const tempLangCode = langDoc.code ?? LANG.ENGLISH;
              await i18n.changeLanguage(tempLangCode);
            }
          }
          // history.replace(PAGES.DISPLAY_STUDENT);
          history.replace(PAGES.SELECT_MODE);
        }}
      />
    </div>
  );
};
export default ProfileHeader;
