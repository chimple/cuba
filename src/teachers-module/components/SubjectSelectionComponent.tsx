import React, { useState } from "react";
import { IonButton, IonCheckbox } from "@ionic/react";
import "./SubjectSelectionComponent.css";
import { t } from "i18next";

interface SubjectSelectionProps {
  curriculumsWithCourses: {
    curriculum: {
      id: string;
      name: string;
      grade?: string;
    };
    courses: {
      id: string;
      name: string;
      image?: string;
    }[];
  }[];

  selectedSubjects: string[];
  onSubjectSelection: (courseId: string) => void;
  onConfirm: () => Promise<void>;
  schoolId: string | undefined;
}

const SubjectSelectionComponent: React.FC<SubjectSelectionProps> = ({
  curriculumsWithCourses,
  selectedSubjects,
  onSubjectSelection,
  onConfirm,
  schoolId,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirmClick = async () => {
    setLoading(true); // Disable the button while processing
    try {
      await onConfirm(); // Call the onConfirm function, assuming it returns a Promise
    } catch (error) {
      console.error("Error during confirmation:", error);
    } finally {
      setLoading(false); // Re-enable the button after the operation
    }
  };

  return (
    <div className="subject-selection-container">
      <div className="subject-selection-header">
        <h3 className="main-title">{t("Subjects")}</h3>
        <p className="sub-title">
          {schoolId
            ? t("Choose Subjects to add to your school")
            : t("Choose Subjects to add to your class")}
        </p>
      </div>
      {curriculumsWithCourses.map(({ curriculum, courses }) => (
        <div
          key={`${curriculum.id}-${curriculum.grade}`}
          className="curriculum-section"
        >
          <div className="curriculum-header">
            {curriculum.name} {curriculum.grade}
          </div>
          {courses.map((course) => (
            <div key={course.id} className="subject-item">
              <div className="subject-selection-div">
                <img
                  src={course?.image || "assets/icons/DefaultIcon.png"}
                  alt={course.name || "Default Subject Icon"}
                  className="subject-icon"
                />
                {course.name}
              </div>
              <IonCheckbox
                className="subject-page-checkbox"
                checked={selectedSubjects.includes(course.id)}
                onIonChange={() => onSubjectSelection(course.id)}
              />
            </div>
          ))}
        </div>
      ))}
      <div className="subject-selection-actions">
        <IonButton
          className={`confirm-button-in-subject-page ${
            loading || selectedSubjects.length === 0
              ? "disabled-confirm-button"
              : ""
          }`}
          onClick={handleConfirmClick}
          disabled={loading || selectedSubjects.length === 0}
        >
          {loading ? t("processing") : t("Confirm")}
        </IonButton>
      </div>
    </div>
  );
};

export default SubjectSelectionComponent;
