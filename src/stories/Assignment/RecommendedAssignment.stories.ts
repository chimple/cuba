import { fn } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react";
import RecommendedAssignment from "../../components/malta/assignment/RecommendedAssignment";

const meta = {
  title: "Component/Malta/assignment/RecommendedorSelectedAssignment",
  component: RecommendedAssignment,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    infoText: {
      options: Object.values(""),
      mapping: Object.values(""),
      control: {
        type: "text",
        labels: Object.keys(""),
      },
    },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { infoText: "Recommended Assignments" },
} satisfies Meta<typeof RecommendedAssignment>;
export default meta;
type Story = StoryObj<typeof meta>;
export const recommendedAssignments: Story = {
  args: {
    infoText: "These are the recommended assignments based on the previous assignments",
  },
};

export const selectedAssignments: Story = {
  args: {
    infoText: "These are the assignments you have chosen to assign",
  },
};
