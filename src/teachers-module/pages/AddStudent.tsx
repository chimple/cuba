import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import "./AddStudent.css";
import Header from "../components/homePage/Header";
import { AVATARS, PAGES, TableTypes } from "../../common/constants";
import AddStudentSection from "../components/AddStudentSection";
import { ServiceConfig } from "../../services/ServiceConfig";
import { t } from "i18next";
import { Util } from "../../utility/util";
import ProfileDetails from "../components/library/ProfileDetails";
import Loading from "../../components/Loading";
import { RoleType } from "../../interface/modelInterfaces";

const AddStudent: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{
    classDoc: TableTypes<"class">;
    school: TableTypes<"school">;
  }>();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [languages, setLanguages] = useState<
    Array<{ label: string; value: string; id: string }>
  >([]);
  const [currentClass, setCurrentClass] = useState<TableTypes<"class">>();
  const [currentSchool, setCurrentSchool] = useState<TableTypes<"school">>();
  const api = ServiceConfig.getI()?.apiHandler;
  const [curriculumId, setCurriculumId] = useState<string | null>(null);
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { classDoc, school } = location.state || {};

  useEffect(() => {
    fetchClassDetails();
    fetchLanguages();
  }, []);
  useEffect(() => {
    validateForm();
  }, [fullName, age, gender, studentId, language]);

  const fetchLanguages = async () => {
    try {
      const fetchedLanguages: TableTypes<"language">[] =
        await api.getAllLanguages();
      const sanitizedLanguages = fetchedLanguages
        .filter((lang) => lang.code && lang.name && lang.id)
        .map((lang) => ({
          label: lang.name,
          value: lang.code as string,
          id: lang.id as string,
        }));

      setLanguages(sanitizedLanguages);
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  };

  const handleBack = () => {
    history.replace(PAGES.CLASS_USERS, classDoc);
  };
  const fetchClassDetails = async () => {
    try {
      if (school) setCurrentSchool(school);
      if (classDoc) setCurrentClass(classDoc);
    } catch (error) {
      console.error("Failed to load class details", error);
    }
  };
  if (!currentClass?.id) {
    console.error("No current class selected.");
    return null;
  }
  const getRandomAvatar = () => {
    if (AVATARS.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * AVATARS.length);
    return AVATARS[randomIndex];
  };
  function validateForm() {
    const isValid = fullName && age && gender && studentId && language;
    setIsFormValid(!!isValid);
  }
  const handleSave = async () => {
    if (!isFormValid || loading) return;
    setLoading(true);

    const finalProfilePic = profilePic || getRandomAvatar();
    const selectedLanguage = languages.find((lang) => lang.value === language);
    const languageId = selectedLanguage?.id || "";

    try {
      const courses = await api.getCoursesByClassId(currentClass.id);
      if (courses.length === 0) {
        throw new Error("No courses found for the selected class.");
      }
      const firstCourseId = courses[0].course_id;
      const courseDetails = await api.getCourse(firstCourseId);
      if (!courseDetails) {
        throw new Error("Failed to fetch course details.");
      }
      const curriculumId = courseDetails.curriculum_id;
      const gradeId = courseDetails.grade_id;

      await api.createStudentProfile(
        fullName,
        parseInt(age, 10),
        gender,
        finalProfilePic || "",
        profilePic || "", // image
        curriculumId, // curriculum
        gradeId, // grade
        languageId,
        currentClass?.id,
        "student",
        studentId
      );

      handleBack();
    } catch (error) {
      console.error("Error adding student:", error);
    } finally {
      setLoading(false);
    }
  };
  const resizeImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    callback: (result: string) => void
  ) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.floor((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.floor((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8); // Adjust quality to 0.8 (80%)
        // Log the estimated size of the base64 image
        const base64Length = resizedDataUrl.length * (3 / 4); // Base64 is approximately 33% larger
        const fileSizeInKB = base64Length / 1024; // Convert size to KB
        console.log(`Resized image size: ${fileSizeInKB.toFixed(2)} KB`);
        callback(resizedDataUrl);
      };
    };

    reader.onerror = (error) => {
      console.error("Error resizing image:", error);
    };
  };
  const handleProfilePicChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const maxWidth = 300;
        const maxHeight = 300;

        // Check if image dimensions are already within the required limits
        if (img.width <= maxWidth && img.height <= maxHeight) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            setProfilePic(reader.result as string);
          };
        } else {
          // Resize image if it's larger than the maximum dimensions
          resizeImage(file, maxWidth, maxHeight, (resizedBase64Image) => {
            setProfilePic(resizedBase64Image);
          });
        }
      };
    }
  };
  // const placeholderImgBase64 = "data:image/png;base64,....";
  if (loading) {
    return <Loading isLoading={true} />;
  }

  return (
    <div className="main-page">
      <Header
        isBackButton={true}
        showSchool={true}
        showClass={true}
        className={currentClass.name}
        schoolName={currentSchool?.name}
        onBackButtonClick={handleBack}
      />
      <div className="profile-details-container">
        <ProfileDetails
          imgSrc={profilePic || ""}
          imgAlt="Profile Pic"
          onImageChange={handleProfilePicChange}
          isEditMode={true}
        />
      </div>
      <h2 className="title">{t("Add Student")}</h2>
      <AddStudentSection
        languageOptions={languages}
        fullName={fullName}
        age={age}
        gender={gender}
        studentId={studentId}
        language={language}
        onFullNameChange={(value) => {
          setFullName(value);
        }}
        onAgeChange={(value) => {
          setAge(value);
        }}
        onGenderChange={(value) => {
          setGender(value);
        }}
        onStudentIdChange={(value) => {
          setStudentId(value);
        }}
        onLanguageChange={(selectedLanguageId) => {
          setLanguage(selectedLanguageId);
        }}
      />
      <div className="form-actions">
        <button
          className={`add-button ${!isFormValid ? "disabled" : ""}`}
          type="button"
          onClick={handleSave}
          disabled={!isFormValid}
        >
          {t("Add")}
        </button>
      </div>
    </div>
  );
};

export default AddStudent;
