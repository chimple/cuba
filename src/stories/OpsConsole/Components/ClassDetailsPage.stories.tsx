//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Box, Button, useMediaQuery } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import ClassInfoCard from "../../../ops-console/components/SchoolDetailsComponents/ClassInfoCard";
import SchoolStudents from "../../../ops-console/components/SchoolDetailsComponents/SchoolStudents";
import "../../../ops-console/components/SchoolDetailsComponents/ClassDetailsPage.css";

const ClassDetailsPageLayout = ({
  isMobile,
  classInfo,
  schoolId,
  studentsData,
  customTitle,
  optionalGrade,
  optionalSection,
  showFilter,
}: any) => {
  const _isMobile = isMobile ?? useMediaQuery("(max-width: 768px)");

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "grey.50", minHeight: "100vh" }}>
      <Button
        variant="text"
        startIcon={<ArrowBack />}
        onClick={() => alert("Go back")}
        sx={{
          textTransform: "none",
          mb: 1,
          background: "#fff",
          color: "#111",
          border: "1px solid #e5e7eb",
          borderRadius: "5px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          px: 1.5,
          py: 0.5,
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        Back to Classes
      </Button>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          alignItems: "start",
          mb: 3,
        }}
      >
        <ClassInfoCard
          classname={classInfo.classname}
          subjects={classInfo.subjects}
          curriculum={classInfo.curriculum}
          totalStudents={classInfo.totalStudents}
          activeStudents={classInfo.activeStudents}
          classCode={classInfo.classCode}
        />
      </Box>

      <Box
        className="students-sticky"
        sx={{
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid #e5e7eb",
          borderRadius: "5px",
          bgcolor: "#fff",
        }}
      >
        <SchoolStudents
          data={studentsData}
          schoolId={schoolId}
          isMobile={_isMobile}
          isTotal={false}
          isFilter={!!showFilter}
          customTitle={customTitle}
          optionalGrade={optionalGrade}
          optionalSection={optionalSection}
        />
      </Box>
    </Box>
  );
};

const meta: Meta<typeof ClassDetailsPageLayout> = {
  title: "ClassDetails/ClassDetailsPage",
  component: ClassDetailsPageLayout,
  argTypes: {
    isMobile: { control: "boolean" },
    schoolId: { control: "text" },
    customTitle: { control: "text" },
    optionalGrade: { control: "number" },
    optionalSection: { control: "text" },
    showFilter: { control: "boolean" },
    classInfo: { control: "object" },
    studentsData: { control: "object" },
  },
};
export default meta;

type Story = StoryObj<typeof ClassDetailsPageLayout>;

export const FullPage: Story = {
  args: {
    isMobile: false,
    schoolId: "-",
    customTitle: "Students in Class",
    optionalGrade: 2,
    optionalSection: "B",
    showFilter: false,
    classInfo: {
      classname: "2B",
      subjects: "Maths, English, Hindi, Digital Skills, Kannada",
      curriculum: "Chimple",
      totalStudents: "25",
      activeStudents: "18",
      classCode: "154891",
    },
    studentsData: {
      totalStudentCount: 4,
      students: [
        {
          student_id: "STD01",
          name: "Aarav",
          gender: "male",
          grade: "2",
          section: "B",
          phone: 1234567890,
        },
        {
          student_id: "STD02",
          name: "Dia",
          gender: "female",
          grade: "2",
          section: "B",
          phone: 1234567890,
        },
        {
          student_id: "STD03",
          name: "Ishan",
          gender: "male",
          grade: "2",
          section: "B",
          phone: 1234567890,
        },
        {
          student_id: "STD04",
          name: "Meera",
          gender: "female",
          grade: "2",
          section: "B",
          phone: 1234567890,
        },
      ],
    },
  },
};
