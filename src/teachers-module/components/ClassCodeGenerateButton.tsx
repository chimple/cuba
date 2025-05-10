import React from "react";
import { IonButton, IonLabel, IonItem, IonIcon } from "@ionic/react";
import { TfiSharethis } from "react-icons/tfi"; // You can replace this with Ionic icons if you prefer.
import { t } from "i18next";
import { ServiceConfig } from "../../services/ServiceConfig";
import "./ClassCodeGenerateButton.css"; // Ensure this still styles your component appropriately.
import { Util } from "../../utility/util";

interface ClassCodeProps {
  currentClassId: string;
  setClassCode: (code: number | undefined) => void;
  classCode: number | undefined;
  className: string;
}

const ClassCodeGenerateButton: React.FC<ClassCodeProps> = ({
  classCode,
  currentClassId,
  setClassCode,
  className,
}) => {
  const api = ServiceConfig.getI()?.apiHandler;
  const generateClassCode = async (classId: string) => {
    if (classId) {
      classCode = await api.createClassCode(classId);
      if (classCode) {
        setClassCode(classCode);
      } else {
        console.log("Failed to get class code");
      }
    }
  };

  const shareClassCode = async () => {
    if (classCode) {
      const classCodeString = classCode.toString();
      const message = `${t("Hi Students")},
  
  ${t("To join the class")} "${className}", ${t("please install the Chimple Kids app:")} https://play.google.com/store/apps/details?id=org.chimple.bahama.
  
  ${t("After creating your account, open the app and click the 'Homework' icon from the top header. Then, enter this code:")} ${classCodeString}.
  
  ${t("Or, directly click on this link to join the class:")}`;

      Util.sendContentToAndroidOrWebShare(
        message,
        t("Hi Students"),
        `https://chimple.cc/join-class?classCode=${classCodeString}`
      );
    }
  };

  return (
    <div className="class-code">
      <IonItem lines="none">
        <div>{t("Class Code")}:</div>
        {classCode ? (
          <div className="share-code">
            <div className="code">{classCode}</div>
            <IonButton onClick={shareClassCode} fill="clear" color="dark">
              <TfiSharethis />
            </IonButton>
          </div>
        ) : null}
      </IonItem>

      {!classCode && (
        <IonButton
          className="generate-code-button"
          onClick={async () => {
            await generateClassCode(currentClassId);
          }}
          color="#3bd95a"
        >
          {t("Generate")}
        </IonButton>
      )}
    </div>
  );
};

export default ClassCodeGenerateButton;
