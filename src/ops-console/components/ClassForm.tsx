import React, { useEffect, useState } from "react";
import "./ClassForm.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";

const ClassForm: React.FC<{
  onClose: () => void;
  mode: "create" | "edit";
  classData?: any;
  schoolId?: string;
}> = ({ onClose, mode, classData, schoolId }) => {
  const [formValues, setFormValues] = useState<any>({
    grade: "",
    section: "",
    subjectGrade: "",
    curriculum: "",
    studentCount: "",
    groupId: "",
  });

  const [grades, setGrades] = useState<any[]>([]);
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    if (mode === "edit" && classData) {
      setFormValues({
        grade: (classData.name || "").replace(/[^0-9]/g, "") || "",
        section: (classData.name || "").replace(/[0-9]/g, "") || "",
        subjectGrade: classData.courses[0].grade_id ?? "",
        curriculum: classData.curriculum ?? "",
        studentCount: classData.studentCount ?? "0",
        groupId: classData.group_id ?? "",
      });
    } else {
      setFormValues({
        grade: "",
        section: "",
        subjectGrade: "",
        curriculum: "",
        studentCount: "",
        groupId: "",
      });
    }
  }, [mode, classData]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoading(true);
      try {
        const [gradesRes, curriculumsRes] = await Promise.all([
          api.getAllGrades(),
          api.getAllCurriculums(),
        ]);

        setGrades(gradesRes || []);
        setCurriculums(curriculumsRes || []);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev: any) => ({ ...prev, [name]: value }));
  };

  const isFormValid =
    (formValues.grade || "").toString().trim() !== "" &&
    (formValues.section || "").toString().trim() !== "" &&
    (formValues.subjectGrade || "").toString().trim() !== "" &&
    (formValues.curriculum || "").toString().trim() !== "";

  const handleSubmit = async () => {
    if (!isFormValid) return;
    try {
      let classId = classData?.id;
      console.log("classId", classId);
      if (mode === "edit") {
        if (!classId) {
          console.error("Class ID is missing.");
          return;
        }
        await api.updateClass(
          classId,
          formValues.grade + formValues.section,
          formValues.groupId
        );
      } else if (mode === "create") {
        if (!schoolId) {
          console.error("School ID is required to create a class.");
          return;
        }
        const newClass = await api.createClass(
          schoolId,
          formValues.grade + formValues.section,
          formValues.groupId
        );
        classId = newClass.id;
      }

      const allCourse = await api.getCourseByUserGradeId(
        formValues.subjectGrade,
        formValues.curriculum
      );
      await api.updateClassCourseSelection(
        classId,
        allCourse.map((c: any) => c.id)
      );
    } catch (error) {
      console.error("Error creating/updating class:", error);
    }
    onClose();
  };

  return (
    <div className="class-form-overlay">
      <div className="class-form-container">
        <div className="class-form-title">
          {mode === "edit"
            ? `Class ${formValues.grade || ""} - ${formValues.section || ""}`
            : t("Create Class")}
        </div>

        <div className="class-form-row">
          <div className="class-form-group">
            <label>
              {t("Grade")} <span className="class-form-required">*</span>
            </label>
            <input
              name="grade"
              type="number"
              min={1}
              max={10}
              value={formValues.grade || ""}
              onChange={handleChange}
              placeholder={t("Enter Grade")??""} 
            />
          </div>

          <div className="class-form-group">
            <label>
              {t("Class Section")} <span className="class-form-required">*</span>
            </label>
            <input
              name="section"
              type="text"
              value={formValues.section || ""}
              onChange={handleChange}
              placeholder={t("Enter Class Section")??""} 
            />
          </div>
        </div>

        <div className="class-form-group class-form-full-width">
          <label>
            {t("Subject Grade")} <span className="class-form-required">*</span>
          </label>
          <div className="class-form-select-wrapper">
            <select
              name="subjectGrade"
              value={formValues.subjectGrade || ""}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="" disabled>
                {t("Select Subject Grade")}
              </option>
              {grades.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name ?? g.value}
                </option>
              ))}
            </select>

            <img
              src="/assets/loginAssets/DropDownArrow.svg"
              alt="Dropdown"
              className="class-form-dropdown-icon"
            />
          </div>
        </div>

        <div className="class-form-group class-form-full-width">
          <label>
            {t("Curriculum")} <span className="class-form-required">*</span>
          </label>
          <div className="class-form-select-wrapper">
            <select
              name="curriculum"
              value={formValues.curriculum || ""}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="" disabled>
                {t("Select Curriculum")}
              </option>
              {curriculums.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <img
              src="/assets/loginAssets/DropDownArrow.svg"
              alt="Dropdown"
              className="class-form-dropdown-icon"
            />
          </div>
        </div>

        <div className="class-form-group class-form-full-width">
          <label>WhatsApp Group ID</label>
          <input
            name="groupId"
            type="text"
            value={formValues.groupId || ""}
            onChange={handleChange}
            placeholder={t("Enter WhatsApp Group ID")??""}
          />
        </div>
        <div className="class-form-button-row">
          <button className="class-form-cancel-btn" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button
            className="class-form-save-btn"
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
          >
            {mode === "edit" ? t("Save") : t("Create Class")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassForm;
