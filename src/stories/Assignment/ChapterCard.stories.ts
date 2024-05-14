import type { Meta, StoryObj } from "@storybook/react";
import ChapterCard from "../../components/malta/assignment/ChapterCard";

const meta = {
  title: "Component/malta/assignment/ChapterCard",
  component: ChapterCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    chapterTitle: {
      options: Object.values(""),
      mapping: Object.values(""),
      control: {
        type: "text",
        labels: Object.keys(""),
      },
    },
    lessons: [
      {
        lesson: {
          options: Object.values(""),
          mapping: Object.values(""),
          control: {
            type: "text",
            labels: Object.keys(""),
          },
        },
        title: {
          options: Object.values(""),
          mapping: Object.values(""),
          control: {
            type: "text",
            labels: Object.keys(""),
          },
        },
      },
    ],
  },
  args: {
    chapterTitle: "ChapterName",
    lessons: [{ lesson: "lessonName", title: "lessonTitle" }],
  },
} satisfies Meta<typeof ChapterCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const chapter: Story = {
  args: {
    chapterTitle: "ChapterName",
    lessons: [{ lesson: "lessonName", title: "lessonTitle" }],
  },
};
