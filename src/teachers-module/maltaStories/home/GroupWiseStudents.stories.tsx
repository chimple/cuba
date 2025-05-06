import type { Meta, StoryObj } from "@storybook/react";
import { number, object } from "prop-types";
import GroupWiseStudents from "../../components/homePage/GroupWiseStudents";
import { TableTypes } from "../../../common/constants";
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
const result: TableTypes<"result"> = {
  id: "student-1",
  assignment_id: "assitlk;",
  correct_moves: 19,
  created_at: "2023-01-01T12:00:00Z",
  is_deleted: false,
  lesson_id: "lesson_id",
  school_id: "school_id",
  score: 20,
  student_id: "student_id",
  time_spent: 10,
  updated_at: "2023-01-01T12:00:00Z",
  wrong_moves: 3,
  chapter_id: "chapter_id",
  course_id: "course_id",
  class_id: null
};
const meta = {
  title: "teachers-module/home/GroupWiseStudents",
  component: GroupWiseStudents,
  tags: ["autodocs"],
  argTypes: {},

  args: {
    color: "Red",
    onClickCallBack: Function,
    studentLength: "6",
    studentsProgress: [],
  },
} satisfies Meta<typeof GroupWiseStudents>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RedBand: Story = {
  args: {
    color: "#F09393",
    onClickCallBack: Function,
    studentLength: "4",
    studentsProgress: [
      new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
        ["student", mockStudent],
        ["results", [result, result, result]],
      ]),
    ],
  },
};
export const GreenBand: Story = {
  args: {
    color: "#CBDFA0",
    onClickCallBack: Function,
    studentLength: "7",
    studentsProgress: [
      new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
        ["student", mockStudent],
        ["results", [result, result, result]],
      ]),
    ],
  },
};
export const OrangeBand: Story = {
  args: {
    color: "#FDF7C3",
    onClickCallBack: Function,
    studentLength: "7",
    studentsProgress: [
      new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
        ["student", mockStudent],
        ["results", [result, result, result]],
      ]),
    ],
  },
};
export const GreyBand: Story = {
  args: {
    color: "#D4D1D8",
    onClickCallBack: Function,
    studentLength: "7",
    studentsProgress: [
      new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
        ["student", mockStudent],
        ["results", [result, result, result]],
      ]),
      new Map<string, TableTypes<"user"> | TableTypes<"result">[]>([
        ["student", mockStudent],
        ["results", [result, result, result]],
      ]),
    ],
  },
};
