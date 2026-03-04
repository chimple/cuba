import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CommonToggle from "./CommonToggle";

jest.mock("i18next", () => ({
  t: (key: string) => key,
}));

jest.mock("@ionic/react", () => ({
  IonLabel: ({ children, className }: any) => (
    <label data-testid="ion-label" className={className}>
      {children}
    </label>
  ),
  IonToggle: ({ checked, onIonChange, className, id }: any) => (
    <input
      type="checkbox"
      data-testid="ion-toggle"
      id={id}
      className={className}
      checked={!!checked}
      onChange={(e) =>
        onIonChange?.({
          detail: { checked: e.target.checked },
        })
      }
    />
  ),
}));

describe("CommonToggle Component", () => {
  const mockOnChange = jest.fn();

  const renderComponent = (props: any = {}) =>
    render(<CommonToggle checked={false} onChange={mockOnChange} {...props} />);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1
  test("renders container div", () => {
    const { container } = renderComponent();
    expect(container.firstChild).toHaveClass("rounded-toggle-container");
  });

  // 2
  test("renders IonToggle", () => {
    renderComponent();
    expect(screen.getByTestId("ion-toggle")).toBeInTheDocument();
  });

  // 3
  test("does not render label if not provided", () => {
    renderComponent();
    expect(screen.queryByTestId("ion-label")).not.toBeInTheDocument();
  });

  // 4
  test("renders label when provided", () => {
    renderComponent({ label: "toggle.label" });
    expect(screen.getByTestId("ion-label")).toBeInTheDocument();
  });

  // 5
  test("renders translated label text", () => {
    renderComponent({ label: "settings.enable" });
    expect(screen.getByText("settings.enable")).toBeInTheDocument();
  });

  // 6
  test("label has correct class", () => {
    renderComponent({ label: "label" });
    expect(screen.getByTestId("ion-label")).toHaveClass(
      "common-toggle-toggle-label",
    );
  });

  // 7
  test("toggle has correct class", () => {
    renderComponent();
    expect(screen.getByTestId("ion-toggle")).toHaveClass(
      "common-toggle-custom-rounded-toggle",
    );
  });

  // 8
  test("toggle has correct id", () => {
    renderComponent();
    expect(screen.getByTestId("ion-toggle")).toHaveAttribute("id", "toggle");
  });

  // 9
  test("toggle reflects checked true", () => {
    renderComponent({ checked: true });
    expect(screen.getByTestId("ion-toggle")).toBeChecked();
  });

  // 10
  test("toggle reflects checked false", () => {
    renderComponent({ checked: false });
    expect(screen.getByTestId("ion-toggle")).not.toBeChecked();
  });

  // 11
  test("toggle defaults to unchecked when checked undefined", () => {
    render(<CommonToggle onChange={mockOnChange} />);
    expect(screen.getByTestId("ion-toggle")).not.toBeChecked();
  });

  // 12
  test("calls onChange when toggled on", () => {
    renderComponent({ checked: false });

    fireEvent.click(screen.getByTestId("ion-toggle"));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  // 13
  test("calls onChange when toggled off", () => {
    renderComponent({ checked: true });

    fireEvent.click(screen.getByTestId("ion-toggle"));

    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  // 14
  test("onChange receives event object", () => {
    renderComponent();

    fireEvent.click(screen.getByTestId("ion-toggle"));

    expect(mockOnChange.mock.calls[0][0]).toHaveProperty("detail");
  });

  // 15
  test("multiple toggle clicks trigger multiple calls", () => {
    renderComponent();

    fireEvent.click(screen.getByTestId("ion-toggle"));
    fireEvent.click(screen.getByTestId("ion-toggle"));

    expect(mockOnChange).toHaveBeenCalledTimes(2);
  });

  // 16
  test("component mounts without crashing", () => {
    expect(() => renderComponent()).not.toThrow();
  });

  // 17
  test("component unmounts without crashing", () => {
    const { unmount } = renderComponent();
    expect(() => unmount()).not.toThrow();
  });

  // 18
  test("rerender updates checked state", () => {
    const { rerender } = renderComponent({ checked: false });

    rerender(<CommonToggle checked={true} onChange={mockOnChange} />);

    expect(screen.getByTestId("ion-toggle")).toBeChecked();
  });

  // 19
  test("rerender removes label when prop removed", () => {
    const { rerender } = renderComponent({ label: "test" });

    rerender(<CommonToggle checked={false} onChange={mockOnChange} />);

    expect(screen.queryByTestId("ion-label")).not.toBeInTheDocument();
  });

  // 20
  test("renders correctly with all props", () => {
    renderComponent({ checked: true, label: "full.test" });
    expect(screen.getByText("full.test")).toBeInTheDocument();
    expect(screen.getByTestId("ion-toggle")).toBeChecked();
  });

  // 21–35 (behavior stability)

  test("label text is string type", () => {
    renderComponent({ label: "abc" });
    expect(typeof screen.getByTestId("ion-label").textContent).toBe("string");
  });

  test("container wraps toggle element", () => {
    renderComponent();
    expect(screen.getByTestId("ion-toggle").parentElement).toHaveClass(
      "rounded-toggle-container",
    );
  });

  test("toggle exists even without label", () => {
    renderComponent();
    expect(screen.getByTestId("ion-toggle")).toBeInTheDocument();
  });

  test("label renders only once", () => {
    renderComponent({ label: "single" });
    expect(screen.getAllByTestId("ion-label").length).toBe(1);
  });

  test("toggle element type is checkbox", () => {
    renderComponent();
    expect(screen.getByTestId("ion-toggle")).toHaveAttribute(
      "type",
      "checkbox",
    );
  });

  test("clicking label does not crash", () => {
    renderComponent({ label: "label" });
    fireEvent.click(screen.getByTestId("ion-label"));
    expect(true).toBe(true);
  });

  test("toggle checked attribute reflects boolean conversion", () => {
    renderComponent({ checked: 1 as any });
    expect(screen.getByTestId("ion-toggle")).toBeChecked();
  });

  test("toggle unchecked when checked is 0", () => {
    renderComponent({ checked: 0 as any });
    expect(screen.getByTestId("ion-toggle")).not.toBeChecked();
  });

  test("component handles empty label string safely", () => {
    renderComponent({ label: "" });
    expect(screen.queryByTestId("ion-label")).not.toBeInTheDocument();
  });

  test("toggle still renders when label empty string", () => {
    renderComponent({ label: "" });
    expect(screen.getByTestId("ion-toggle")).toBeInTheDocument();
  });

  test("onChange not called before interaction", () => {
    renderComponent();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test("checked true remains true without interaction", () => {
    renderComponent({ checked: true });
    expect(screen.getByTestId("ion-toggle")).toBeChecked();
  });

  test("checked false remains false without interaction", () => {
    renderComponent({ checked: false });
    expect(screen.getByTestId("ion-toggle")).not.toBeChecked();
  });

  test("toggle remains stable across rerenders", () => {
    const { rerender } = renderComponent({ checked: true });

    rerender(<CommonToggle checked={true} onChange={mockOnChange} />);

    expect(screen.getByTestId("ion-toggle")).toBeChecked();
  });

  test("does not duplicate toggle on rerender", () => {
    const { rerender } = renderComponent();

    rerender(<CommonToggle checked={false} onChange={mockOnChange} />);

    expect(screen.getAllByTestId("ion-toggle").length).toBe(1);
  });
  test("onChange receives correct checked value when toggled on", () => {
    renderComponent({ checked: false });

    fireEvent.click(screen.getByTestId("ion-toggle"));

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { checked: true },
      }),
    );
  });

  test("onChange receives correct checked value when toggled off", () => {
    renderComponent({ checked: true });

    fireEvent.click(screen.getByTestId("ion-toggle"));

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { checked: false },
      }),
    );
  });

  test("label renders before toggle in DOM order", () => {
    renderComponent({ label: "order.test" });

    const container = screen.getByTestId("ion-toggle").parentElement;
    expect(container?.firstChild).toHaveTextContent("order.test");
  });

  test("container always contains exactly one toggle", () => {
    renderComponent({ label: "test" });

    const toggles = screen.getAllByTestId("ion-toggle");
    expect(toggles.length).toBe(1);
  });

  test("component handles rapid multiple clicks safely", () => {
    renderComponent();

    const toggle = screen.getByTestId("ion-toggle");

    fireEvent.click(toggle);
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(mockOnChange).toHaveBeenCalledTimes(3);
  });
});
