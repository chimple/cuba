import React, { useEffect, useState } from 'react';
import { ServiceConfig } from '../services/ServiceConfig';
import { PAGES } from '../common/constants';
import { useHistory } from 'react-router';
import { Util } from '../utility/util';
import { StudentLessonResult } from '../common/courseConstants';
import Assignment from '../models/assignment';
import Lesson from '../models/lesson';
import { t } from 'i18next';
import LessonSlider from '../components/LessonSlider';
import "./Quiz.css";
import Loading from '../components/Loading';


const Quiz: React.FC = () => {
    const history = useHistory();
    const [loading, setLoading] = useState(true);
    const [quizzes, setQuizzes] = useState<Lesson[]>([]);
    const [lessonResultMap, setLessonResultMap] = useState<{
        [lessonDocId: string]: StudentLessonResult;
    }>();
    const api = ServiceConfig.getI().apiHandler;

    useEffect(() => {
        init();
    }, []);

    const init = async (fromCache: boolean = true) => {
        setLoading(true);
        const student = await Util.getCurrentStudent();
        if (!student) {
            history.replace(PAGES.SELECT_MODE);
            return;
        }

        const studentResult = await api.getStudentResult(student.docId);
        if (!!studentResult) {
            console.log("tempResultLessonMap = res;", studentResult.lessons);
            setLessonResultMap(studentResult.lessons);
        }

        const linked = await api.isStudentLinked(student.docId, fromCache);
        if (!linked) {
            setLoading(false);
            return;
        }

        if (
            !!studentResult &&
            !!studentResult.classes &&
            studentResult.classes.length > 0
        ) {
            const classId = studentResult.classes[0];
            const allQuizzes: Assignment[] = [];
            await Promise.all(
                studentResult.classes.map(async (_class) => {
                    const res = await api.getQuizLessons(classId);
                    allQuizzes.push(...res);
                })
            );
            const _lessons: Lesson[] = [];
            await Promise.all(
                allQuizzes.map(async (_assignment) => {
                    const res = await api.getLesson(_assignment.lesson.id, undefined, true);
                    if (!!res) {
                        res.assignment = _assignment;
                        _lessons.push(res);
                    }
                })
            );

            setQuizzes(_lessons);
            setLoading(false);
        } else {
            setLoading(false);
            return;
        }
    };

    return (
        <div>
            {loading ? (
                <Loading isLoading={loading} />
            ) : (
                <div>
                    {quizzes.length > 0 ? (
                        <div>
                            <LessonSlider
                                lessonData={quizzes}
                                isHome={true}
                                course={undefined}
                                lessonsScoreMap={lessonResultMap || {}}
                                startIndex={0}
                                showSubjectName={true}
                                showChapterName={true}
                            />
                        </div>
                    ) : (
                        <div className="pending-quiz">
                            {t("There are no Quizzes for you.")}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default Quiz;
