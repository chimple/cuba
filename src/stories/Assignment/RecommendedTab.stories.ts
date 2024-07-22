import { fn } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react";
import Lesson from "../../models/lesson";
import RecommendedTab from "../../components/malta/assignment/RecommendedTab";

const meta = {
  title: "Component/malta/assignment/RecommendedTab",
  component: RecommendedTab,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    lessons: {
      options: Object.values(Lesson),
      mapping: Object.values(Lesson),
      control: {
        type: Lesson,
        labels: Object.keys(""),
      },
    },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { lessons: [] },
} satisfies Meta<typeof RecommendedTab>;
export default meta;
type Story = StoryObj<typeof meta>;
export const recommendedText: Story = {
  args: {
    lessons: [],
  },
};
