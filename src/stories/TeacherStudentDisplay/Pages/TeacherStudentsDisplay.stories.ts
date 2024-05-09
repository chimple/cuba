
import type { Meta, StoryObj } from "@storybook/react";
import QRCodeGenerator from "../../../components/classcode/QrCodeGenerator";
import { number, string } from "prop-types";
import ClassCode from "../../../pages/Malta/ClassCode";
import TeachersStudentDisplay from "../../../pages/Malta/TeachersStudentDisplay";
import './TeacherStudentsDisplay.stories.css'


const meta = {
    title: "Pages/Malta/TeacherStudentsDisplay",
    component: TeachersStudentDisplay,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    args: {  },
} satisfies Meta<typeof TeachersStudentDisplay>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Page: Story = {
  
};


