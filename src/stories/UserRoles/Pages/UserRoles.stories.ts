
import type { Meta, StoryObj } from "@storybook/react";
import UserRoles from "../../../pages/Malta/UserRoles";


const meta = {
    title: "Pages/Malta/UserRoles",
    component: UserRoles,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
    args: {  },
} satisfies Meta<typeof UserRoles>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Page: Story = {
  
};


