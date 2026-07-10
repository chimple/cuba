//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import DetailItem from "../../../ops-console/components/DetailItem";

const meta = {
  title: "OpsConsole/Component/DetailItem",
  component: DetailItem,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DetailItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Example Label",
    value: "Example Value",
  },
};