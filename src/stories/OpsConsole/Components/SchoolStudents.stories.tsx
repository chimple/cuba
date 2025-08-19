import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import SchoolStudentsComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolStudents"; // Adjust path
import { StudentInfo } from "../../../common/constants";
const parseSampleClassName = (
  classNameInput: string,
  studentId: string,
  name: string,
  gender: string,
  phone: string
): StudentInfo => {
  let grade: number;
  let section: string;

  if (classNameInput.toUpperCase().startsWith("UKG")) {
    grade = 0;
    section = classNameInput.substring(3).trim() || "A";
  } else if (classNameInput.toUpperCase().startsWith("LKG")) {
    grade = -1;
    section = classNameInput.substring(3).trim() || "A";
  } else if (classNameInput === "10") {
    grade = 10;
    section = "A";
  } else if (classNameInput.toUpperCase() === "SECTION BLUE") {
    grade = 1;
    section = "BLUE";
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

  return {
    user: {
      id: studentId,
      student_id: studentId,
      name: name,
      gender: gender,
      phone: phone,
      age: null,
      avatar: null,
      created_at: new Date().toISOString(),
      curriculum_id: null,
      email: `${name.replace(/\s+/g, ".").toLowerCase()}@example.com`,
      fcm_token: null,
      firebase_id: `fb_${studentId}`,
      updated_at: null,

      grade_id: null,
      image: null,
      is_deleted: false,
      is_firebase: false,
      is_ops: false,
      is_tc_accepted: true,
      language_id: null,
      learning_path: null,
      music_off: false,
      ops_created_by: null,
      sfx_off: false,
      stars: Math.floor(Math.random() * 100),
    },
    grade: grade,
    classSection: section,
  };
};

const sampleApiStudents: StudentInfo[] = [
  parseSampleClassName(
    "5A",
    "S001",
    "Alice Wonderland",
    "Female",
    "123-456-7890"
  ),
  parseSampleClassName("5B", "S002", "Bob The Builder", "Male", "234-567-8901"),
  parseSampleClassName(
    "UKG C",
    "S003",
    "Charlie Brown",
    "Male",
    "345-678-9012"
  ),
  parseSampleClassName("10", "S004", "Diana Prince", "Female", "456-789-0123"),
  parseSampleClassName(
    "Section Blue",
    "S005",
    "Edward Scissorhands",
    "Male",
    "567-890-1234"
  ),
  parseSampleClassName("3B", "S006", "Fiona Apple", "Female", "678-901-2345"),
  parseSampleClassName("12A", "S007", "George Jetson", "Male", "789-012-3456"),
  parseSampleClassName(
    "LKG",
    "S008",
    "Hellen Keller",
    "Female",
    "890-123-4567"
  ),
];

const meta = {
  title: "SchoolManagement/SchoolStudentsPage",
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
    schoolId: "sample-school-id-123",
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

export const WithActiveFilters: Story = {
  args: {
    data: {
      students: sampleApiStudents,
      totalStudentCount: sampleApiStudents.length,
    },
  },
  name: "With Data (Filtering Testable)",
};

export const Searchable: Story = {
  args: {
    data: {
      students: sampleApiStudents,
      totalStudentCount: sampleApiStudents.length,
    },
  },
  name: "With Data (Search Testable)",
};
