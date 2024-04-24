
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
export const Name: Story = {
    args: {
        userDocId: '323452',
        userImgPath:'image.png',
        userName:'Kumar'
    },
};

export const Image: Story = {
    args: {
        userDocId: '323452',
        userImgPath:'image.png',
        userName:'Bhanu'
    },
};

