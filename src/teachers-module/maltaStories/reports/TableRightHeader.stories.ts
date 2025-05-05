import type { Meta, StoryObj } from "@storybook/react";
import TableRightHeader from "../../components/reports/TableRightHeader";

const meta = {
  title: "teachers-module/report/TableRightHeader",
  component: TableRightHeader,
  tags: ["autodocs"],
  argTypes: {
    headerDetails: [
      new Map([
        [
          "1",
          {
            headerName: "Monday",
            startAt: "08/12",
            endAt: "09/12",
          },
        ],
      ]),
      new Map([
        [
          "2",
          {
            headerName: "Tueseday",
            startAt: "06/07",
            endAt: "07/11",
          },
        ],
      ]),
    ],
  },

  args: {
    headerDetails: [],
  },
} satisfies Meta<typeof TableRightHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    headerDetails: [
      new Map([
        [
          "1",
          {
            headerName: "Monday",
            startAt: "08/12",
            endAt: "09/12",
          },
        ],
      ]),
      new Map([
        [
          "2",
          {
            headerName: "Tueseday",
            startAt: "06/07",
            endAt: "07/11",
          },
        ],
      ]),
    ],
  },
};

export const Assignment: Story = {
  args: {
    headerDetails: [
      new Map([
        [
          "1",
          {
            headerName: "q",
            startAt: "08/12",
            endAt: "09/12",
          },
        ],
      ]),
      new Map([
        [
          "2",
          {
            headerName: "a",
            startAt: "06/07",
            endAt: "07/11",
          },
        ],
      ]),
      new Map([
        [
          "3",
          {
            headerName: "b",
            startAt: "08/12",
            endAt: "09/12",
          },
        ],
      ]),
      new Map([
        [
          "4",
          {
            headerName: "c",
            startAt: "06/07",
            endAt: "07/11",
          },
        ],
      ]),
      new Map([
        [
          "5",
          {
            headerName: "d",
            startAt: "08/12",
            endAt: "09/12",
          },
        ],
      ]),
      new Map([
        [
          "6",
          {
            headerName: "t",
            startAt: "06/07",
            endAt: "07/11",
          },
        ],
      ]),
      new Map([
        [
          "7",
          {
            headerName: "f",
            startAt: "08/12",
            endAt: "09/12",
          },
        ],
      ]),
    ],
  },
};
export const Weekly: Story = {
    args: {
      headerDetails: [
        new Map([
          [
            "1",
            {
              headerName: "Monday",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "2",
            {
              headerName: "Tueseday",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "3",
            {
              headerName: "Wednesday",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "4",
            {
              headerName: "Thursday",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "5",
            {
              headerName: "Friday",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "6",
            {
              headerName: "Saturday",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "7",
            {
              headerName: "Sunday",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
      ],
    },
  };
  export const Monthly: Story = {
    args: {
      headerDetails: [
        new Map([
          [
            "1",
            {
              headerName: "January",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "2",
            {
              headerName: "February",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "3",
            {
              headerName: "March",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "4",
            {
              headerName: "April",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "5",
            {
              headerName: "May",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "6",
            {
              headerName: "June",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
        new Map([
          [
            "7",
            {
              headerName: "July",
              startAt: "",
              endAt: "",
            },
          ],
        ]),
      ],
    },
  };
