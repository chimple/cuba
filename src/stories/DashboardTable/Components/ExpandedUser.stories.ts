
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import ExpandedUser from "../../../components/DashboardTable/ExpandedUser";
import { string } from "prop-types";

const meta = {
    title: "Component/DashboardTable/ExpandedUser",
    component: ExpandedUser,
    parameters: {
        controls: {
          matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
          },
        },
      },
    tags: ["autodocs"],

    argTypes: {
       name:string
    },
    args: { name: 'kumar' ,onClickViewDetails:fn()},
} satisfies Meta<typeof ExpandedUser>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SmallName: Story = {
    args: {
        name:'A',
    },
};
export const MediumName: Story = {
    args: {
        name: 'Sharath',
    },
}
export const BigName: Story = {
    args: {
        name: 'VinayKumar',
    },
};
export const Character: Story = {
    args: {
        name: '@',
    },
};
export const EmptyName: Story = {
    args: {
        name: '',
    },
};


