import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import SchoolStudentsComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolStudents"; 
import { StudentInfo } from "../../../common/constants";
import { Tables } from "../../../services/database";

type User = Tables<"user">;

const parseSampleClassName = (
  classNameInput: string,
  studentId: string,
  name: string,
  gender: string,
  phone: string,
  parentPhone: string | null = null
): StudentInfo => {
  let grade: number;
  let section: string;

  if (classNameInput.toUpperCase().startsWith("UKG")) {
    grade = 0;
    section = classNameInput.substring(3).trim() || "A";
  } else {
    const match = classNameInput.match(/^(\d+)([A-Z]*)$/i);
    if (match) {
      grade = parseInt(match[1], 10);
      section = match[2]?.toUpperCase() || "A";
    } else {
      grade = 1;
      section = classNameInput.toUpperCase().substring(0, 1) || "A";
    }
  }

  const createMockParent = (
    studentName: string,
    phone: string | null
  ): User | null => {
    if (!phone) return null;
    const parentName = studentName.split(" ")[0] + " Parent";

    return {
      id: `P_${studentId}`,
      name: parentName,
      email: `${parentName.replace(/\s+/g, ".").toLowerCase()}@example.com`,
      phone: phone,
    } as User;
  };

  return {
    user: {
      id: studentId,
      student_id: studentId,
      name: name,
      gender: gender,
      phone: phone,
      email: `${name.replace(/\s+/g, ".").toLowerCase()}@example.com`,
    } as User,
    grade: grade,
    classSection: section,
    parent: createMockParent(name, parentPhone),
  };
};

const sampleApiStudents: StudentInfo[] = [
  parseSampleClassName(
    "5A",
    "S001",
    "Alice Wonderland",
    "Female",
    "123-456-7890",
    "111-222-3333"
  ),
  parseSampleClassName(
    "5B",
    "S002",
    "Bob The Builder",
    "Male",
    "234-567-8901",
    "444-555-6666"
  ),
  parseSampleClassName(
    "UKG C",
    "S003",
    "Charlie Brown",
    "Male",
    "345-678-9012"
  ),
];

const meta = {} satisfies Meta<typeof SchoolStudentsComponent>;

export default meta;
