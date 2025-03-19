import { useHistory } from "react-router-dom";
import Header from "../../chimple-private/components/homePage/Header";
import { PAGES } from "../../common/constants";
import FileUpload from "../components/FileUpload";
import "./UploadPage.css";


const Upload = () => {

  const history = useHistory();
  
  const onBackButtonClick = () => {
      history.replace(PAGES.HOME_PAGE, {
        tabValue: 0,
      });
    };
    
  return (
    <div className="main-page">
      <div className="fixed-header">
        <Header
          isBackButton={true}
          onBackButtonClick={onBackButtonClick}
          onButtonClick={undefined}
        />
      </div>
      <FileUpload />
    </div>
  );
};

export default Upload;
