import type { Meta, StoryObj } from "@storybook/react";
import CreateSelectedAssignment from "../../components/homePage/assignment/CreateSelectedAssignment";
const meta: Meta = {
  title:
    "teachers-module/components/homePage/assignment/CreateSelectedAssignment",
  component: CreateSelectedAssignment,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof CreateSelectedAssignment>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default = () => (
  <CreateSelectedAssignment
    selectedAssignments={undefined}
    manualAssignments={undefined}
    recommendedAssignments={undefined}
  />
);
