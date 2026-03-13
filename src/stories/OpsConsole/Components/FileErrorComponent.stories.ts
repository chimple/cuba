//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import ErrorPage from "../../../ops-console/components/FileErrorComponent";

const meta = {
  title: "OpsConsole/Component/FileErrorComponent",
  component: ErrorPage,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockDownload = () => alert("Download triggered!");
const mockReUpload = () => alert("Re-upload triggered!");

export const Default: Story = {
  args: {
    handleDownload: mockDownload,
    reUplod: mockReUpload,
  },
};

export const CustomMessage: Story = {
  args: {
    handleDownload: mockDownload,
    reUplod: mockReUpload,
    message: "Some custom validation errors were found in your data.",
    title: "File Contains Errors",
  },
};

export const WithoutDownloadButton: Story = {
  args: {
    reUplod: mockReUpload,
    title: "Manual Upload Required",
    message: "Your file could not be processed. Please try again.",
  },
};
