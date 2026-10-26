import { FC, useEffect } from 'react';
import { useHistory } from 'react-router';
import { PAGES } from '../../../../common/constants';
import { parsePath } from 'history';

const ScanRedirect: FC = () => {
  const history = useHistory();
  useEffect(() => {
    // Immediately navigate to TeacherAssignment page
    history.replace({ ...parsePath(PAGES.HOME_PAGE), state: { tabValue: 2 } });
  }, [history]);

  return null;
};

export default ScanRedirect;
