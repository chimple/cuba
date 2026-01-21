import React, { useEffect, useState, useRef } from "react";
import "./ClassForm.css";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";

const ClassForm: React.FC<{
  onClose: () => void;
  mode: "create" | "edit";
  classData?: any;
  schoolId?: string;
  whatspAppBotNumber?: string;
  onSaved?: () => void;
}> = ({ onClose, mode, classData, schoolId,whatspAppBotNumber, onSaved }) => {
  const [formValues, setFormValues] = useState<any>({
    grade: "",
    section: "",
    whatsapp_invite_link: "",
  });

  const [resolvedGroupId, setResolvedGroupId] = useState<string>("");
  const [AllCourses, setAllCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const api = ServiceConfig.getI().apiHandler;

  useEffect(() => {
    if (mode === "edit" && classData) {
      const grade = (classData.name || "").replace(/[^0-9]/g, "");
      const section = (classData.name || "").replace(/[0-9]/g, "");

      setFormValues({
        grade: grade || "",
        section: section || "",
        whatsapp_invite_link: classData.whatsapp_invite_link ?? "",
      });
      setResolvedGroupId(classData.group_id ?? "");
      setSelectedCourse(classData.courses.map((c: any) => c.id));
    }
  }, [mode, classData]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoading(true);
      try {
        const schoolCourse = await api.getCoursesBySchoolId(schoolId ?? "");

        if (!schoolCourse?.length) {
          setErrorMessage("No Courses available in this school.");
          setAllCourses([]);
          setLoading(false);
          return;
        }

        const courseIds = schoolCourse.map((item: any) => item.course_id);

        const courseDetails = await api.getCourses(courseIds);
        setAllCourses(courseDetails);

        const curriculumIds = [
          ...new Set(courseDetails.map((c: any) => c.curriculum_id)),
        ];
        const gradeIds = [
          ...new Set(courseDetails.map((c: any) => c.grade_id)),
        ];

        const [curriculums, grades] = await Promise.all([
          api.getCurriculumsByIds(curriculumIds),
          api.getGradesByIds(gradeIds),
        ]);

        const curriculumMap = new Map(
          curriculums.map((c: any) => [c.id, c.name])
        );
        const gradeMap = new Map(grades.map((g: any) => [g.id, g.name]));

        // Merge into display-ready structure
        const coursesWithNames = courseDetails.map((course: any) => ({
          ...course,
          curriculum_name: curriculumMap.get(course.curriculum_id) || "",
          grade_name: gradeMap.get(course.grade_id) || "",
        }));

        setAllCourses(coursesWithNames);

        if (mode === "edit" && classData?.Courses) {
          setSelectedCourse(classData.Courses.map((c: any) => c.course_id));
        }

        setErrorMessage("");
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, [schoolId, mode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelectCourse = (id: string) => {
    setSelectedCourse((prev: string[]) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const isFormValid =
    formValues.grade.trim() !== "" &&
    selectedCourse.length > 0 &&
    !(
      mode === "edit" &&
      classData?.name === formValues.grade + formValues.section &&
      formValues.whatsapp_invite_link.trim() === classData?.whatsapp_invite_link?.trim()&&
      JSON.stringify(classData?.courses?.map((c: any) => c.id)) ===
        JSON.stringify(selectedCourse)
    );


  const placeholder =
    selectedCourse.length > 0
      ? `${selectedCourse.length} Subjects Selected`
      : t("Select Courses");

  const normalizeWhatsAppInviteLink = (raw: string): string => {
        if (!raw) return "";

        const trimmed = raw.trim();

        // take everything after the last "/"
        const parts = trimmed.split("/");
        const code = parts[parts.length - 1];

        if (!code) return "";

        return `https://chat.whatsapp.com/invite/${code}`;
  };

  const didInviteLinkChange =
  mode === "edit" &&
  normalizeWhatsAppInviteLink(formValues.whatsapp_invite_link) !==
    (classData?.invite_link ?? "");


  const handleSubmit = async () => {
    if (!isFormValid) return;
    if (!schoolId) return;

    setSaving(true);
    try {
      let classId = classData?.id;
      const name = formValues.grade + formValues.section;
      if (mode === "create" || classData.name !== name) {
        const classes = await api.getClassesBySchoolId(schoolId);
        if (classes.find((c: any) => c.name === name)) {
          setErrorMessage("Class name already exists.");
          setSaving(false);
          return;
        }
      }

      if (mode === "edit") {
          const normalizedInviteLink = normalizeWhatsAppInviteLink(
            formValues.whatsapp_invite_link
          );

          if (!normalizedInviteLink) {
            setErrorMessage("Invalid WhatsApp Invite Link.");
            setSaving(false);
            return;
          }

          let groupIdToStore = resolvedGroupId; // 👈 default = reuse old

          // 🔁 Only re-resolve if link actually changed
          if (didInviteLinkChange) {
            try {
              const gId = await api.getGroupIdByInvite(
                normalizedInviteLink,
                whatspAppBotNumber || ""
              );

              if (!gId?.group_id) {
                setErrorMessage("Invalid WhatsApp Invite Link.");
                setSaving(false);
                return;
              }

              groupIdToStore = gId.group_id;
              setResolvedGroupId(gId.group_id);

            } catch (e) {
              console.error("getGroupIdByInvite failed", e);
              setErrorMessage("Failed to resolve WhatsApp group.");
              setSaving(false);
              return;
            }
          }

          // 🔄 Update class with BOTH values
          await api.updateClass(
            classId,
            name,
            groupIdToStore,        // 👈 group_id (new or reused)
            normalizedInviteLink  // 👈 invite_link (always canonical)
          );
        } else {
              const normalizedInviteLink = normalizeWhatsAppInviteLink( formValues.whatsapp_invite_link);
              let groupIdToStore = "";
              try {
                const gId = await api.getGroupIdByInvite(
                  normalizedInviteLink,
                  whatspAppBotNumber || ""
                );

                if (!gId?.group_id) {
                  setErrorMessage("Invalid WhatsApp Invite Link.");
                  setSaving(false);
                  return;
                }

                groupIdToStore = gId.group_id;
                setResolvedGroupId(gId.group_id);

              } catch (e) {
                console.error("getGroupIdByInvite failed", e);
                setErrorMessage("Failed to resolve WhatsApp group.");
                setSaving(false);
                return;
              }

              const newClass = await api.createClass(
                schoolId,
                name,
                groupIdToStore,                  // ✅ now correct
                normalizedInviteLink // ✅
              );

              classId = newClass.id;
            }
      await api.updateClassCourses(classId, selectedCourse);
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setSaving(false);
    }
    if (onSaved) onSaved();
    onClose();
  };
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="class-form-overlay">
      <div className="class-form-container">
        <div className="class-form-title">
          {mode === "edit"
            ? `Class : ${formValues.grade} ${formValues.section}`
            : t("Create Class")}
        </div>

        <div className="class-form-row">
          <div className="class-form-group">
            <label>
              {t("Grade")}
              <span className="class-form-group-required-star"> *</span>
            </label>
            <input
              name="grade"
              type="number"
              min={1}
              max={10}
              value={formValues.grade}
              onChange={handleChange}
              placeholder={t("Enter Grade") ?? ""}
            />
          </div>

          <div className="class-form-group">
            <label>{t("Class Section")}</label>
            <input
              name="section"
              type="text"
              value={formValues.section}
              onChange={handleChange}
              placeholder={t("Enter Class Section") ?? ""}
            />
          </div>
        </div>

        <div
          className="class-form-group class-form-full-width"
          ref={dropdownRef}
        >
          <label>
            {t("Courses")}
            <span className="class-form-group-required-star"> *</span>
          </label>

          <div
            className="multi-select-input"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            {placeholder}
            <img
              src="/assets/loginAssets/DropDownArrow.svg"
              className={dropdownOpen ? "rotate" : ""}
            />
          </div>

          {dropdownOpen && (
            <div className="class-form-multi-dropdown">
              {[...AllCourses]
                .sort(
                  (a, b) =>
                    a.curriculum_name.localeCompare(b.curriculum_name) ||
                    a.grade_name.localeCompare(b.grade_name) ||
                    a.name.localeCompare(b.name)
                )
                .map((course: any) => (
                  <label key={course.id} className="class-form-multi-option">
                    <div className="class-option-text">
                      <span className="class-form-subject">{course.name}</span>
                      <span className="class-form-sub">
                        {course.curriculum_name} – {course.grade_name}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      className="class-form-checkbox"
                      checked={selectedCourse.includes(course.id)}
                      onChange={() => handleSelectCourse(course.id)}
                    />
                  </label>
                ))}
            </div>
          )}
        </div>

        {errorMessage && <div className="class-form-error">{errorMessage}</div>}

        <div className="class-form-group class-form-full-width">
          <label>WhatsApp Invite Link</label>
          <input
            name="whatsapp_invite_link"
            value={formValues.whatsapp_invite_link}
            onChange={handleChange}
            placeholder={t("Enter WhatsApp Invite Link") ?? ""}
          />
        </div>

        <div className="class-form-button-row">
          <button className="class-form-cancel-btn" onClick={onClose}>
            {t("Cancel")}
          </button>
          <button
            className="class-form-save-btn"
            onClick={handleSubmit}
            disabled={!isFormValid || loading || saving}
          >
            {saving
              ? t("Saving") + "..."
              : mode === "edit"
              ? t("Save")
              : t("Create Class")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassForm;
