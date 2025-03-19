import { useHistory } from "react-router-dom";
import Header from "../../chimple-private/components/homePage/Header";
import { PAGES } from "../../common/constants";
import FileUpload from "../components/FileUpload";
import { IonPage } from "@ionic/react";

const UploadPage: React.FC = () => {
  const history = useHistory();
  const onBackButtonClick = () => {
    history.replace(PAGES.HOME_PAGE, {
      tabValue: 0,
    });
  };

  return (
    <IonPage className="main-page">
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
