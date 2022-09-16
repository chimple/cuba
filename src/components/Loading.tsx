import { IonLoading } from "@ionic/react";

const Loading: React.FC<{ isLoading: boolean; msg?: string }> = ({
  isLoading,
  msg = "Loading...",
}) => {
  return (
    <div>
      <IonLoading isOpen={isLoading} message={msg} />
    </div>
  );
};

export default Loading;
