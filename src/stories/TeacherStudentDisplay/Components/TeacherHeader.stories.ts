
import type { Meta, StoryObj } from "@storybook/react";
import { number, string } from "prop-types";
import TeacherHeader from "../../../components/TeachersStudentDisplay/TeacherHeader";



const meta:Meta<typeof TeacherHeader> = {
    title: "Component/TeacherStudentDisplay/TeacherHeader",
    component: TeacherHeader,
    parameters: {
        layout: "centered",
    },
    decorators: [
       
    ],
    tags: ["autodocs"],
    argTypes: {
        className: string,
        image: string,
        name: string
    },
    args: { className: '1st Standard', image: 'image.png', name: 'Chimple' },
} ;
export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
    args: {
        className: '3252',
        image: 'https://firebasestorage.googleapis.com/v0/b/cuba-stage.appspot.com/o/2023-05-17%2009%3A19%3A10.323?alt=media&token=1eb327b1-95f4-46c3-99d3-23cf8c8a62f9',
        name: 'Chimple'
    },
};

export const Test2: Story = {
    args: {
        className: '32352',
        image: 'image.png',
        name: 'Teacher'
    },
};

