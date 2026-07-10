import type { Meta, StoryObj } from "@storybook/react";
import TeacherProfileSection from "../../components/addTeacher/TeacherProfileSection";
import { TableTypes } from "../../../common/constants";

const mockTeacher: TableTypes<"user"> = {
  id: "teacher-1",
  name: "John Doe",
  image: "assets/icons/userIcon.png",
  email: "john.doe@example.com",
  age: null,
  avatar: null,
  created_at: "",
  curriculum_id: null,
  fcm_token: null,
  gender: null,
  grade_id: null,
  is_deleted: null,
  is_tc_accepted: null,
  language_id: null,
  music_off: null,
  phone: null,
  sfx_off: null,
  updated_at: null,
  student_id: null,
};

const mockClassDoc: TableTypes<"class"> = {
  id: "class-1",
  name: "Mathematics Class",
  created_at: "",
  image: null,
  is_deleted: null,
  school_id: "",
  updated_at: null,
};

const meta: Meta<typeof TeacherProfileSection> = {
  title: "/components/addTeacher/TeacherProfileSection",
  component: TeacherProfileSection,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    teacher: {
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
    teacher: mockTeacher,
    classDoc: mockClassDoc,
  },
};

export const Test1: Story = {
  args: {
    teacher: {
      ...mockTeacher,
      name: "Jane Smith",
      image: "/components/addTeacher/TeacherProfileSection",
    },
    classDoc: mockClassDoc,
  },
};

export const Test2: Story = {
  args: {
    teacher: {
      ...mockTeacher,
      name: "Tommy Lee",
      image: "/components/addTeacher/TeacherProfileSection",
    },
    classDoc: mockClassDoc,
  },
};

export const Test3: Story = {
  args: {
    teacher: {
      ...mockTeacher,
      name: "Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr",
      image: "/components/addTeacher/TeacherProfileSection",
    },
    classDoc: mockClassDoc,
  },
};
