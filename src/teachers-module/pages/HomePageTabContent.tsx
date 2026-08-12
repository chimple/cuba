import { PAGES, TABLEDROPDOWN, TABLESORTBY, TableTypes } from '../../common/constants';
import type { History } from 'history';
import ComingSoon from '../components/homePage/ai/comingSoon';
import AssignScreen from '../components/homePage/assignment/AssignScreen';
import TeacherAssignment from '../components/homePage/assignment/TeacherAssignment';
import DashBoard from '../components/homePage/dashBoard/DashBoard';
import Library from '../components/library/Library';
import ReportTable from '../components/reports/ReportsTable';

interface HomePageLocationState {
  isAssignments?: boolean;
  selectedType?: TABLEDROPDOWN;
  sortType?: TABLESORTBY;
  startDate?: Date;
  endDate?: Date;
}

interface HomePageTabContentProps {
  autoStartScan: boolean;
  currentClass: TableTypes<'class'> | null;
  history: History;
  reportState?: HomePageLocationState;
  setAutoStartScan: (value: boolean) => void;
  setShowAssignOptionsScreen: (value: boolean) => void;
  setTabValue: (value: number) => void;
  showAssignOptionsScreen: boolean;
  showUnavailableQr: () => void;
  tabValue: number;
}

const HomePageTabContent = ({
  autoStartScan,
  currentClass,
  history,
  reportState,
  setAutoStartScan,
  setShowAssignOptionsScreen,
  setTabValue,
  showAssignOptionsScreen,
  showUnavailableQr,
  tabValue,
}: HomePageTabContentProps) => {
  const key = currentClass?.id || '';
  switch (tabValue) {
    case 0:
      return <DashBoard key={key} />;
    case 1:
      return <Library key={key} />;
    case 2:
      if (showAssignOptionsScreen) {
        return (
          <AssignScreen
            key={key}
            onLibraryClick={() => {
              setShowAssignOptionsScreen(true);
              setTabValue(1);
            }}
            onScanQrClick={() => {
              setShowAssignOptionsScreen(false);
              setAutoStartScan(true);
            }}
            onRecommendedClick={() => {
              history.replace(PAGES.TEACHER_RECOMMENDED_ASSIGNMENTS);
              setShowAssignOptionsScreen(false);
            }}
            onUnavailableQr={showUnavailableQr}
          />
        );
      }
      return (
        <TeacherAssignment
          key={key}
          autoStartScan={autoStartScan}
          onScanHandled={() => setAutoStartScan(false)}
          onLibraryClick={() => {
            setShowAssignOptionsScreen(true);
            setTabValue(1);
          }}
          onUnavailableQr={showUnavailableQr}
        />
      );
    case 3:
      return (
        <ReportTable
          key={key}
          handleButtonClick={() => setTabValue(1)}
          isAssignmentsProp={reportState?.isAssignments}
          selectedTypeProp={reportState?.selectedType}
          sortTypeProp={reportState?.sortType}
          startDateProp={reportState?.startDate}
          endDateProp={reportState?.endDate}
        />
      );
    case 4:
      return <ComingSoon key={key} />;
    default:
      return <Library key={key} />;
  }
};

export default HomePageTabContent;
