import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import OpsGenericPopup from "./OpsGenericPopup";

type PopupProps = React.ComponentProps<typeof OpsGenericPopup>;

const baseProps: PopupProps = {
  isOpen: true,
  heading: "Merge completed",
  text: "Student profile merged successfully.",
};

const renderPopup = (props: Partial<PopupProps> = {}) =>
  render(<OpsGenericPopup {...baseProps} {...props} />);
const renderPopupWithClose = (props: Partial<PopupProps> = {}) => {
  const onClose = jest.fn();
  const utils = renderPopup({ ...props, onClose });
  return { ...utils, onClose };
};

const getOverlay = () => document.getElementById("ops-generic-popup-overlay");
const getContainer = () => document.getElementById("ops-generic-popup-container");
const getCloseButton = () =>
  document.getElementById("ops-generic-popup-close-btn");
const getIconWrapper = () => document.getElementById("ops-generic-popup-icon");
const getImageWrapper = () =>
  document.getElementById("ops-generic-popup-image-wrapper");
const getHeadingNode = () => document.getElementById("ops-generic-popup-heading");
const getTextNode = () => document.getElementById("ops-generic-popup-text");
const getPrimaryButton = () =>
  document.getElementById("ops-generic-popup-primary-btn");

const expectPopupContentVisible = (
  heading: string = baseProps.heading,
  text: string = baseProps.text,
) => {
  expect(screen.getByText(heading)).toBeInTheDocument();
  expect(screen.getByText(text)).toBeInTheDocument();
};

const expectPopupContentHidden = async (
  heading: string = baseProps.heading,
  text: string = baseProps.text,
) => {
  await waitFor(() => {
    expect(screen.queryByText(heading)).not.toBeInTheDocument();
    expect(screen.queryByText(text)).not.toBeInTheDocument();
  });
};

