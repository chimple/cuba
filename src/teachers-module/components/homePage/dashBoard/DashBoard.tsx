import React, { useEffect, useState } from 'react';
import './DashBoard.css';
import WeeklySummary from '../WeeklySummary';
import GroupWiseStudents from '../GroupWiseStudents';
import {
  BANDS,
  BANDWISECOLOR,
  HomeWeeklySummary,
  PAGES,
  TableTypes,
  ALL_SUBJECT,
} from '../../../../common/constants';
import { IonContent, IonRefresher, IonRefresherContent } from '@ionic/react';
import { ServiceConfig } from '../../../../services/ServiceConfig';
import { ClassUtil } from '../../../../utility/classUtil';
import Loading from '../../../../components/Loading';
import { useHistory } from 'react-router';
import { Util } from '../../../../utility/util';
import { subDays } from 'date-fns';
type SubjectOption = TableTypes<'course'> | typeof ALL_SUBJECT;

const DashBoard: React.FC = ({}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectOption>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<TableTypes<'user'>[]>();
  const [subjects, setSubjects] = useState<TableTypes<'course'>[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<HomeWeeklySummary>();
  const [studentProgress, setStudentProgress] = useState<Map<any, any>>();
  const api = ServiceConfig.getI().apiHandler;
  const history = useHistory();
  const current_class = Util.getCurrentClass();

  useEffect(() => {
    if (subjects.length > 0) {
      init();
    }
  }, [selectedSubject]);

  useEffect(() => {
    initSubject();
  }, []);

  const initSubject = async () => {
    const current_class = Util.getCurrentClass();
    const _subjects = await api.getCoursesForClassStudent(
      current_class?.id ?? '',
    );

    setSubjects(_subjects);
    setSelectedSubject(ALL_SUBJECT);
  };

  const init = async () => {
    setIsLoading(true);
    const _students = await api.getStudentsForClass(current_class?.id ?? '');
    setStudents(_students);
    const _classUtil = new ClassUtil();
    const subject_ids = subjects.map((item) => item.id);
    const selectedsubjectIds: string[] =
      selectedSubject?.id === ALL_SUBJECT.id || !selectedSubject?.id
        ? subject_ids
        : [selectedSubject.id];
    const _studentProgress = await _classUtil.divideStudents(
      current_class?.id ?? '',
      selectedsubjectIds,
    );
    const _weeklySummary = await _classUtil.getWeeklySummary(
      current_class?.id ?? '',
      selectedsubjectIds,
    );

    setWeeklySummary(_weeklySummary);
    setStudentProgress(_studentProgress);
    setIsLoading(false);
  };

  const onRefresh = (event: CustomEvent) => {
    api.syncDB().then(() => {
      init();
      event.detail.complete();
    });
  };

  const handleStudentReportNavigation = (student: TableTypes<'user'>) => {
    const startDate = subDays(new Date(), 6);
    const endDate = new Date();

    history.replace(PAGES.STUDENT_REPORT, {
      student,
      startDate,
      endDate,
      classDoc: current_class,
      fromDashboardBand: true,
    });
  };

  return !isLoading ? (
    <IonContent>
      <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
        <IonRefresherContent />
      </IonRefresher>
      <main className="dashboard-container">
        <WeeklySummary weeklySummary={weeklySummary} />
        <GroupWiseStudents
          color={BANDWISECOLOR.GREEN}
          studentsProgress={studentProgress?.get(BANDS.GREENGROUP)}
          studentLength={students?.length.toString() ?? ''}
          onStudentClick={handleStudentReportNavigation}
          onClickCallBack={() => {
            history.replace(PAGES.DASHBOARD_DETAILS, {
              studentProgress: studentProgress?.get(BANDS.GREENGROUP),
              bandcolor: BANDWISECOLOR.GREEN,
              studentLength: students?.length.toString() ?? '',
            });
          }}
        />
        <GroupWiseStudents
          color={BANDWISECOLOR.YELLOW}
          studentsProgress={studentProgress?.get(BANDS.YELLOWGROUP)}
          studentLength={students?.length.toString() ?? ''}
          onStudentClick={handleStudentReportNavigation}
          onClickCallBack={() => {
            history.replace(PAGES.DASHBOARD_DETAILS, {
              studentProgress: studentProgress?.get(BANDS.YELLOWGROUP),
              bandcolor: BANDWISECOLOR.YELLOW,
              studentLength: students?.length.toString() ?? '',
            });
          }}
        />
        <GroupWiseStudents
          color={BANDWISECOLOR.RED}
          studentsProgress={studentProgress?.get(BANDS.REDGROUP)}
          studentLength={students?.length.toString() ?? ''}
          onStudentClick={handleStudentReportNavigation}
          onClickCallBack={() => {
            history.replace(PAGES.DASHBOARD_DETAILS, {
              studentProgress: studentProgress?.get(BANDS.REDGROUP),
              bandcolor: BANDWISECOLOR.RED,
              studentLength: students?.length.toString() ?? '',
            });
          }}
        />
        <GroupWiseStudents
          color={BANDWISECOLOR.GREY}
          studentsProgress={studentProgress?.get(BANDS.GREYGROUP)}
          studentLength={students?.length.toString() ?? ''}
          onStudentClick={handleStudentReportNavigation}
          onClickCallBack={() => {}}
        />
      </main>
    </IonContent>
  ) : (
    <Loading isLoading={isLoading} />
  );
};

export default DashBoard;
