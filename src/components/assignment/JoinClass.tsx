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
const urlClassCode: any = {};

const JoinClass: FC<{
  onClassJoin: () => void;
}> = ({ onClassJoin }) => {
  const [loading, setLoading] = useState(false);
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [inviteCode, setInviteCode] = useState<number>();
  const [codeResult, setCodeResult] = useState();
  const [error, setError] = useState("");
  const [schoolName, setSchoolName] = useState<string>();
  const [isInputFocus, setIsInputFocus] = useState(false);
  const scollToRef = useRef<null | HTMLDivElement>(null);
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();

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
      if (!isNextButtonEnabled()) return;
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
              ? t("Invalid Code. Please contact your teacher")
              : error.toString();
          setError(eMsg);
        }
      }
      setLoading(false);
    }
  };
  const onJoin = async () => {
    setShowDialogBox(false);
    setLoading(true);
    const student = Util.getCurrentStudent();
    try {
      if (student != null && inviteCode != null) {
        const result = await api.linkStudent(inviteCode, student.id);
      }
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
      }
      onClassJoin();
      const event = new CustomEvent("JoinClassListner", { detail: "Joined" });
      window.dispatchEvent(event);
      // history.replace("/");
      // window.location.reload();
    } catch (error) {
      if (error instanceof Object) setError(error.toString());
    }

    setLoading(false);
  };
  const location = useLocation();

  useEffect(() => {
    //Util.isTextFieldFocus(scollToRef, setIsInputFocus);

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
      if (classCode != "") {
        getClassData();
      }
    }
  }, []);

  return (
    <div className="join-class-main-header">
      <div className="join-class-header">
        {/* <div className="join-class-title">
          {t("Enter the 6 digit code your teacher has given to join the class")}
        </div> */}
        <input
          onChange={(evt) => {
            const inviteCode = evt.target.value.slice(0, 6);
            if (!inviteCode) {
              setInviteCode(undefined);
              return;
            }
            if (!NUMBER_REGEX.test(inviteCode)) {
              return;
            }

            setInviteCode(parseInt(inviteCode));
          }}
          className="join-class-text-box"
          defaultValue={inviteCode ?? ""}
          type="tel"
          placeholder={t("Enter the class code to join the class") as string}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              getClassData();
            }
          }}
          value={inviteCode ?? ""}
          style={{ width: "63vw" }}
        />
        <p className={"error-text "}>{error}</p>
        <button
          className={
            "okay-button " + (!isNextButtonEnabled() ? "disabled-btn" : "")
          }
          disabled={!isNextButtonEnabled()}
          onClick={getClassData}
        >
          {t("Okay")}
        </button>
        {isInputFocus ? <div ref={scollToRef} id="scroll"></div> : null}
      </div>
      <Loading isLoading={loading} />
      <DialogBoxButtons
        width={"40vw"}
        height={"30vh"}
        message={
          t("You are Joining ") +
          (!!codeResult
            ? t("School") +
                ": " +
                codeResult["school_name"] +
                ", " +
                t("Class") +
                ": " +
                codeResult["class_name"] ?? ""
            : "")
        }
        showDialogBox={showDialogBox}
        yesText={t("Cancel")}
        noText={t("Enter the Class")}
        handleClose={() => {
          setShowDialogBox(false);
        }}
        onYesButtonClicked={() => {
          setShowDialogBox(false);
        }}
        onNoButtonClicked={async () => {
          await onJoin();
        }}
      />
    </div>
  );
};
export default JoinClass;