describe("OpsGenericPopup", () => {
  describe("rendering and structure", () => {
    it("does not render popup content when isOpen is false", () => {
      renderPopup({ isOpen: false });

      expect(screen.queryByText(baseProps.heading)).not.toBeInTheDocument();
      expect(screen.queryByText(baseProps.text)).not.toBeInTheDocument();
      expect(getContainer()).not.toBeInTheDocument();
    });

    it("renders heading and text when isOpen is true", () => {
      renderPopup();
      expectPopupContentVisible();
    });

    it("renders a dialog role when open", () => {
      renderPopup();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("renders overlay and container elements with stable ids", () => {
      renderPopup();

      expect(getOverlay()).toBeInTheDocument();
      expect(getContainer()).toBeInTheDocument();
    });

    it("renders heading and text nodes with expected ids", () => {
      renderPopup();

      expect(getHeadingNode()).toBeInTheDocument();
      expect(getTextNode()).toBeInTheDocument();
    });

    it("renders close button with expected id", () => {
      renderPopup();

      expect(getCloseButton()).toBeInTheDocument();
    });

    it("keeps heading and text class names applied", () => {
      renderPopup();

      expect(getHeadingNode()).toHaveClass("ops-generic-popup-heading");
      expect(getTextNode()).toHaveClass("ops-generic-popup-text");
    });

    it("renders multiline heading and text values", () => {
      renderPopup({
        heading: "Merge done\nfor this profile",
        text: "Line 1\nLine 2\nLine 3",
      });

      expect(getHeadingNode()).toHaveTextContent("Merge done for this profile");
      expect(getTextNode()).toHaveTextContent("Line 1 Line 2 Line 3");
    });

    it("renders special characters in heading and text", () => {
      renderPopup({
        heading: "Merged #42 @ School-A",
        text: "Status: success (100%)",
      });

      expect(screen.getByText("Merged #42 @ School-A")).toBeInTheDocument();
      expect(screen.getByText("Status: success (100%)")).toBeInTheDocument();
    });
  });

  describe("media rendering rules", () => {
    it("does not render icon and image wrappers when no media props are provided", () => {
      renderPopup();

      expect(getIconWrapper()).not.toBeInTheDocument();
      expect(getImageWrapper()).not.toBeInTheDocument();
      expect(screen.queryByAltText("popup visual")).not.toBeInTheDocument();
    });

    it("renders image when imageSrc is provided and icon is not provided", () => {
      renderPopup({ imageSrc: "/images/success.svg" });

      const popupImage = screen.getByAltText("popup visual");
      expect(popupImage).toBeInTheDocument();
      expect(popupImage).toHaveAttribute("src", "/images/success.svg");
      expect(getIconWrapper()).not.toBeInTheDocument();
      expect(getImageWrapper()).toBeInTheDocument();
    });

    it("does not render image when imageSrc is an empty string", () => {
      renderPopup({ imageSrc: "" });
      expect(screen.queryByAltText("popup visual")).not.toBeInTheDocument();
      expect(getImageWrapper()).not.toBeInTheDocument();
    });

    it("renders icon wrapper when icon is provided", () => {
      renderPopup({ icon: <span data-testid="ops-icon">ok</span> });

      expect(getIconWrapper()).toBeInTheDocument();
      expect(screen.getByTestId("ops-icon")).toBeInTheDocument();
      expect(screen.queryByAltText("popup visual")).not.toBeInTheDocument();
    });

    it("prefers icon over image when both icon and imageSrc are provided", () => {
      renderPopup({
        imageSrc: "/images/success.svg",
        icon: <span data-testid="ops-icon-priority">priority</span>,
      });

      expect(screen.getByTestId("ops-icon-priority")).toBeInTheDocument();
      expect(getIconWrapper()).toBeInTheDocument();
      expect(screen.queryByAltText("popup visual")).not.toBeInTheDocument();
      expect(getImageWrapper()).not.toBeInTheDocument();
    });

    it("renders image when icon is explicitly undefined", () => {
      renderPopup({
        imageSrc: "/images/success.svg",
        icon: undefined,
      });

      expect(screen.getByAltText("popup visual")).toBeInTheDocument();
      expect(getIconWrapper()).not.toBeInTheDocument();
    });

    it("renders image when icon is null", () => {
      renderPopup({
        imageSrc: "/images/success.svg",
        icon: null,
      });

      expect(screen.getByAltText("popup visual")).toBeInTheDocument();
      expect(getIconWrapper()).not.toBeInTheDocument();
    });

    it("supports complex icon nodes", () => {
      renderPopup({
        icon: (
          <div data-testid="complex-icon">
            <span>Inner Icon</span>
          </div>
        ),
      });

      expect(screen.getByTestId("complex-icon")).toBeInTheDocument();
      expect(screen.getByText("Inner Icon")).toBeInTheDocument();
    });

    it("updates image source on rerender", () => {
      const { rerender } = renderPopup({ imageSrc: "/images/one.svg" });
      expect(screen.getByAltText("popup visual")).toHaveAttribute(
        "src",
        "/images/one.svg",
      );

      rerender(<OpsGenericPopup {...baseProps} imageSrc="/images/two.svg" />);
      expect(screen.getByAltText("popup visual")).toHaveAttribute(
        "src",
        "/images/two.svg",
      );
    });

    it("switches from image to icon on rerender", () => {
      const { rerender } = renderPopup({ imageSrc: "/images/one.svg" });
      expect(screen.getByAltText("popup visual")).toBeInTheDocument();

      rerender(
        <OpsGenericPopup
          {...baseProps}
          imageSrc="/images/one.svg"
          icon={<span data-testid="after-switch-icon">icon</span>}
        />,
      );

      expect(screen.getByTestId("after-switch-icon")).toBeInTheDocument();
      expect(screen.queryByAltText("popup visual")).not.toBeInTheDocument();
    });

    it("switches from icon to image on rerender", () => {
      const { rerender } = renderPopup({
        icon: <span data-testid="first-icon">icon</span>,
      });
      expect(screen.getByTestId("first-icon")).toBeInTheDocument();

      rerender(<OpsGenericPopup {...baseProps} imageSrc="/images/next.svg" />);

      expect(screen.getByAltText("popup visual")).toBeInTheDocument();
      expect(screen.queryByTestId("first-icon")).not.toBeInTheDocument();
    });
  });

  describe("primary button behavior", () => {
    it("does not render primary button when primaryButtonText is undefined", () => {
      renderPopup();
      expect(getPrimaryButton()).not.toBeInTheDocument();
    });

    it("does not render primary button when primaryButtonText is empty string", () => {
      renderPopup({ primaryButtonText: "" });
      expect(getPrimaryButton()).not.toBeInTheDocument();
    });

    it("renders primary button when primaryButtonText is provided", () => {
      renderPopup({ primaryButtonText: "Done" });
      expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
      expect(getPrimaryButton()).toBeInTheDocument();
    });

    it("keeps primary button class and id when provided", () => {
      renderPopup({ primaryButtonText: "Proceed" });

      const button = getPrimaryButton();
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("ops-generic-popup-primary-btn");
      expect(button).toHaveTextContent("Proceed");
    });

    it("supports long primary button text", () => {
      const longText = "Continue to school dashboard and refresh details";
      renderPopup({ primaryButtonText: longText });

      expect(screen.getByRole("button", { name: longText })).toBeInTheDocument();
    });

    it("shows and hides primary button when prop toggles", () => {
      const { rerender } = renderPopup({ primaryButtonText: "Done" });
      expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();

      rerender(<OpsGenericPopup {...baseProps} />);
      expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
    });

    it("updates primary button text when prop changes", () => {
      const { rerender } = renderPopup({ primaryButtonText: "Next" });
      expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();

      rerender(<OpsGenericPopup {...baseProps} primaryButtonText="Done" />);
      expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    });
  });

  describe("close interactions", () => {
    it("calls onClose when close icon button is clicked", () => {
      const { onClose } = renderPopupWithClose();

      const closeButton = getCloseButton();
      expect(closeButton).toBeTruthy();
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when primary button is clicked", () => {
      const { onClose } = renderPopupWithClose({
        primaryButtonText: "Done",
      });

      fireEvent.click(screen.getByRole("button", { name: "Done" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose even when both icon and button are present", () => {
      const { onClose } = renderPopupWithClose({
        primaryButtonText: "Done",
        icon: <span data-testid="close-combo-icon">ok</span>,
      });

      expect(screen.getByTestId("close-combo-icon")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Done" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("stays open if parent keeps isOpen=true after close", async () => {
      const { onClose, rerender } = renderPopupWithClose();
      const closeButton = getCloseButton();

      expect(closeButton).toBeTruthy();
      if (closeButton) {
        fireEvent.click(closeButton);
      }
      expect(onClose).toHaveBeenCalledTimes(1);

      rerender(<OpsGenericPopup {...baseProps} isOpen={true} />);
      expectPopupContentVisible();
    });

    it("remains closed after parent sets isOpen=false", async () => {
      const { onClose, rerender } = renderPopupWithClose();

      const closeButton = getCloseButton();
      expect(closeButton).toBeTruthy();
      if (closeButton) {
        fireEvent.click(closeButton);
      }
      expect(onClose).toHaveBeenCalledTimes(1);

      rerender(<OpsGenericPopup {...baseProps} isOpen={false} />);
      await expectPopupContentHidden();
    });
  });

  describe("prop synchronization and rerender flows", () => {
    it("syncs internal visibility when parent toggles isOpen from false to true", () => {
      const { rerender } = renderPopup({ isOpen: false });
      expect(screen.queryByText(baseProps.heading)).not.toBeInTheDocument();

      rerender(<OpsGenericPopup {...baseProps} isOpen={true} />);
      expectPopupContentVisible();
    });

    it("syncs internal visibility when parent toggles isOpen from true to false", async () => {
      const { rerender } = renderPopup({ isOpen: true });
      expectPopupContentVisible();

      rerender(<OpsGenericPopup {...baseProps} isOpen={false} />);
      await expectPopupContentHidden();
    });

    it("syncs visibility across multiple toggles", async () => {
      const { rerender } = renderPopup({ isOpen: false });
      expect(screen.queryByText(baseProps.heading)).not.toBeInTheDocument();

      rerender(<OpsGenericPopup {...baseProps} isOpen={true} />);
      expectPopupContentVisible();

      rerender(<OpsGenericPopup {...baseProps} isOpen={false} />);
      await expectPopupContentHidden();

      rerender(<OpsGenericPopup {...baseProps} isOpen={true} />);
      expectPopupContentVisible();
    });

    it("updates heading text on rerender", () => {
      const { rerender } = renderPopup();
      expect(screen.getByText("Merge completed")).toBeInTheDocument();

      rerender(
        <OpsGenericPopup
          {...baseProps}
          heading="Updated merge message"
          text={baseProps.text}
        />,
      );

      expect(screen.getByText("Updated merge message")).toBeInTheDocument();
      expect(screen.queryByText("Merge completed")).not.toBeInTheDocument();
    });

    it("updates body text on rerender", () => {
      const { rerender } = renderPopup();
      expect(screen.getByText(baseProps.text)).toBeInTheDocument();

      rerender(
        <OpsGenericPopup
          {...baseProps}
          heading={baseProps.heading}
          text="Profile merged into destination student"
        />,
      );

      expect(
        screen.getByText("Profile merged into destination student"),
      ).toBeInTheDocument();
      expect(screen.queryByText(baseProps.text)).not.toBeInTheDocument();
    });

    it("retains overlay and container ids after rerender", () => {
      const { rerender } = renderPopup();
      expect(getOverlay()).toBeInTheDocument();
      expect(getContainer()).toBeInTheDocument();

      rerender(
        <OpsGenericPopup
          {...baseProps}
          heading="Rerender heading"
          text="Rerender text"
          primaryButtonText="Done"
        />,
      );

      expect(getOverlay()).toBeInTheDocument();
      expect(getContainer()).toBeInTheDocument();
    });

    it("reopens when parent toggles false then true after close", async () => {
      const { onClose, rerender } = renderPopupWithClose();

      const closeButton = getCloseButton();
      expect(closeButton).toBeTruthy();
      if (closeButton) {
        fireEvent.click(closeButton);
      }
      expect(onClose).toHaveBeenCalledTimes(1);

      rerender(<OpsGenericPopup {...baseProps} isOpen={false} />);
      await expectPopupContentHidden();

      rerender(<OpsGenericPopup {...baseProps} isOpen={true} />);
      expectPopupContentVisible();
    });
  });

  describe("timer and autoCloseSeconds behavior", () => {
    it("does not auto-close when autoCloseSeconds is set because timer effect is disabled", () => {
      jest.useFakeTimers();

      try {
        renderPopup({ autoCloseSeconds: 1 });
        expectPopupContentVisible();

        act(() => {
          jest.advanceTimersByTime(3000);
        });
        expectPopupContentVisible();
      } finally {
        jest.useRealTimers();
      }
    });

    it("stays hidden when started closed even after timers advance", () => {
      jest.useFakeTimers();

      try {
        renderPopup({ isOpen: false, autoCloseSeconds: 1 });
        act(() => {
          jest.advanceTimersByTime(5000);
        });
        expect(screen.queryByText(baseProps.heading)).not.toBeInTheDocument();
      } finally {
        jest.useRealTimers();
      }
    });

    it("does not auto-close when autoCloseSeconds changes on rerender", () => {
      jest.useFakeTimers();

      try {
        const { rerender } = renderPopup({ autoCloseSeconds: 1 });
        expectPopupContentVisible();

        rerender(<OpsGenericPopup {...baseProps} autoCloseSeconds={5} />);
        act(() => {
          jest.advanceTimersByTime(6000);
        });
        expectPopupContentVisible();
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
