import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import UserProfile from "../pages/UserProfile";
// import { UserProfile } from "../../common/chimplePrivatePages";

const meta: Meta = {
  title: "Pages/Malta/UserProfile",
  component: UserProfile,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = () => <UserProfile />;
