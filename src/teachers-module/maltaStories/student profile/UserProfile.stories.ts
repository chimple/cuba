import type { Meta, StoryObj } from "@storybook/react";
import UserProfile from "../../components/studentProfile/UserProfile";
import { TableTypes } from "../../../common/constants";

const mockStudent: TableTypes<"user"> = {
  id: "student-1",
  age: 5,
  avatar: "donkey",
  created_at: "2023-01-01T12:00:00Z",
  curriculum_id: null,
  email: "john.doe@example.com",
  fcm_token: null,
  gender: "male",
  grade_id: "grade-1",
  language_id: null,
  name: "John Doe",
  phone: null,
  updated_at: "2023-01-01T12:00:00Z",
  image: null,
  is_deleted: null,
  is_tc_accepted: null,
  music_off: null,
  sfx_off: null,
  student_id: null,
};

const mockClass: TableTypes<"class"> = {
  id: "class-1",
  name: "Class 1",
  created_at: "2023-01-01T12:00:00Z",
  updated_at: "2023-01-01T12:00:00Z",
  image: null,
  is_deleted: null,
  school_id: "school-1",
};

const meta: Meta<typeof UserProfile> = {
  title: "components/studentProfile/UserProfile",
  component: UserProfile,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    student: {
      control: "object",
    },
    classDoc: {
      control: "object",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    student: mockStudent,
    classDoc: mockClass,
  },
};

export const WithDifferentStudent: Story = {
  args: {
    student: { ...mockStudent, name: "Jane Smith", avatar: "snake" },
    classDoc: { ...mockClass, name: "Class 2" },
  },
};

export const WithLongName: Story = {
  args: {
    student: {
      ...mockStudent,
      name: "Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr",
      avatar: "zebra",
    },
    classDoc: { ...mockClass, name: "Class 3" },
  },
};

export const WithImage: Story = {
  args: {
    student: {
      ...mockStudent,
      image: "assets/avatars/rabbit.png", // Example image URL
      avatar: "fox",
    },
    classDoc: { ...mockClass, name: "Class 4" },
  },
};
