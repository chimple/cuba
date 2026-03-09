import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommonPopup from "./CommonPopup";

jest.mock("@mui/material", () => ({
  Dialog: ({
    open,
    onClose,
    children,
    maxWidth,
    fullWidth,
    id,
    className,
  }: any) =>
    open ? (
      <div
        role="dialog"
        aria-modal="true"
        data-testid="mui-dialog"
        data-max-width={maxWidth}
        data-full-width={String(fullWidth)}
        id={id}
        className={className}
      >
        <button data-testid="dialog-on-close" type="button" onClick={onClose}>
          dialog-close
        </button>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children, id, className }: any) => (
    <div data-testid="mui-dialog-content" id={id} className={className}>
      {children}
    </div>
  ),
  IconButton: ({ children, ...props }: any) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  Typography: ({ children, id, className }: any) => (
    <div id={id} className={className}>
      {children}
    </div>
  ),
}));

jest.mock("@mui/icons-material/Close", () => () => (
  <svg data-testid="close-icon" />
));

describe("CommonPopup", () => {
  const setup = (props: Partial<React.ComponentProps<typeof CommonPopup>> = {}) => {
    const onClose = jest.fn();

    const view = render(
      <CommonPopup
        open={true}
        onClose={onClose}
        icon={<span data-testid="popup-icon">icon</span>}
        title="Popup Title"
        subtitle="Popup subtitle"
        {...props}
      />,
    );

    return { onClose, ...view };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render the dialog when open is false", () => {
    const { container } = setup({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it("renders the dialog content, icon, and text", () => {
    const { container } = setup();

    const dialog = screen.getByRole("dialog");
    const content = screen.getByTestId("mui-dialog-content");

    expect(dialog).toHaveAttribute("id", "ops-common-popup-dialog");
    expect(dialog).toHaveClass("ops-common-popup-dialog");
    expect(dialog).toHaveAttribute("data-max-width", "xs");
    expect(dialog).toHaveAttribute("data-full-width", "true");

    expect(content).toHaveAttribute("id", "ops-common-popup-content");
    expect(content).toHaveClass("ops-common-popup-content");
    expect(container.querySelector("#ops-common-popup-container")).toBeInTheDocument();
    expect(container.querySelector("#ops-common-popup-icon")).toContainElement(
      screen.getByTestId("popup-icon"),
    );
    expect(screen.getByText("Popup Title")).toHaveAttribute(
      "id",
      "ops-common-popup-title",
    );
    expect(screen.getByText("Popup subtitle")).toHaveAttribute(
      "id",
      "ops-common-popup-subtitle",
    );
    expect(screen.getByTestId("close-icon")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("passes onClose through to the dialog", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.click(screen.getByTestId("dialog-on-close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
