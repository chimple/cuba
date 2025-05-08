
import type { Meta, StoryObj } from "@storybook/react";
import { number } from "prop-types";
import AssigmentCount from "../../components/library/AssignmentCount";



const meta = {
    title: "teachers-module/library/AssignmentCount",
    component: AssigmentCount,
    tags: ["autodocs"],
    argTypes: {
        assignments: number
    },

    args: { assignments: 2, },
} satisfies Meta<typeof AssigmentCount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
    args: {
        assignments: 1,
        onClick() { }
    },
};
export const Test2: Story = {
    args: {
        assignments: 7,
        onClick() { }
    },
};
export const Test3: Story = {
    args: {
        assignments: 9,
        onClick() { }
    },
};
export const Test4: Story = {
    args: {
        assignments: 123,
        onClick() { }
    },
};
export const Test5: Story = {
    args: {
        assignments: 23,
        onClick() { }
    },
};

