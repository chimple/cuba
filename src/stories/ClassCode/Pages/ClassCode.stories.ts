
import type { Meta, StoryObj } from "@storybook/react";
import ClassCode from "../../../pages/Malta/ClassCode";
const meta = {
    title: "Pages/Malta/ClassCode",
    component: ClassCode,
    parameters: {
        layout: 'fullscreen',
        
    },
    tags: ["autodocs"],
   
    args: {  },
} satisfies Meta<typeof ClassCode>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SmallSize: Story = {
  
};


