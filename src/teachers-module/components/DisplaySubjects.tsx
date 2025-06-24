import React from "react";
import {
  IonButton,
  IonModal,
  IonContent,
  IonIcon,
  IonAlert,
} from "@ionic/react";
import { closeCircleOutline } from "ionicons/icons";
import { t } from "i18next";
import "./DisplaySubjects.css";
import { TableTypes } from "../../common/constants";

interface CurriculumWithCourses {
  curriculum: { id: string; name: string; grade?: string };
  courses: TableTypes<"course">[];
}

interface DisplaySubjectsProps {
  curriculumsWithCourses: CurriculumWithCourses[];
  selectedSubjects: string[];
  onSubjectClick: (subject: string) => void;
  onRemoveSubject: (subject: string) => void;
  isModalOpen: boolean;
  currentSubject: string | null;
  setIsModalOpen: (open: boolean) => void;
}

const DisplaySubjects: React.FC<DisplaySubjectsProps> = ({
  curriculumsWithCourses,
  selectedSubjects,
  onSubjectClick,
  onRemoveSubject,
  isModalOpen,
  currentSubject,
  setIsModalOpen,
}) => {
  // State to track whether the last subject warning should be shown
  const [isLastSubjectAlertOpen, setIsLastSubjectAlertOpen] =
    React.useState(false);

  // Trigger subject removal logic
  const triggerRemoveSubject = (subject: string) => {
    if (selectedSubjects.length === 1) {
      // If only one subject is left, show the "cannot delete" alert
      setIsLastSubjectAlertOpen(true);
      console.debug("Cannot delete the last remaining subject.");
    } else {
      // Otherwise, proceed with the removal confirmation
      onSubjectClick(subject); // Set the current subject
      setIsModalOpen(true); // Open the confirmation modal
      console.debug("Delete confirmation triggered for subject:", subject);
    }
  };

  // Handle subject removal
  const handleRemoveSubject = () => {
    if (currentSubject) {
      onRemoveSubject(currentSubject); // Remove the subject
      console.debug("Subject removed:", currentSubject);
    }
    setIsModalOpen(false); // Close the modal after removal
  };

  return (
    <div className="display-subject-curriculum-container">
      <div className="display-subject-header">
        <h3 className="main-title-in-display-subject-page">{t("Subjects")}</h3>
        <p className="sub-title-in-display-subject-page">
          {t("Below are the chosen subjects")}
        </p>
      </div>

      {selectedSubjects.length > 0 ? (
        curriculumsWithCourses.map(({ curriculum, courses }) => {
          const selectedCourses = courses.filter((course) =>
            selectedSubjects.includes(course.id)
          );

          if (selectedCourses.length === 0) return null;

          return (
            <div
              key={`${curriculum.id}-${curriculum.grade}`}
              className="display-subject-curriculum-section"
            >
              <div className="display-subject-curriculum-header">
                {curriculum.name} {curriculum.grade}
              </div>
              {selectedCourses.map((course) => (
                <div
                  key={course.id}
                  className="subject-item-in-display-subject-page selected-subject"
                  onClick={() => triggerRemoveSubject(course.id)} // Trigger subject removal logic
                >
                  <div className="subject-name-div">
                    <img
                      src={course?.image || "assets/icons/DefaultIcon.png"}
                      alt={course.name || "Default Subject Icon"}
                      className="subject-icon-in-display-subject-page"
                    />
                    <div> {course.name}</div>
                  </div>
                  <IonIcon icon={closeCircleOutline} />
                </div>
              ))}
            </div>
          );
        })
      ) : (
        <p className="no-subjects-message">{t("No selected subjects")}</p>
      )}

      {/* Confirmation Alert for Multiple Subjects */}
      <IonAlert
        isOpen={isModalOpen}
        onDidDismiss={() => setIsModalOpen(false)}
        header={t("Remove Subject") || ""}
        message={t("Are you sure you want to remove this subject?") || ""}
        cssClass="custom-alert"
        buttons={[
          {
            text: t("Cancel") || "",
            role: "cancel",
            cssClass: "alert-cancel-button",
            handler: () => {
              setIsModalOpen(false); // Close the modal on cancel
            },
          },
          {
            text: t("Remove") || "",
            cssClass: "alert-remove-button",
            handler: () => {
              handleRemoveSubject(); // Call the remove handler
            },
          },
        ]}
      />

      {/* Alert for Last Subject Deletion Restriction */}
      <IonAlert
        isOpen={isLastSubjectAlertOpen}
        onDidDismiss={() => setIsLastSubjectAlertOpen(false)}
        header={t("Action Not Allowed") || ""}
        message={t("The Subject you have chosen is the last one left and cannot be deleted") || ""}
        cssClass="custom-alert"
        buttons={[
          {
            text: t("OK") || "",
            cssClass: "alert-ok-button",
            handler: () => {
              setIsLastSubjectAlertOpen(false); // Close the alert
              console.debug("Last subject alert closed.");
            },
          },
        ]}
      />
    </div>
  );
};

export default DisplaySubjects;