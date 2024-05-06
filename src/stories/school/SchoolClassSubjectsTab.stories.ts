import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import TabList from "../../components/malta/common/SchoolClassSubjectsTab";
import { COMMONTAB_LIST } from "../../common/constants";

const meta = {
  title: "Component/malta/school/TabList",
  component: TabList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    tabHeader: {
      options: Object.values(COMMONTAB_LIST),
      mapping: Object.values(COMMONTAB_LIST),
      control: {
        type: "select",
        labels: Object.keys(COMMONTAB_LIST),
      },
    },
  },
  args: { tabHeader: COMMONTAB_LIST.SCHOOL },
} satisfies Meta<typeof TabList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const school: Story = {
  args: {
    tabHeader: COMMONTAB_LIST.SCHOOL,
    segmentChanged: fn(),
  },
};

export const classes: Story = {
  args: {
    tabHeader: COMMONTAB_LIST.CLASS,
    segmentChanged: fn(),
  },
};

export const subjects: Story = {
  args: {
    tabHeader: COMMONTAB_LIST.SUBJECTS,
    segmentChanged: fn(),
  },
};
