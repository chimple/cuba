import type { Meta, StoryObj } from "@storybook/react";
import AssignmentNextButton from "../../components/homePage/assignment/AssignmentNextButton";

const meta = {
  title: "teachers-module/components/homePage/assignment/AssignmentNextButton",
  component: AssignmentNextButton,
  tags: ["autodocs"],
  argTypes: {},

  args: {
    onClickCallBack: () => {},
    assignmentCount: 6,
  },
} satisfies Meta<typeof AssignmentNextButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const assignmentCount: Story = {
  args: {
    onClickCallBack: () => {},
    assignmentCount: 4,
  },
};

export const assignmentCount1: Story = {
  args: {
    onClickCallBack: () => {},
    assignmentCount: 10,
  },
};
