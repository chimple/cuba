
import type { Meta, StoryObj } from "@storybook/react";
import { number, string } from "prop-types";
import UserImageWithName from "../../components/UserImageWithName";


const meta = {
    title: "Component/Common/UserImageWithName",
    component: UserImageWithName,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        userDocId: string,
        userImgPath: string,
        userName:string
    },
    args: { userDocId: '123456', userImgPath: 'image.png',userName:'vinay' },
} satisfies Meta<typeof UserImageWithName>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
    args: {
        userDocId: '323452',
        userImgPath:'https://firebasestorage.googleapis.com/v0/b/cuba-stage.appspot.com/o/2023-05-17%2009%3A19%3A10.323?alt=media&token=1eb327b1-95f4-46c3-99d3-23cf8c8a62f9',
        userName:'Kumar'
    },
};

export const Test2: Story = {
    args: {
        userDocId: '323452',
        userImgPath:'image.png',
        userName:'Bhanu'
    },
};

