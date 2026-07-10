import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { useState } from "react";
import Dashboard from "../../pages/Malta/Dashboard";

const meta: Meta = {
  title: "Pages/Malta/Dashboard",
  component: Dashboard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default = () => <Dashboard />;
