import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CommonDialogBox from "./CommonDialogBox";

jest.mock("i18next", () => ({
  t: (key: string) => key,
}));

jest.mock("@ionic/react", () => {
  return {
    IonAlert: ({
      isOpen,
      header,
      message,
      buttons,
      onDidDismiss,
      cssClass,
    }: any) =>
      isOpen ? (
        <div data-testid="ion-alert" className={cssClass}>
          <div data-testid="alert-header">{header}</div>
          <div data-testid="alert-message">{message}</div>
          <div>
            {buttons?.map((btn: any, index: number) => (
              <button
                key={index}
                className={btn.cssClass}
                onClick={() => btn.handler?.()}
              >
                {btn.text}
              </button>
            ))}
          </div>
          <button data-testid="dismiss-btn" onClick={onDidDismiss}>
            dismiss
          </button>
        </div>
      ) : null,
  };
});

describe("CommonDialogBox Component", () => {
  const mockLeftHandler = jest.fn();
  const mockRightHandler = jest.fn();
  const mockDismiss = jest.fn();

  const renderComponent = (props: any = {}) =>
    render(
      <CommonDialogBox
        message="test.message"
        showConfirmFlag={true}
        onDidDismiss={mockDismiss}
        {...props}
      />,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders IonAlert when showConfirmFlag is true", () => {
    renderComponent();
    expect(screen.getByTestId("ion-alert")).toBeInTheDocument();
  });

  test("does not render IonAlert when showConfirmFlag is false", () => {
    renderComponent({ showConfirmFlag: false });
    expect(screen.queryByTestId("ion-alert")).not.toBeInTheDocument();
  });

  test("renders header when provided", () => {
    renderComponent({ header: "Test Header" });
    expect(screen.getByTestId("alert-header")).toHaveTextContent("Test Header");
  });

  test("renders translated message", () => {
    renderComponent({ message: "dialog.message" });
    expect(screen.getByTestId("alert-message")).toHaveTextContent(
      "dialog.message",
    );
  });

  test("renders left button when leftButtonText provided", () => {
    renderComponent({
      leftButtonText: "delete",
      leftButtonHandler: mockLeftHandler,
    });

    expect(screen.getByText("delete")).toBeInTheDocument();
  });

  test("renders right button when rightButtonText provided", () => {
    renderComponent({
      rightButtonText: "cancel",
      rightButtonHandler: mockRightHandler,
    });

    expect(screen.getByText("cancel")).toBeInTheDocument();
  });

  test("calls left button handler when clicked", () => {
    renderComponent({
      leftButtonText: "delete",
      leftButtonHandler: mockLeftHandler,
    });

    fireEvent.click(screen.getByText("delete"));
    expect(mockLeftHandler).toHaveBeenCalledTimes(1);
  });

  test("calls right button handler when clicked", () => {
    renderComponent({
      rightButtonText: "cancel",
      rightButtonHandler: mockRightHandler,
    });

    fireEvent.click(screen.getByText("cancel"));
    expect(mockRightHandler).toHaveBeenCalledTimes(1);
  });

  test("calls onDidDismiss when dismiss button clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByTestId("dismiss-btn"));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  test("does not render left button when leftButtonText missing", () => {
    renderComponent();
    expect(screen.queryByText("delete")).not.toBeInTheDocument();
  });

  test("does not render right button when rightButtonText missing", () => {
    renderComponent();
    expect(screen.queryByText("cancel")).not.toBeInTheDocument();
  });

  test("renders both buttons when both texts provided", () => {
    renderComponent({
      leftButtonText: "delete",
      rightButtonText: "cancel",
    });

    expect(screen.getByText("delete")).toBeInTheDocument();
    expect(screen.getByText("cancel")).toBeInTheDocument();
  });

  test("left button has correct css class", () => {
    renderComponent({
      leftButtonText: "delete",
    });

    expect(screen.getByText("delete")).toHaveClass(
      "custom-dailog-alert-delete-button",
    );
  });

  test("right button has correct css class", () => {
    renderComponent({
      rightButtonText: "cancel",
    });

    expect(screen.getByText("cancel")).toHaveClass(
      "custom-dailog-alert-cancel-button",
    );
  });

  test("alert container has correct css class", () => {
    renderComponent();
    expect(screen.getByTestId("ion-alert")).toHaveClass("custom-dailog-alert");
  });

  test("handles empty message safely", () => {
    renderComponent({ message: "" });
    expect(screen.getByTestId("alert-message")).toHaveTextContent("");
  });

  test("handles undefined header safely", () => {
    renderComponent();
    expect(screen.getByTestId("alert-header")).toBeInTheDocument();
  });

  test("multiple button clicks call handlers correct number of times", () => {
    renderComponent({
      leftButtonText: "delete",
      leftButtonHandler: mockLeftHandler,
    });

    fireEvent.click(screen.getByText("delete"));
    fireEvent.click(screen.getByText("delete"));

    expect(mockLeftHandler).toHaveBeenCalledTimes(2);
  });

  test("dismiss can be triggered multiple times", () => {
    renderComponent();

    fireEvent.click(screen.getByTestId("dismiss-btn"));
    fireEvent.click(screen.getByTestId("dismiss-btn"));

    expect(mockDismiss).toHaveBeenCalledTimes(2);
  });

  test("renders inside wrapping div", () => {
    const { container } = renderComponent();
    expect(container.firstChild).toBeInTheDocument();
  });

  test("buttons array empty when no button texts provided", () => {
    renderComponent();
    expect(screen.queryAllByRole("button").length).toBe(1); // only dismiss
  });

  test("does not crash with only left button", () => {
    expect(() => renderComponent({ leftButtonText: "delete" })).not.toThrow();
  });

  test("does not crash with only right button", () => {
    expect(() => renderComponent({ rightButtonText: "cancel" })).not.toThrow();
  });

  test("does not crash with all props provided", () => {
    expect(() =>
      renderComponent({
        header: "Header",
        leftButtonText: "delete",
        leftButtonHandler: mockLeftHandler,
        rightButtonText: "cancel",
        rightButtonHandler: mockRightHandler,
      }),
    ).not.toThrow();
  });

  test("alert closes properly when showConfirmFlag toggles", () => {
    const { rerender } = renderComponent();

    rerender(
      <CommonDialogBox
        message="test"
        showConfirmFlag={false}
        onDidDismiss={mockDismiss}
      />,
    );

    expect(screen.queryByTestId("ion-alert")).not.toBeInTheDocument();
  });
  test("renders translated left button text exactly as key", () => {
    renderComponent({
      leftButtonText: "confirm.delete",
    });

    expect(screen.getByText("confirm.delete")).toBeInTheDocument();
  });

  test("renders translated right button text exactly as key", () => {
    renderComponent({
      rightButtonText: "action.cancel",
    });

    expect(screen.getByText("action.cancel")).toBeInTheDocument();
  });

  test("left button works even if handler is undefined", () => {
    renderComponent({
      leftButtonText: "delete",
    });

    fireEvent.click(screen.getByText("delete"));
    expect(mockLeftHandler).not.toHaveBeenCalled();
  });

  test("right button works even if handler is undefined", () => {
    renderComponent({
      rightButtonText: "cancel",
    });

    fireEvent.click(screen.getByText("cancel"));
    expect(mockRightHandler).not.toHaveBeenCalled();
  });

  test("header renders empty when not provided", () => {
    renderComponent();
    expect(screen.getByTestId("alert-header")).toHaveTextContent("");
  });

  test("message always renders as string", () => {
    renderComponent({ message: "simple.message" });
    expect(typeof screen.getByTestId("alert-message").textContent).toBe(
      "string",
    );
  });

  test("buttons render in correct order: left then right", () => {
    renderComponent({
      leftButtonText: "delete",
      rightButtonText: "cancel",
    });

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveTextContent("delete");
    expect(buttons[1]).toHaveTextContent("cancel");
  });

  test("changing showConfirmFlag from false to true shows alert", () => {
    const { rerender } = render(
      <CommonDialogBox
        message="test"
        showConfirmFlag={false}
        onDidDismiss={mockDismiss}
      />,
    );

    expect(screen.queryByTestId("ion-alert")).not.toBeInTheDocument();

    rerender(
      <CommonDialogBox
        message="test"
        showConfirmFlag={true}
        onDidDismiss={mockDismiss}
      />,
    );

    expect(screen.getByTestId("ion-alert")).toBeInTheDocument();
  });

  test("alert retains css class when buttons are added", () => {
    renderComponent({
      leftButtonText: "delete",
      rightButtonText: "cancel",
    });

    expect(screen.getByTestId("ion-alert")).toHaveClass("custom-dailog-alert");
  });

  test("component does not render duplicate buttons when rerendered with same props", () => {
    const { rerender } = renderComponent({
      leftButtonText: "delete",
    });

    rerender(
      <CommonDialogBox
        message="test.message"
        showConfirmFlag={true}
        onDidDismiss={mockDismiss}
        leftButtonText="delete"
      />,
    );

    expect(screen.getAllByText("delete").length).toBe(1);
  });
});
