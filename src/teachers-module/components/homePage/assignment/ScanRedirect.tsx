import { FC, useEffect } from "react";
import { useHistory } from "react-router";
import { PAGES } from "../../../../common/constants";

const ScanRedirect: FC = () => {
  const history = useHistory();
  useEffect(() => {
    // Immediately navigate to TeacherAssignment page
    history.replace(PAGES.HOME_PAGE, { tabValue: 2 });
  }, [history]);

  return null; 
};

export default ScanRedirect;
