
import type { Meta, StoryObj } from "@storybook/react";
import QRCodeGenerator from "../../../components/classcode/QrCodeGenerator";
import { number, string } from "prop-types";
import ClassCode from "../../../pages/Malta/ClassCode";
import { INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS } from '@storybook/addon-viewport';
import './ClassCode.stories.css'

const meta = {
    title: "Pages/Malta/ClassCode",
    component: ClassCode,
    parameters: {
      
        
    },
    tags: ["autodocs"],
   
    args: {  },
} satisfies Meta<typeof ClassCode>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SmallSize: Story = {
  
};


