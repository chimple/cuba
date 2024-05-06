import type { Meta, StoryObj } from "@storybook/react";
import AddStudentSection from "../../components/malta/AddStudent/AddStudentSection";

const meta: Meta = {
  title: "components/malta/AddStudent/AddStudentSection",
  component: AddStudentSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    classOptions: {
      control: {
        type: "object",
      },
      defaultValue: [
        { label: "1st Standard", value: "1st Standard" },
        { label: "2nd Standard", value: "2nd Standard" },
      ],
    },
  },
  args: {
    classOptions: [
      { label: "1st Standard", value: "1st Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    classOptions: [
      { label: "1st Standard", value: "1st Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
    ],
  },
};
export const Test2: Story = {
  args: {
    classOptions: [
      { label: "1st Standard", value: "1st Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
    ],
  },
};
export const Test3: Story = {
  args: {
    classOptions: [
      { label: "1st Standard", value: "1st Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
    ],
  },
};
export const Test4: Story = {
  args: {
    classOptions: [{ label: "1st Standard", value: "1st Standard" }],
  },
};

// export const Default: Story = () => <AddStudentSection classOptions={[]} />;
