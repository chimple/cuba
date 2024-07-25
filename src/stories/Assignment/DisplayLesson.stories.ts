import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { action } from "@storybook/addon-actions";
import LessonIcon from "../../components/malta/assignment/LessonIcon";

const meta = {
  title: "Component/malta/assignment/LessonIcon",
  component: LessonIcon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
  args: {},
} satisfies Meta<typeof LessonIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const lesson1: Story = {
  args: {
    id: "kn2_0401",
    cocosSubjectCode: "kn",
    thumbnail: "kn2_0401.png",
    selected: true,
    title: "Lesson1",
  },
};
