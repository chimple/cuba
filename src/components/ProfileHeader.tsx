import { useTranslation } from "react-i18next";
import { useHistory } from "react-router";
import { CURRENT_STUDENT, AVATARS, LANG, PAGES, CONTINUE } from "../common/constants";
import IconButton from "./IconButton";
import "./ProfileHeader.css";
import { ServiceConfig } from "../services/ServiceConfig";
import i18n from "../i18n";
import BackButton from "./common/BackButton";
import { Util } from "../utility/util";
import { useEffect, useState } from "react";
import User from "../models/user";

const ProfileHeader: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const api = ServiceConfig.getI().apiHandler;
  const auth = ServiceConfig.getI().authHandler;
  const [student, setStudent] = useState<User>();
  async function init() {
    const student = await Util.getCurrentStudent();
    if (!student) {
      history.replace(PAGES.HOME);
      return;
    }

    setStudent(student);
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="header">
      <BackButton
        onClicked={() => {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get(CONTINUE)) {
            history.replace(PAGES.HOME + "?continue=true");
          } else {
            history.replace(PAGES.HOME);
          }
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
          localStorage.removeItem(CURRENT_STUDENT);
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
