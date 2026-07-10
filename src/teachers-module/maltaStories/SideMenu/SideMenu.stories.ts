import { Meta, StoryObj } from "@storybook/react";
import HamburgerMenu from "../../components/homePage/SideMenu";

const meta: Meta<typeof HamburgerMenu> = {
  title: "components/HamburgerMenu",
  component: HamburgerMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    handleManageSchoolClick: {
      action: "handleManageSchoolClick",
      description: "Callback for 'Manage School' click",
    },
    handleManageClassClick: {
      action: "handleManageClassClick",
      description: "Callback for 'Manage Class' click",
    },
  },

  args: {
    handleManageSchoolClick: () => {},
    handleManageClassClick: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const DrawerOpen: Story = {};
