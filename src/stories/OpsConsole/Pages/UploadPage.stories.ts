import type { Meta, StoryObj } from "@storybook/react";
import UploadPage from "../../../ops-console/pages/UploadPage";

const meta = {
  title: "OpsConsole/Pages/UploadPage",
  component: UploadPage,
  parameters: {
    layout: "fullscreen",
  },

  tags: ["autodocs"],
} satisfies Meta<typeof UploadPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
