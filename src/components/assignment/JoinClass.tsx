import { t } from "i18next";
import "./JoinClass.css";
import { FC, useEffect, useRef, useState } from "react";
import Loading from "../Loading";
import DialogBoxButtons from "../parent/DialogBoxButtons​";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { NUMBER_REGEX, PAGES } from "../../common/constants";
import { useHistory, useLocation } from "react-router";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";
import { schoolUtil } from "../../utility/schoolUtil";
import InputWithIcons from "../common/InputWithIcons";
const urlClassCode: any = {};

const JoinClass: FC<{
  onClassJoin: () => void;
}> = ({ onClassJoin }) => {
  const [loading, setLoading] = useState(false);
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [codeResult, setCodeResult] = useState();
  const [error, setError] = useState("");
  const [schoolName, setSchoolName] = useState<string>();
  const [isInputFocus, setIsInputFocus] = useState(false);
  const scrollToRef = useRef<null | HTMLDivElement>(null);
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [fullName, setFullName] = useState("");
  const [currStudent] = useState<any>(Util.getCurrentStudent());

  const api = ServiceConfig.getI().apiHandler;
  const containerRef = useRef<HTMLDivElement>(null);

  const isNextButtonEnabled = () => {
    let tempInviteCode = urlClassCode.inviteCode
      ? urlClassCode.inviteCode
      : inviteCode;
    return !!tempInviteCode && tempInviteCode.toString().length === 6;
  };

  const getClassData = async () => {
    if (!online) {
      presentToast({
        message: t(`Device is offline. Cannot join a class`),
        color: "danger",
        duration: 3000,
        position: "bottom",
        buttons: [
          {
            text: "Dismiss",
            role: "cancel",
          },
        ],
      });
      return;
    } else {
      if (!!error) setError("");
      // if (!isNextButtonEnabled()) return;
      setLoading(true);
      try {
        const codeToVerify = urlClassCode.inviteCode || inviteCode;
        const result = await api.getDataByInviteCode(parseInt(codeToVerify, 10));
        setCodeResult(result);
        setShowDialogBox(true);
      } catch (error) {
        if (error instanceof Object) {
          let eMsg: string =
            "Error: Invalid inviteCode" === error.toString()
              ? t("Invalid code. Please check and Try again.")
              : error.toString();
          setError(eMsg);
        }
      }
      setLoading(false);
    }
  };
  const onJoin = async () => {
    // setShowDialogBox(false);
    if (loading) return;
    setLoading(true);

    try {
      const student = Util.getCurrentStudent();

      if (!student || inviteCode.length !== 6) {
        throw new Error("Student or invite code is missing.");
      }
      if (student.name == null || student.name === "") {
        await api.updateStudent(
          student,
          fullName,
          student.age!,
          student.gender!,
          student.avatar!,
          student.image!,
          student.curriculum_id!,
          student.grade_id!,
          student.language_id!
        );
      }
      await api.linkStudent(parseInt(inviteCode, 10), student.id);
      if (!!codeResult) {
        Util.subscribeToClassTopic(
          codeResult["class_id"],
          codeResult["school_id"]
        );
        const currClass = await api.getClassById(codeResult["class_id"]);
        if (currClass) {
          await schoolUtil.setCurrentClass(currClass);
        } else {
          console.error("Class data not found.");
          throw new Error("Class data could not be fetched.");
        }
        await api.updateSchoolLastModified(codeResult["school_id"]);
        await api.updateClassLastModified(codeResult["class_id"]);
        await api.updateUserLastModified(student.id);
      }
      onClassJoin();
      const event = new CustomEvent("JoinClassListner", { detail: "Joined" });
      window.dispatchEvent(event);
      // history.replace("/");
      // window.location.reload();
    } catch (error) {
      console.error("Join class failed:", error);
      if (error instanceof Object) setError(error.toString());
    } finally {
      setLoading(false);
    }
  };
  const location = useLocation();

  useEffect(() => {
    setFullName(currStudent?.name || "");

    const urlParams = new URLSearchParams(location.search);
    const joinClassParam = urlParams.get("join-class");
    const classCode = urlParams.get("classCode");

    if (classCode && /^\d{1,6}$/.test(classCode)) {
      setInviteCode(classCode);
      urlClassCode.inviteCode = classCode;
      if (classCode.length === 6) {
        getClassData();
      }
    }
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.setScroll({ isDisabled: true });

      const handleKeyboardShow = () => {
        setIsInputFocus(true);
      };

      const handleKeyboardHide = () => {
        setIsInputFocus(false);
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      };

      let showSub: PluginListenerHandle;
      let hideSub: PluginListenerHandle;

      // Use an async IIFE to await the subscriptions
      (async () => {
        showSub = await Keyboard.addListener(
          "keyboardWillShow",
          handleKeyboardShow
        );
        hideSub = await Keyboard.addListener(
          "keyboardWillHide",
          handleKeyboardHide
        );
      })();

      return () => {
        showSub?.remove();
        hideSub?.remove();
      };
    }
  }, []);

  useEffect(() => {
    if (inviteCode && inviteCode.length === 6) {
      getClassData();
    }
  }, [inviteCode]);

  const isFormValid =
    !!codeResult &&
    !error &&
    (fullName.length >= 3 || fullName === currStudent.name) &&
    inviteCode?.length === 6;

  return (
    <div className="join-class-parent-container">
      <div
        className={`assignment-join-class-container-scroll ${
          isInputFocus ? "shift-up" : ""
        }`}
        ref={containerRef}
      >
        <h2>{t("Join a Class by entering the details below")}</h2>
        <div className="join-class-container">
          <InputWithIcons
            label={t("Full Name")}
            placeholder={t("Enter the child’s full name") ?? ""}
            value={fullName}
            setValue={setFullName}
            icon="assets/icons/BusinessCard.svg"
            readOnly={fullName === currStudent.name}
            statusIcon={
              fullName.length == 0 ? null : fullName &&
                (fullName.length >= 3 || fullName === currStudent.name) ? (
                <img src="assets/icons/CheckIcon.svg" alt="Status icon" />
              ) : (
                <img src="assets/icons/Vector.svg" alt="Status icon" />
              )
            }
            required={true}
            labelOffsetClass="with-icon-label-offset-small"
          />

          <InputWithIcons
            label={t("Class Code")}
            placeholder={t("Enter the code to join a class") ?? ""}
            value={inviteCode}
            setValue={(val: string) => {
              // Only allow digits to be entered.
              if (/^\d*$/.test(val)) {
                setInviteCode(val);
              }
            }}
            icon="assets/icons/OpenBook.svg"
            type="text"
            maxLength={6}
            statusIcon={
              inviteCode?.length === 6 ? (
                codeResult && !error ? (
                  <img src="assets/icons/CheckIcon.svg" alt="Status icon" />
                ) : error && error !== "" ? (
                  <img src="assets/icons/Vector.svg" alt="Status icon" />
                ) : null
              ) : null
            }
            required={true}
            labelOffsetClass="with-icon-label-offset-small"
          />
        </div>

        <div className="join-class-message">
          {codeResult &&
          !error &&
          error == "" &&
          inviteCode?.length === 6
            ? `${t("School")}: ${codeResult["school_name"]}, ${t("Class")}: ${
                codeResult["class_name"]
              }`
            : error && inviteCode?.length === 6
            ? error
            : null}
        </div>
        <button
          className="join-class-confirm-button"
          onClick={onJoin}
          disabled={loading || !isFormValid}
        >
          <span className="join-class-confirm-text">{t("Confirm")}</span>
        </button>
      </div>
    </div>
  );
};
export default JoinClass;
