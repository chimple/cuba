//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import InfoCard from "../../../ops-console/components/InfoCard";

const meta = {
  title: "OpsConsole/Component/InfoCard",
  component: InfoCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof InfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Program Information",
    items: [
      { label: "Program Name", value: "Example Program" },
      { label: "Start Date", value: "January 1, 2023" },
      { label: "End Date", value: "December 31, 2023" },
    ],
  },
};
