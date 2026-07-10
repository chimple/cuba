
import type { Meta, StoryObj } from "@storybook/react";
import QRCodeGenerator from "../../../components/classcode/QrCodeGenerator";
import { number, string } from "prop-types";


const meta = {
    title: "Component/ClassCode/QrCodeGenerator",
    component: QRCodeGenerator,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        value: string,
        size: number
    },
    args: { value: '123456', size: 128, },
} satisfies Meta<typeof QRCodeGenerator>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SmallSize: Story = {
    args: {
        value: '323452',
        size:128
    },
};
export const BigSize: Story = {
    args: {
        value: '983710',
        size:256
    },
};
export const Test1: Story = {
    args: {
        value: 'Your Class Code is 12445',
        size:128
    },
};
export const Test2: Story = {
    args: {
        value: 'Join to Class',
        size:128
    },
};
export const Test3: Story = {
    args: {
        value: 'Chimple Teacher',
        size:256
    },
};
export const Test4: Story = {
    args: {
        value: 'Hello Childrens',
        size:256
    },
};

