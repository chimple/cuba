// TeacherProfile.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import TeacherProfileSection from "../../components/malta/TeacherProfile/TeacherProfileSection";
import { string } from "prop-types";

const meta: Meta = {
  title: "components/malta/TeacherProfile/TeacherProfileSection",
  component: TeacherProfileSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    schoolName: string,
    className: string,

},
args: { schoolName: 'ABC School', className: '10th Grade'},
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    schoolName: 'ABC School', className: '10th Grade'
  },
};
export const Test2: Story = {
  args: {
    schoolName: 'xyzabc school', className: '2nd Grade'
  },
};
export const Test3: Story = {
  args: {
    schoolName: '', className: '2nd Grade'
  },
};
export const Test4: Story = {
  args: {
    schoolName: 'hghjghjghjg school', className: ''
  },
};
export const Test5: Story = {
  args: {
    schoolName: 'yugtyjgfjfgfghfhgfhgfg school', className: '10th Grade'
  },
};
