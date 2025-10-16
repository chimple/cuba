//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import SchoolTeachersComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolTeachers"; // Adjust path
import { TeacherInfo } from "../../../common/constants";
const createMockTeacher = (
  id: string,
  name: string,
  gender: string,
  phone: string,
  email: string,
  grade: number,
  classSection: string
): TeacherInfo => {
  return {
    user: {
      id,
      name,
      gender,
      phone,
      email,
      student_id: null,
      age: null,
      avatar: null,
      created_at: new Date().toISOString(),
      curriculum_id: null,
      fcm_token: null,
      firebase_id: `fb_${id}`,
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
      stars: 0,
      updated_at: null,
      reward: null
    },
    grade,
    classSection,
  };
};

const sampleApiTeachers: TeacherInfo[] = [
  createMockTeacher(
    "T001",
    "Albus Dumbledore",
    "Male",
    "001-HOG-WARTS",
    "albus.d@hogwarts.wiz",
    0,
    "Headmaster"
  ),
  createMockTeacher(
    "T002",
    "Minerva McGonagall",
    "Female",
    "002-HOG-WARTS",
    "minerva.m@hogwarts.wiz",
    7,
    "Gryffindor"
  ),
  createMockTeacher(
    "T003",
    "Severus Snape",
    "Male",
    "003-HOG-WARTS",
    "severus.s@hogwarts.wiz",
    0,
    "Potions Master"
  ),
  createMockTeacher(
    "T004",
    "Rubeus Hagrid",
    "Male",
    "004-HOG-WARTS",
    "rubeus.h@hogwarts.wiz",
    1,
    "Care of Magical Creatures"
  ),
  createMockTeacher(
    "T005",
    "Filius Flitwick",
    "Male",
    "005-HOG-WARTS",
    "filius.f@hogwarts.wiz",
    5,
    "Charms"
  ),
  createMockTeacher(
    "T006",
    "Pomona Sprout",
    "Female",
    "006-HOG-WARTS",
    "pomona.s@hogwarts.wiz",
    2,
    "Herbology"
  ),
  createMockTeacher(
    "T007",
    "Sybill Trelawney",
    "Female",
    "007-HOG-WARTS",
    "sybill.t@hogwarts.wiz",
    3,
    "Divination"
  ),
];

const meta = {
  title: "SchoolManagement/SchoolTeachersPage",
  component: SchoolTeachersComponent,
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
    schoolId: "sample-hogwarts-id",
    data: {
      teachers: [],
      totalTeacherCount: 0,
    },
  },
  argTypes: {
    data: { control: "object" },
    isMobile: { control: "boolean" },
    schoolId: { control: "text" },
  },
} satisfies Meta<typeof SchoolTeachersComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  args: {
    data: {
      teachers: [],
      totalTeacherCount: 0,
    },
  },
};

export const WithTeachers: Story = {
  args: {
    data: {
      teachers: sampleApiTeachers,
      totalTeacherCount: sampleApiTeachers.length,
    },
  },
};

export const MobileView: Story = {
  args: {
    data: {
      teachers: sampleApiTeachers.slice(0, 3),
      totalTeacherCount: sampleApiTeachers.length,
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
      teachers: sampleApiTeachers,
      totalTeacherCount: sampleApiTeachers.length,
    },
  },
  name: "With Data (Filtering Testable)",
};

export const Searchable: Story = {
  args: {
    data: {
      teachers: sampleApiTeachers,
      totalTeacherCount: sampleApiTeachers.length,
    },
  },
  name: "With Data (Search Testable)",
};
