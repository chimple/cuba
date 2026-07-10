import type { Meta, StoryObj } from "@storybook/react";
import UploadButton from "../../../ops-console/components/UploadButton";

const meta = {
  title: "OpsConsole/Component/UploadButton",
  component: UploadButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onClick: () => alert("Upload button clicked!"),
  },
} satisfies Meta<typeof UploadButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
