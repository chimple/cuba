//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import UsersPage from "../../../ops-console/pages/UsersPage";

const DEMO_USERS = [
  { fullName: "Shankar", role: "Admin" },
  { fullName: "Naveen", role: "Program Manager" },
  { fullName: "Shakshi", role: "Program Manager" },
  { fullName: "Raeez Ahamed", role: "Admin" },
  { fullName: "Kritika", role: "Program Coordinator" },
];

const meta: Meta<typeof UsersPage> = {
  title: "Pages/UsersPage",
  component: UsersPage,
  argTypes: {
    initialUsers: {
      control: "object",
      description: "Initial list of users for the demo",
    },
  },
};

export default meta;

type Story = StoryObj<typeof UsersPage>;

export const WithDemoUsers: Story = {
  args: {
    initialUsers: DEMO_USERS,
  },
};
