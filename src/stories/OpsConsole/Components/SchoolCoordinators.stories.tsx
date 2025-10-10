//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import SchoolCoordinatorsComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolCoordinators";
import { CoordinatorInfo } from "../../../common/constants";
const createMockCoordinator = (
  id: string,
  name: string,
  gender: string,
  phone: string,
  email: string
): CoordinatorInfo => {
  return {
  id,
  name,
  gender,
  phone,
  email,
  student_id: null,
  age: null,
  avatar: null,
  created_at: new Date().toISOString(),
  updated_at: null,
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
  reward: null
};
};

const sampleCoordinators: CoordinatorInfo[] = [
  createMockCoordinator(
    "C001",
    "Argus Filch",
    "Male",
    "987-CARE-TAKER",
    "argus.f@hogwarts.staff"
  ),
  createMockCoordinator(
    "C002",
    "Poppy Pomfrey",
    "Female",
    "987-MAT-RON",
    "poppy.p@hogwarts.staff"
  ),
  createMockCoordinator(
    "C003",
    "Irma Pince",
    "Female",
    "987-LIB-RARY",
    "irma.p@hogwarts.staff"
  ),
  createMockCoordinator(
    "C004",
    "Rolanda Hooch",
    "Female",
    "987-FLY-ING",
    "rolanda.h@hogwarts.staff"
  ),
  createMockCoordinator(
    "C005",
    "Gilderoy Lockhart",
    "Male",
    "987-FAM-OUS",
    "gilderoy.l@hogwarts.fanmail"
  ),
  createMockCoordinator(
    "C006",
    "Quirinus Quirrell",
    "Male",
    "987-TUR-BAN",
    "quirinus.q@hogwarts.staff"
  ),
  createMockCoordinator(
    "C007",
    "Horace Slughorn",
    "Male",
    "987-SLU-GCLUB",
    "horace.s@hogwarts.staff"
  ),
];

const meta = {
  title: "SchoolManagement/SchoolCoordinatorsPage",
  component: SchoolCoordinatorsComponent,
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
    schoolId: "sample-hogwarts-id-456",
    data: {
      coordinators: [],
      totalCoordinatorCount: 0,
    },
  },
  argTypes: {
    data: { control: "object" },
    isMobile: { control: "boolean" },
    schoolId: { control: "text" },
  },
} satisfies Meta<typeof SchoolCoordinatorsComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  args: {
    data: {
      coordinators: [],
      totalCoordinatorCount: 0,
    },
  },
};

export const WithCoordinators: Story = {
  args: {
    data: {
      coordinators: sampleCoordinators,
      totalCoordinatorCount: sampleCoordinators.length,
    },
  },
};

export const WithPagination: Story = {
  name: "With More Data for Pagination",
  args: {
    data: {
      coordinators: sampleCoordinators.slice(0, 3),
      totalCoordinatorCount: sampleCoordinators.length,
    },
  },
};

export const MobileView: Story = {
  args: {
    data: {
      coordinators: sampleCoordinators.slice(0, 3),
      totalCoordinatorCount: sampleCoordinators.length,
    },
    isMobile: true,
  },
  parameters: {
    viewport: { defaultViewport: "iphone6" },
  },
};
