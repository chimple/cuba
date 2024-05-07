
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import DashboardTable from "../../../components/DashboardTable/DashboardTable";

const meta = {
    title: "Component/DashboardTable/DashboardTable",
    component: DashboardTable,
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

    },

} satisfies Meta<typeof DashboardTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const OneStudent: Story = {
    args: {
        studentsData: {
            "Kumar": {
                "Mon": null,
                "Tue": 90,
                "Wed": 67,
                "Thu": null,
                "Fri": 12,
                "Sat": 82,
                "Sun": 78
            }
        }
    },
};
export const TwoStudent: Story = {
    args: {
        studentsData: {
            "Kumar": {
                "Mon": null,
                "Tue": 90,
                "Wed": 67,
                "Thu": null,
                "Fri": 12,
                "Sat": 82,
                "Sun": 78
            },
            "Chimple": {
                "Mon": 1,
                "Tue": null,
                "Wed": 34,
                "Thu": 78,
                "Fri": 1,
                "Sat": null,
                "Sun": 45
            }
        }
    },
};
export const ThreeStudent: Story = {
    args: {
        studentsData: {
            "Naveen": {
                "Mon": 2,
                "Tue": null,
                "Wed": 56,
                "Thu": 90,
                "Fri": null,
                "Sat": 82,
                "Sun": null
            },
            "Pramod": {
                "Mon": null,
                "Tue": 90,
                "Wed": 67,
                "Thu": null,
                "Fri": 12,
                "Sat": 82,
                "Sun": 78
            },
            "ashish": {
                "Mon": 1,
                "Tue": null,
                "Wed": 34,
                "Thu": 78,
                "Fri": 1,
                "Sat": null,
                "Sun": 45
            }
        }
    },
};
export const FourStudent: Story = {
    args: {
        studentsData: {
            "Kumar": {
                "Mon": null,
                "Tue": 90,
                "Wed": 67,
                "Thu": null,
                "Fri": 12,
                "Sat": 82,
                "Sun": 78
            },
            "Naveen": {
                "Mon": 2,
                "Tue": null,
                "Wed": 56,
                "Thu": 90,
                "Fri": null,
                "Sat": 82,
                "Sun": null
            },
            "Pramod": {
                "Mon": null,
                "Tue": 90,
                "Wed": 67,
                "Thu": null,
                "Fri": 12,
                "Sat": 82,
                "Sun": 78
            },
            "ashish": {
                "Mon": 1,
                "Tue": null,
                "Wed": 34,
                "Thu": 78,
                "Fri": 1,
                "Sat": null,
                "Sun": 45
            }
        }
    },
};



