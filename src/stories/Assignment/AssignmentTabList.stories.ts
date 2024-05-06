import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { action } from "@storybook/addon-actions";
import AssignmentTabList from "../../components/malta/assignment/AssignmentTabList";
import { ASSIGNMENTTAB_LIST } from "../../common/constants";

const meta = {
  title: "Component/malta/assignment/AssignmentTabList",
  component: AssignmentTabList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    tabHeader: {
      options: Object.values(ASSIGNMENTTAB_LIST),
      mapping: Object.values(ASSIGNMENTTAB_LIST),
      control: {
        type: "select",
        labels: Object.keys(ASSIGNMENTTAB_LIST),
      },
    },
  },
  args: { tabHeader: ASSIGNMENTTAB_LIST.RECOMMENDED },
} satisfies Meta<typeof AssignmentTabList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const recommended: Story = {
  args: {
    tabHeader: ASSIGNMENTTAB_LIST.RECOMMENDED,
    segmentChanged: fn(),
  },
};

export const assignment: Story = {
  args: {
    tabHeader: ASSIGNMENTTAB_LIST.ASSIGNMENT,
    segmentChanged: fn(),
  },
};

export const liveQuiz: Story = {
  args: {
    tabHeader: ASSIGNMENTTAB_LIST.LIVEQUIZ,
    segmentChanged: fn(),
  },
};
