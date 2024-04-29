
import type { Meta, StoryObj } from "@storybook/react";
import ClassTabs from "../../../components/TeachersStudentDisplay/ClassTabs";
import { USERTYPES } from "../../../common/constants";


const meta = {
    title: "Component/TeacherStudentDisplay/ClassTabs",
    component: ClassTabs,
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
    args: { userType: USERTYPES.PRINCIAPAL },
} satisfies Meta<typeof ClassTabs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Students: Story = {
    args: {
        userType: USERTYPES.STUDENTS,
        onChange(event, newValu) {

        },
    },
};
export const Teachers: Story = {
    args: {
        userType: USERTYPES.TEACHERS,
        onChange(event, newValu) {

        },
    },
};


