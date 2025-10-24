//@ts-nocheck
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
  parseSampleClassName(
    "4A",
    "S004",
    "Diana Prince",
    "Female",
    "456-789-0123",
    "777-888-9999"
  ),
  parseSampleClassName("4A", "S005", "Clark Kent", "Male", "567-890-1234"),
  parseSampleClassName(
    "3B",
    "S006",
    "Bruce Wayne",
    "Male",
    "678-901-2345",
    "123-123-1234"
  ),
];

const meta = {
  title: "OpsConsole/Components/SchoolStudents",
  component: SchoolStudentsComponent,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  tags: ["autodocs"],
  args: {
    isMobile: false,
    schoolId: "sample-chimple-school-id",
    data: {
      students: [],
      totalStudentCount: 0,
    },
  },
  argTypes: {
    data: { control: "object" },
    isMobile: { control: "boolean" },
    schoolId: { control: "text" },
  },
} satisfies Meta<typeof SchoolStudentsComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  args: {
    data: {
      students: [],
      totalStudentCount: 0,
    },
  },
};

export const WithStudents: Story = {
  args: {
    data: {
      students: sampleApiStudents,
      totalStudentCount: sampleApiStudents.length,
    },
  },
};

export const MobileView: Story = {
  args: {
    data: {
      students: sampleApiStudents.slice(0, 3),
      totalStudentCount: sampleApiStudents.length,
    },
    isMobile: true,
  },
  parameters: {
    viewport: { defaultViewport: "iphone6" },
  },
};
