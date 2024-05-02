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
export const Default = () => (
  <StudentProfileSection
    school={undefined}
    className={undefined}
    gender={undefined}
    age={undefined}
    classCode={undefined}
  />
);
