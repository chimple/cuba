import { IonCard } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  CONTINUE,
  COURSES,
  LESSON_CARD_COLORS,
  LIVE_QUIZ,
  PAGES,
  SOURCE,
  TYPE,
  TableTypes,
} from '../common/constants';
import { Capacitor } from '@capacitor/core';
import LessonCardStarIcons from '../components/LessonCardStarIcons';
import React from 'react';
import { ServiceConfig } from '../services/ServiceConfig';
import { t } from 'i18next';
import LovedIcon from '../components/LovedIcon';
import SelectIconImage from '../components/displaySubjects/SelectIconImage';
import { Util } from '../utility/util';
import DownloadLesson from '../components/DownloadChapterAndLesson';
import { useOnlineOfflineErrorMessageHandler } from '../common/onlineOfflineErrorMessageHandler';
import logger from '../utility/logger';

import { parsePath } from 'history';

export const useLessonCard = ({
  width,
  height,
  lesson,
  course,
  isPlayed,
  isUnlocked,
  showSubjectName = false,
  showText = true,
  showScoreCard = true,
  score,
  isLoved,
  showChapterName = false,
  downloadButtonLoading,
  showDate,
  onDownloadOrDelete,
  chapter,
  assignment,
  lessonCourseMap,
}: {
  width: string;
  height: string;
  lesson: TableTypes<'lesson'>;
  course: TableTypes<'course'> | undefined;
  isPlayed: boolean;
  isUnlocked: boolean;
  showSubjectName: boolean;
  showText?: boolean;
  showScoreCard?: boolean;
  score: any;
  isLoved: boolean | undefined;
  showChapterName: boolean;
  downloadButtonLoading?: boolean;
  showDate?: boolean;
  onDownloadOrDelete?: () => void;
  chapter?: TableTypes<'chapter'>;
  assignment?: TableTypes<'assignment'>;
  lessonCourseMap?: {
    [lessonId: string]: { course_id: string };
  };
}) => {
  const history = useHistory();
  const [currentCourse, setCurrentCourse] = useState<TableTypes<'course'>>();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [date, setDate] = useState<Date>();

  useEffect(() => {
    getCurrentCourse();
    getDate();
  }, [lesson]);

  const getDate = () => {
    const res = assignment?.starts_at;
    if (!!res) {
      const dateObj = new Date(res);
      setDate(dateObj);
    }
  };

  const getCurrentCourse = async () => {
    const api = ServiceConfig.getI().apiHandler;
    try {
      if (lessonCourseMap) {
        const lessonData = lessonCourseMap[lesson.id];
        if (lessonData?.course_id) {
          const course = await api.getCourse(lessonData.course_id);
          setCurrentCourse(course);
          return course;
        }
      }
    } catch (error) {
      logger.error('Error fetching course data:', error);
    }
  };

  const [lessonCardColor, setLessonCardColor] = useState('');
  const isMathCourse = course?.code?.toLowerCase().includes('math');

  useEffect(() => {
    setLessonCardColor(
      LESSON_CARD_COLORS[Math.floor(Math.random() * LESSON_CARD_COLORS.length)],
    );
  }, []);
  return {
    CONTINUE,
    COURSES,
    Capacitor,
    DownloadLesson,
    IonCard,
    JSON,
    LIVE_QUIZ,
    LessonCardStarIcons,
    LovedIcon,
    PAGES,
    SOURCE,
    SelectIconImage,
    TYPE,
    Util,
    assignment,
    chapter,
    course,
    currentCourse,
    date,
    downloadButtonLoading,
    getCurrentCourse,
    height,
    history,
    isLoved,
    isMathCourse,
    isPlayed,
    isUnlocked,
    lesson,
    lessonCardColor,
    onDownloadOrDelete,
    online,
    parsePath,
    presentToast,
    score,
    showChapterName,
    showDate,
    showScoreCard,
    showSubjectName,
    showText,
    t,
    width,
  };
};
