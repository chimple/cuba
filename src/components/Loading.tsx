import { IonLoading } from "@ionic/react";
import { useTranslation } from "react-i18next";

const Loading: React.FC<{ isLoading: boolean; msg?: string }> = ({
  isLoading,
  msg = "loading",
}) => {
  const { t } = useTranslation();
  const tMsg = t(msg);
  return (
    <div>
      <IonLoading isOpen={isLoading} message={tMsg} />
    </div>
  );
};

export default Loading;
