
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import ExpandedUser from "../../../components/DashboardTable/ExpandedUser";
import { string } from "prop-types";
import ExpandedTable from "../../../components/DashboardTable/ExpandedTable";

const meta = {
    title: "Component/DashboardTable/ExpandedTable",
    component: ExpandedTable,
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
    args: {
        expandedData: {
            "Big Small": {
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
} satisfies Meta<typeof ExpandedTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const WeeklyData: Story = {
    args: {
        expandedData: {
            "Big Small": {
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
export const TwoWeeklyData: Story = {
    args: {
        expandedData: {
            "Big Small": {
                "Mon": null,
                "Tue": 90,
                "Wed": 67,
                "Thu": null,
                "Fri": 12,
                "Sat": 82,
                "Sun": 78
            },
            "Small letters": {
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
export const ThreeWeeklyData: Story = {
    args: {
        expandedData: {
            "Big Small": {
                "Mon": 2,
                "Tue": null,
                "Wed": 56,
                "Thu": 90,
                "Fri": null,
                "Sat": 82,
                "Sun": null
            },
            "a": {
                "Mon": null,
                "Tue": 90,
                "Wed": 67,
                "Thu": null,
                "Fri": 12,
                "Sat": 82,
                "Sun": 78
            },
            "b": {
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
export const MonthlyData: Story = {
    args: {
        expandedData: {
            "Coloured": {
                "Jan": 23,
                "Feb": 67,
                "Mar": 89,
                "Apr": 1,
                "May": null,
                "Jun": 67,
                "Jul": null,
                "Aug": 12,
                "Sep": 68,
                "Oct": null,
                "Nov": 78,
                "Dec": 37

            }
        }
    },
}


