import type { Meta, StoryObj } from "@storybook/react";
import { TableTypes } from "../../../common/constants";
import UserDetail from "../../components/studentProfile/UserDetail";

const mockStudent: TableTypes<"user"> = {
  id: "student-1",
  age: null,
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

const meta: Meta<typeof UserDetail> = {
  title: "components/studentProfile/StudentDetail",
  component: UserDetail,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    user: {
      control: "object",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    user: mockStudent,
  },
};

export const test1: Story = {
  args: {
    user: { ...mockStudent, avatar: "snake", name: "Jane Smith" },
  },
};

export const test2: Story = {
  args: {
    user: { ...mockStudent, avatar: "tiger", name: "Tommy" },
  },
};
export const test3: Story = {
  args: {
    user: {
      ...mockStudent,
      avatar: "zebra",
      name: "Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr",
    },
  },
};
