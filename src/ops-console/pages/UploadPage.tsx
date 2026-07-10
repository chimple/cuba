import { useHistory } from "react-router-dom";
import { PAGES } from "../../common/constants";
import FileUpload from "../components/FileUpload";
import { IonPage } from "@ionic/react";
import Header from "../../teachers-module/components/homePage/Header";

const UploadPage: React.FC = () => {
  const history = useHistory();
  const onBackButtonClick = () => {
    history.replace(PAGES.HOME_PAGE, {
      tabValue: 0,
    });
  };

  return (
    <IonPage>
      <Header
        isBackButton={true}
        onBackButtonClick={onBackButtonClick}
        onButtonClick={undefined}
      />
      <FileUpload />
    </IonPage>
  );
};

export default UploadPage;
