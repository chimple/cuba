import { Meta, StoryObj } from "@storybook/react";
import { SCHOOL_USERS, TableTypes } from "../../../common/constants";
import SchoolUserList from "../../components/schoolUsers/SchoolUserList";

// Mock data for the school
const mockSchoolDoc: TableTypes<"school"> = {
  id: "school-1",
  name: "Sample School",
  group1: "Main Road",
  group2: "District X",
  group3: "State Y",
  created_at: "2023-01-01T12:00:00Z",
  updated_at: "2023-01-01T12:00:00Z",
  is_deleted: false,
  image: null,
};

// Mock user data
const mockUsers: TableTypes<"user">[] = [
  {
    id: "1",
    name: "John Principal",
    image: null,
    created_at: "2023-01-01T12:00:00Z",
    updated_at: "2023-01-01T12:00:00Z",
    is_deleted: false,
    age: null,
    avatar: null,
    curriculum_id: null,
    email: null,
    fcm_token: null,
    gender: null,
    grade_id: null,
    is_tc_accepted: null,
    language_id: null,
    music_off: null,
    phone: null,
    sfx_off: null,
    student_id: null,
  },
  {
    id: "2",
    name: "Jane Coordinator",
    image: null,
    created_at: "2023-01-01T12:00:00Z",
    updated_at: "2023-01-01T12:00:00Z",
    is_deleted: false,
    age: null,
    avatar: null,
    curriculum_id: null,
    email: null,
    fcm_token: null,
    gender: null,
    grade_id: null,
    is_tc_accepted: null,
    language_id: null,
    music_off: null,
    phone: null,
    sfx_off: null,
    student_id: null,
  },
];

const meta: Meta<typeof SchoolUserList> = {
  title: "components/schoolUsers/SchoolUserList",
  component: SchoolUserList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    userType: {
      control: "select",
      options: Object.values(SCHOOL_USERS),
    },
    schoolDoc: {
      control: "object",
    },
  },
};

export default meta;

type Story = StoryObj<typeof SchoolUserList>;

export const PrincipalsList: Story = {
  args: {
    schoolDoc: mockSchoolDoc,
    userType: SCHOOL_USERS.PRINCIPALS,
  },
};

export const CoordinatorsList: Story = {
  args: {
    schoolDoc: mockSchoolDoc,
    userType: SCHOOL_USERS.COORDINATORS,
  },
};

export const EmptyList: Story = {
  args: {
    schoolDoc: mockSchoolDoc,
    userType: SCHOOL_USERS.SPONSORS,
  },
};
