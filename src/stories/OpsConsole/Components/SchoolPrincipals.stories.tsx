//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
import SchoolPrincipalsComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolPrincipals"; // Adjust path
import { PrincipalInfo } from "../../../common/constants"; // Adjust path if needed
const createMockPrincipal = (
  id: string,
  name: string,
  gender: string,
  phone: string,
  email: string
): PrincipalInfo => {
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
const samplePrincipals: PrincipalInfo[] = [
  createMockPrincipal(
    "P001",
    "Principal Skinner",
    "Male",
    "555-1234",
    "skinner@springfield.edu"
  ),
  createMockPrincipal(
    "P002",
    "Angela Li",
    "Female",
    "555-5678",
    "angela.li@lawndalehigh.org"
  ),
  createMockPrincipal(
    "P003",
    "Mr. Richard Belding",
    "Male",
    "555-8765",
    "belding@baysidehigh.edu"
  ),
  createMockPrincipal(
    "P004",
    "Principal Prickly",
    "Male",
    "555-4321",
    "prickly@thirdstreet.edu"
  ),
  createMockPrincipal(
    "P005",
    "Dean Hardscrabble",
    "Female",
    "555-9900",
    "hardscrabble@monstersu.edu"
  ),
];

const meta = {
  title: "SchoolManagement/SchoolPrincipalsPage",
  component: SchoolPrincipalsComponent,
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
      principals: [],
      totalPrincipalCount: 0,
    },
  },
  argTypes: {
    data: { control: "object" },
    isMobile: { control: "boolean" },
    schoolId: { control: "text" },
  },
} satisfies Meta<typeof SchoolPrincipalsComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  args: {
    data: {
      principals: [],
      totalPrincipalCount: 0,
    },
  },
};

export const WithPrincipals: Story = {
  args: {
    data: {
      principals: samplePrincipals,
      totalPrincipalCount: samplePrincipals.length,
    },
  },
};

export const MobileView: Story = {
  args: {
    data: {
      principals: samplePrincipals.slice(0, 2),
      totalPrincipalCount: samplePrincipals.length,
    },
    isMobile: true,
  },
  parameters: {
    viewport: { defaultViewport: "iphone6" },
  },
};
