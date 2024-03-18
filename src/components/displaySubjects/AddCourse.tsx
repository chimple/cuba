import { FC, useState, useEffect } from "react";
import Course from "../../models/course";
import "./SelectCourse.css";
import { t } from "i18next";
import SelectIconImage from "./SelectIconImage";
import { IoAddCircleSharp } from "react-icons/io5";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import { ACTION, CHAPTER_CARD_COLOURS, EVENTS, PAGES } from "../../common/constants";
import { useHistory } from "react-router";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { useOnlineOfflineErrorMessageHandler } from "../../common/onlineOfflineErrorMessageHandler";
import DialogBoxButtons from "../parent/DialogBoxButtons​";
import { ServiceConfig } from "../../services/ServiceConfig";
import { Util } from "../../utility/util";
import Loading from "../Loading";

const AddCourse: FC<{
  courses: Course[];
  setReloadSubjects: (event: boolean) => void;
}> = ({ courses, setReloadSubjects }) => {
  const history = useHistory();
  const { online, presentToast } = useOnlineOfflineErrorMessageHandler();
  const [showDialogBox, setShowDialogBox] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course>();
  const currentStudent = Util.getCurrentStudent();
  return (
    <Splide
      hasTrack={true}
      options={{
        arrows: false,
        wheel: true,
        lazyLoad: true,
        direction: "ltr",
        pagination: false,
      }}
    >
      {courses.map((course, index) => {
        return (
          <SplideSlide className="slide">
            <div
              onClick={() => {
                console.log('Selected course = ', course.title);
                if (!online) {
                  presentToast({
                    message: t(
                      `Device is offline. Cannot add new subject`
                    ),
                    color: "danger",
                    duration: 3000,
                    position: "bottom",
                    buttons: [
                      {
                        text: "Dismiss",
                        role: "cancel",
                      },
                    ],
                  });
                  return;
                }
                setSelectedCourse(course);
                setShowDialogBox(true);
                
              }}
              className="subject-button"
              key={course.docId}
            >
              <div
                className="course-icon"
                style={{
                  backgroundColor: CHAPTER_CARD_COLOURS[index],
                }}
              >
                <SelectIconImage
                  localSrc={`courses/chapter_icons/${course.courseCode}.png`}
                  defaultSrc={"courses/" + "maths" + "/icons/" + "maths10.png"}
                  webSrc={course.thumbnail}
                />
              </div>
              {t(course.title)}
              {/* {course.title === "English" ? course.title : course.title} */}
            </div>
          </SplideSlide>
        );
      })}
      {showDialogBox ? (
        <DialogBoxButtons
          width={"40vw"}
          height={"30vh"}
          message={t(
            `Add course ${selectedCourse?.title}`
          )}
          showDialogBox={showDialogBox}
          yesText={t("Yes")}
          noText={t("Cancel")}
          handleClose={() => {
            setShowDialogBox(false);
            console.log("Close", false);
          }}
          onYesButtonClicked={async ({}) => {
            setShowDialogBox(false);
            setIsLoading(true);
            setReloadSubjects(false);
            await ServiceConfig.getI().apiHandler.addCourseForParentsStudent(selectedCourse!, currentStudent!);
            await setReloadSubjects(true);
            const eventParams = {
              user_id: currentStudent?.docId,
              user_type: currentStudent?.role,
              user_name: currentStudent?.name,
              user_gender: currentStudent?.gender!,
              user_age: currentStudent?.age!,
              phone_number: currentStudent?.username,
              parent_id: currentStudent?.uid,
              parent_username: currentStudent?.username,
              action_type: ACTION.UPDATE,
            };
            console.log(
              "Util.logEvent(EVENTS.USER_PROFILE, eventParams);",
              EVENTS.USER_PROFILE,
              eventParams
            );
            Util.logEvent(EVENTS.USER_PROFILE, eventParams);
            setIsLoading(false);
          }}
          onNoButtonClicked={async ({}) => {
            setShowDialogBox(false);
          }}
        ></DialogBoxButtons>
      ) : null}
      <Loading isLoading={isLoading} />
    </Splide>
  );
};
export default AddCourse;
