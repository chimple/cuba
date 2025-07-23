import { t } from "i18next";
import "./JoinClass.css";
import { FC, useEffect, useRef, useState } from "react";
import Loading from "../Loading";
import DialogBoxButtons from "../parent/DialogBoxButtons​";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import { Capacitor } from "@capacitor/core";
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
  const isJoining = useRef(false);
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [inviteCode, setInviteCode] = useState<number>();
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
        const result = await api.getDataByInviteCode(
          urlClassCode.inviteCode ? urlClassCode.inviteCode : inviteCode
        );
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
    if (isJoining.current) return;
    isJoining.current = true;
    setLoading(true);
    const student = Util.getCurrentStudent();

    try {
      if (!student || inviteCode == null) {
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
      await api.linkStudent(inviteCode, student.id);
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
      if (error instanceof Object) setError(error.toString());
    } finally {
      setLoading(false);
      isJoining.current = false;
    }

    setLoading(false);
  };
  const location = useLocation();

  useEffect(() => {
    setFullName(currStudent?.name || "");

    const urlParams = new URLSearchParams(location.search);
    const joinClassParam = urlParams.get("join-class");
    const classCode = urlParams.get("classCode");

    if (classCode != "") {
      let tempClassCode =
        !!classCode && !isNaN(parseInt(classCode))
          ? parseInt(classCode)
          : undefined;
      setInviteCode(tempClassCode);
      urlClassCode.inviteCode = tempClassCode;
      if (classCode && classCode != "") {
        getClassData();
      }
    }
  }, []);


useEffect(() => {
  if (Capacitor.isNativePlatform()) {
    // Disable default keyboard scroll behavior
    Keyboard.setScroll({ isDisabled: true });
    Keyboard.addListener("keyboardWillShow", () => {
      setIsInputFocus(true);
      setTimeout(() => {
        scrollToRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }, 100);
    });

     Keyboard.addListener("keyboardWillHide", () => {
      setIsInputFocus(false);
      // Restore scroll to top or re-render the layout
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });

  }
}, []);



  useEffect(() => {
    if (inviteCode && inviteCode.toString().length === 6) {
      getClassData();
    }
  }, [inviteCode]);

  return (
    <div className="join-class-parent-container">
      {isInputFocus && <div className="scroll-keyboard-for-join-class" ref={scrollToRef}></div>}
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
            fullName.length == 0 ? null : fullName && (fullName.length >= 3||fullName === currStudent.name) ? (
              <img src="assets/icons/CheckIcon.svg" alt="Status icon" />
            ) : (
              <img src="assets/icons/Vector.svg" alt="Status icon" />
            )
          }
          required = {true}
        />

        <InputWithIcons
          label={t("Class Code")}
          placeholder={t("Enter the code to join a class") ?? ""}
          value={inviteCode}
          setValue={setInviteCode}
          icon="assets/icons/OpenBook.svg"
          type="number"
          maxLength={6}
          statusIcon={
            inviteCode?.toString().length === 6 ? (
              codeResult && !error ? (
                <img src="assets/icons/CheckIcon.svg" alt="Status icon" />
              ) : error && error !== "" ? (
                <img src="assets/icons/Vector.svg" alt="Status icon" />
              ) : null
            ) : null
          }
          required = {true}
        />
        

      </div>

      <div className="join-class-message">
        {codeResult &&
        !error &&
        error == "" &&
        inviteCode?.toString().length === 6
          ? `${t("School")}: ${codeResult["school_name"]}, ${t("Class")}: ${codeResult["class_name"]}`
          : error && inviteCode?.toString().length === 6
            ? error
            : null}
      </div>
      <button
        className="join-class-confirm-button"
        onClick={onJoin}
        disabled={
          loading ||
          !(
            codeResult &&
            !error &&
            error === "" &&
            (fullName.length >= 3 || fullName === currStudent.name) &&
            inviteCode?.toString().length === 6
          )
        }
      >
        <span className="join-class-confirm-text">{t("Confirm")}</span>
      </button>
    </div>
  );
};
export default JoinClass;
