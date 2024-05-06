import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import StudentProfileSection from "../../components/malta/StudentProfile/StudentProfileSection";
import { number, string } from "prop-types";

const meta: Meta = {
  title: "components/malta/StudentProfile/StudentProfileSection",
  component: StudentProfileSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    school: string,
    className: string,
    gender: string,
    age: number,
    classCode: string,
  },
  args: {
    school: "ABC School",
    className: "1st class",
    gender: "Male",
    age: 7,
    classCode: "12346",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    school: "ABC School",
    className: "1st class",
    gender: "Male",
    age: 7,
    classCode: "12346",
  },
};
export const Test2: Story = {
  args: {
    school: "ABC School",
    className: "1st class",
    gender: "Male",
    age: 7,
    classCode: "12346",
  },
};
export const Test3: Story = {
  args: {
    school: "ABCDEFGHIJKL School",
    className: "1st class",
    gender: "Male",
    age: 7,
    classCode: "12346767",
  },
};export const Test4: Story = {
  args: {
    school: "",
    className: "1st class",
    gender: "Male",
    age: 7,
    classCode: "1",
  },
};export const Test5: Story = {
  args: {
    school: "ABCJHSJDJHDJSHJFHSJFHSKHFJHFSDJSHF",
    className: "1st class",
    gender: "Male",
    age: 7,
    classCode: "1234678676767",
  },
};
