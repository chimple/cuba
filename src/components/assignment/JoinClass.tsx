import { t } from "i18next";
import "./JoinClass.css";
import { FC, useState } from "react";
import Loading from "../Loading";
import DialogBoxButtons from "../parent/DialogBoxButtons​";
import { ServiceConfig } from "../../services/ServiceConfig";
const JoinClass: FC<{
  onClassJoin: () => void;
}> = ({ onClassJoin }) => {
  const [loading, setLoading] = useState(false);
  const [showDialogBox, setShowDialogBox] = useState(false);
  const [inviteCode, setInviteCode] = useState<number>();
  const [codeResult, setCodeResult] = useState();
  const [error, setError] = useState("");
  const api = ServiceConfig.getI().apiHandler;

  const isNextButtonEnabled = () => {
    return !!inviteCode && inviteCode.toString().length === 6;
  };

  const getClassData = async () => {
    console.log("onJoin", inviteCode, isNextButtonEnabled());
    if (!!error) setError("");
    if (!isNextButtonEnabled()) return;
    setLoading(true);
    try {
      const result = await api.getDataByInviteCode(inviteCode!);
      console.log(
        "🚀 ~ file: JoinClass.tsx:24 ~ getClassData ~ result:",
        result
      );
      setCodeResult(result);
      setShowDialogBox(true);
    } catch (error) {
      console.log("🚀 ~ file: JoinClass.tsx:32 ~ getClassData ~ error:", error);
      if (error instanceof Object) setError(error.toString());
    }
    setLoading(false);
  };
  const onJoin = async () => {
    setShowDialogBox(false);
    setLoading(true);
    try {
      const result = await api.linkStudent(inviteCode!);
      console.log("🚀 ~ file: JoinClass.tsx:41 ~ onJoin ~ result:", result);
      onClassJoin();
    } catch (error) {
      console.log("🚀 ~ file: JoinClass.tsx:48 ~ onJoin ~ error:", error);
      if (error instanceof Object) setError(error.toString());
    }
    setLoading(false);
  };

  return (
    <div className="join-class-main-header">
      <div className="join-class-header">
        <div className="join-class-title">
          {t("Enter the class code to join the class")}
        </div>
        <input
          onChange={(evt) => {
            const inviteCode = evt.target.value;
            setInviteCode(
              !!inviteCode && !isNaN(parseInt(inviteCode))
                ? parseInt(inviteCode)
                : undefined
            );
          }}
          className="join-class-text-box"
          defaultValue={inviteCode}
          type="number"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              getClassData();
            }
          }}
          value={inviteCode}
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
      </div>
      <Loading isLoading={loading} />
      <DialogBoxButtons
        width={"40vw"}
        height={"30vh"}
        message={
          t("You are Joining ") +
          (!!codeResult ? codeResult["data"]["name"] ?? "" : "")
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
