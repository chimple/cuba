import { Meta, StoryObj } from "@storybook/react";
import { SCHOOL_USERS, TableTypes } from "../../../common/constants";
import SchoolUserDetail from "../../components/schoolUsers/SchoolUserDetail";

const mockUser: TableTypes<"user"> = {
  id: "user-1",
  name: "John Doe",
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
};

const meta: Meta<typeof SchoolUserDetail> = {
  title: "/components/schoolUsers/SchoolUserDetail",
  component: SchoolUserDetail,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    userType: {
      control: "select",
      options: Object.values(SCHOOL_USERS),
    },
    user: {
      control: "object",
    },
  },
};

export default meta;

type Story = StoryObj<typeof SchoolUserDetail>;

export const DefaultUser: Story = {
  args: {
    user: { ...mockUser, image: "" },
    schoolId: "school-1",
    userType: SCHOOL_USERS.PRINCIPALS,
  },
};

export const UserWithImage: Story = {
  args: {
    user: {
      ...mockUser,
      name: "Jane Doe",
      image: "assets/avatars/rabbit.png",
    },
    schoolId: "school-2",
    userType: SCHOOL_USERS.COORDINATORS,
  },
};

export const AnotherRole: Story = {
  args: {
    user: { ...mockUser, name: "Emily Johnson" },
    schoolId: "school-3",
    userType: SCHOOL_USERS.SPONSORS,
  },
};
