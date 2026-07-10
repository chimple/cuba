//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import SchoolList from "../../../ops-console/pages/SchoolList";

const meta = {
  title: "OpsConsole/Pages/SchoolList",
  component: SchoolList,
  parameters: {
    layout: "fullscreen",
  },

  tags: ["autodocs"],
} satisfies Meta<typeof SchoolList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
