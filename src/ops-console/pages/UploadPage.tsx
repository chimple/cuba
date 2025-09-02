import FileUpload from "../components/FileUpload";
import { IonPage } from "@ionic/react";

const UploadPage: React.FC = () => {
  return (
    <IonPage placeholder={undefined} onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}>
      <FileUpload />
    </IonPage>
  );
};

export default UploadPage;
