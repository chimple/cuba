
import { fn } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react";
import AddUserPopUp from "../../../components/userRoles/AddUserPopUp";
import { func } from "prop-types";
import UserTabs from "../../../components/userRoles/UserTabs";
import { USERTYPES } from "../../../common/constants";
import { withActions } from '@storybook/addon-actions/decorator';
import "./userRoles.stories.css"

const meta = {
    title: "Component/AddUsers/userTabs",
    component: UserTabs,
    decorators:[withActions],
    parameters: {

        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        userType: {
            options: Object.values(USERTYPES),
            mapping: Object.values(USERTYPES),
            control: {
                type: "select",
                labels: Object.keys(USERTYPES),
            },
        },
    },
    args: { userType: USERTYPES.PRINCIAPAL,onChange:fn() },
} satisfies Meta<typeof UserTabs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Principal: Story = {
    args: {
        userType: USERTYPES.PRINCIAPAL,
    },
};
export const Coordinators: Story = {
    args: {
        userType: USERTYPES.COORDINATORS,
    },
};
export const Sponsors: Story = {
    args: {
        userType: USERTYPES.SPONSORS,
    },
};
export const Students: Story = {
    args: {
        userType: USERTYPES.STUDENTS,
    },
};
export const Teachers: Story = {
    args: {
        userType: USERTYPES.TEACHERS,
    },
}

