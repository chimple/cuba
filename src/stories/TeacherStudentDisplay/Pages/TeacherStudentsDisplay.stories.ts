
import { type Meta, type StoryObj } from "@storybook/react";
import TeachersStudentDisplay from "../../../pages/Malta/TeachersStudentDisplay";


const meta = {
    title: "Pages/Malta/TeacherStudentsDisplay",
    component: TeachersStudentDisplay,
    parameters: {
     layout: 'fullscreen',
    },
    tags: ["autodocs"],
  
    args: {  },
} satisfies Meta<typeof TeachersStudentDisplay>;
export default meta;

type Story = StoryObj<typeof meta>;
export const Page: Story = {
  
};


