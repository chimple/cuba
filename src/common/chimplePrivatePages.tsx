import { lazy } from "react";

export const FallbackComponent: React.FC = () => {
  return <div>This page is not available.</div>;
};

export const TestPage1 = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/test");
  } catch (error) {
    return { default: FallbackComponent };
  }
});

export const HomePage = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/HomePage");
  } catch (error) {
    return { default: FallbackComponent };
  }
});

export const DisplaySchools = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/DisplaySchools");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ClassUsers = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/ClassUsers");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ManageSchools = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/ManageSchools");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ManageClass = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/ManageClass");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const EditSchool = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/EditSchool");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const SchoolProfile = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/SchoolProfile");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const AddSchool = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/AddSchool");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const StudentProfile = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/StudentProfile");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const ShowChapters = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/ShowChapters");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const SearchLessons = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/SearchLessons");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const LessonDetails = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/LessonDetails");
  } catch (error) {
    return { default: FallbackComponent };
  }
});

export const TestPage2 = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/test1");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const AddStudent = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/AddStudent");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
export const UserProfile = lazy(async () => {
  try {
    //@ts-ignore
    return await import("../chimple-private/pages/UserProfile");
  } catch (error) {
    return { default: FallbackComponent };
  }
});
