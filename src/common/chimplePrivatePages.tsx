import { lazy } from "react";

export const FallbackComponent: React.FC = () => {
  return <div>This page is not available.</div>;
};

export const TestPage1 = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/test");
  } catch (error) {
    return { default: FallbackComponent };
  }
});

export const HomePage = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/HomePage");
  } catch (error) {
    return { default: FallbackComponent };
  }
});

export const DisplaySchools = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/DisplaySchools");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ClassUsers = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/ClassUsers");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ManageSchools = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/ManageSchools");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ManageClass = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/ManageClass");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const EditSchool = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/EditSchool");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ReqEditSchool = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/ReqEditSchool");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const SchoolProfile = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/SchoolProfile");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const AddSchool = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/EditSchool");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ReqAddSchool = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/ReqEditSchool");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const AddClass = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/EditClass");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const EditClass = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/EditClass");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ClassProfile = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/ClassProfile");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const StudentProfile = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/StudentProfile");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ShowChapters = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/ShowChapters");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const SearchLessons = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/SearchLessons");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const LessonDetails = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/LessonDetails");
  } catch (error) {
    return { default: FallbackComponent };
  }
});

export const TestPage2 = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/test1");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const AddStudent = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/AddStudent");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const UserProfile = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/UserProfile");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const SubjectSelection = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/SubjectSelection");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const DisplayClasses = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/DisplayClasses");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const DashBoardDetails = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/DashBoardDetails");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const AddTeacher = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/AddTeacher");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const TeacherProfile = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/TeacherProfile");
  } catch (error) {
    return { default: FallbackComponent };
  }
});

export const StudentReport = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/StudentReport");
  } catch (error) {
    return { default: FallbackComponent };
  }
});

export const SchoolUsers = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/SchoolUsers");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const AddSchoolUser = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../teachers-module/pages/AddSchoolUser");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
