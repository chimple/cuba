//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import Breadcrumb from "../../../ops-console/components/Breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "OpsConsole/component/Breadcrumb",
  component: Breadcrumb,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    crumbs: [
      { label: "Home", onClick: () => alert("Home clicked") },
      { label: "Programs", onClick: () => alert("Programs clicked") },
      { label: "Sample Program" },
    ],
  },
};

export const WithoutClicks: Story = {
  args: {
    crumbs: [
      { label: "Level 1" },
      { label: "Level 2" },
      { label: "Level 3" },
    ],
  },
};

