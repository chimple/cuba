import React, { useEffect, useState } from 'react';
import './DashBoardDetails.css';
import { useHistory } from 'react-router';
import Header from '../components/homePage/Header';
import {
  getBandTitleByColor,
  PAGES,
  StudentProgressData,
  TableTypes,
} from '../../common/constants';
import { t } from 'i18next';
import DashBoardStudentProgres from '../components/homePage/DashBoardStudentProgres';
import { Util } from '../../utility/util';
import logger from '../../utility/logger';

interface DashBoardDetailsProps {}
type DashBoardDetailsState = {
  bandcolor?: string;
  studentProgress?: StudentProgressData[];
  studentLength?: string;
};
const DashBoardDetails: React.FC<DashBoardDetailsProps> = ({}) => {
  const [currentClass, setCurrentClass] = useState<TableTypes<'class'> | null>(
    null,
  );
  const history = useHistory();
  const state = (history.location.state ?? {}) as DashBoardDetailsState;
  const bandcolor: string = state.bandcolor ?? '';
  const studentsProgress: StudentProgressData[] = state.studentProgress ?? [];
  const studentLength: string = state.studentLength ?? '';
  const bandTitle = getBandTitleByColor(
    bandcolor,
    t as (key: string) => string,
  );

  const currentSchool = Util.getCurrentSchool();

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const tempClass = await Util.getCurrentClass();
        setCurrentClass(tempClass || null);
      } catch (err) {
        logger.error('DashBoardDetails → Failed to load current class:', err);
        setCurrentClass(null);
      }
    };

    fetchClassDetails();
  }, []);
  return (
    <div className="dashboard-details-container">
      <Header
        isBackButton={true}
        onButtonClick={() => {
          history.replace(PAGES.HOME_PAGE, { tabValue: 0 });
        }}
        showSchool={true}
        showClass={true}
        className={currentClass?.name}
        schoolName={currentSchool?.name}
      />
      <main className="dashboard-details-body">
        <div
          className="dashboard-group-wise-header"
          style={{ backgroundColor: bandcolor }}
        >
          <span>{bandTitle}</span>
          <span>
            {studentsProgress?.length} / {studentLength}
          </span>
        </div>
        {studentsProgress?.map((stdpr) => (
          <DashBoardStudentProgres studentProgress={stdpr} />
        ))}
      </main>
    </div>
  );
};

export default DashBoardDetails;
