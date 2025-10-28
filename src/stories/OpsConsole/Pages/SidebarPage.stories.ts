//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import SidebarPage from "../../../ops-console/pages/SidebarPage";

const meta = {
  title: "OpsConsole/Pages/SidebarPage",
  component: SidebarPage,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    name: {
      control: "text",
      description: "User's name or designation",
    },
    email: {
      control: "text",
      description: "User's email ID",
    },
    photo: {
      control: "text",
      description: "User's profile icon (URL)",
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SidebarPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "John Doe",
    email: "john@example.com",
    photo: "https://i.pravatar.cc/40",
  },
};

