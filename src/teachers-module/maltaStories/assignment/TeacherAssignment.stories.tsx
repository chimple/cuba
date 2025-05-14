import type { Meta, StoryObj } from "@storybook/react";
import TeacherAssignment from "../../components/homePage/assignment/TeacherAssignment";
const meta: Meta = {
  title: "teachers-module/components/homePage/assignment/TeacherAssignment",
  component: TeacherAssignment,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof TeacherAssignment>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default = () => (
  <TeacherAssignment
    onLibraryClick={function (): void {
      throw new Error("Function not implemented.");
    }}
  />
);
