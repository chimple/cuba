
import type { Meta, StoryObj } from "@storybook/react";
import ClassTabs from "../../../components/TeachersStudentDisplay/ClassTabs";
import { USERTYPES } from "../../../common/constants";
import { fn } from "@storybook/test";

const meta = {
    title: "Component/TeacherStudentDisplay/ClassTabs",
    component: ClassTabs,
    parameters: {
        controls: {
          matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
          },
        },
      },
    tags: ["autodocs"],
    decorators: [
     
      ],
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
    args: { userType: USERTYPES.PRINCIAPAL ,onChange:fn()},
} satisfies Meta<typeof ClassTabs>;
export default meta;
type Story = StoryObj<typeof meta>;
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


