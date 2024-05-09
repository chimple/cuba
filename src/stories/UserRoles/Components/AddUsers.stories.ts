
import { fn } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react";
import AddUserPopUp from "../../../components/userRoles/AddUserPopUp";
import { func } from "prop-types";

const meta = {
  title: "Component/AddUsers/AddUserPopUp",
  component: AddUserPopUp,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    showDialogBox:func,
  },
  args: {showDialogBox:false,handleClose:func },
} satisfies Meta<typeof AddUserPopUp>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Page: Story = {
    args: {
        showDialogBox:false,
        handleClose:func
    },
  };

