import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import CalendarPicker from "./CalendarPicker";

jest.mock("@ionic/react", () => {
  const React = require("react");

  return {
    IonDatetime: React.forwardRef((props: any, ref: any) => (
      <input
        data-testid="ion-datetime"
        ref={ref}
        value={props.value || ""}
        min={props.min}
        max={props.max}
        className={props.className}
        onChange={(e: any) =>
          props.onIonChange?.({
            detail: { value: e.target.value },
          })
        }
      />
    )),
    IonButtons: ({ children }: any) => <div>{children}</div>,
    IonButton: ({ children, onClick, className }: any) => (
      <button onClick={onClick} className={className}>
        {children}
      </button>
    ),
  };
});
const mockConfirm = jest.fn();
const mockCancel = jest.fn();

const renderComponent = (props: any = {}) =>
  render(
    <CalendarPicker
      value={null}
      onConfirm={mockConfirm}
      onCancel={mockCancel}
      mode="start"
      {...props}
    />,
  );

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CalendarPicker Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders calendar picker container", () => {
    renderComponent();
    expect(document.querySelector(".calendar-picker")).toBeInTheDocument();
  });

  test("renders IonDatetime", () => {
    renderComponent();
    expect(screen.getByTestId("ion-datetime")).toBeInTheDocument();
  });

  test("updates currentValue when value prop changes", () => {
    const { rerender } = renderComponent({ value: "2024-01-01" });

    rerender(
      <CalendarPicker
        value="2024-02-01"
        onConfirm={mockConfirm}
        onCancel={mockCancel}
        mode="start"
      />,
    );

    expect(screen.getByDisplayValue("2024-02-01")).toBeInTheDocument();
  });

  test("sets min date correctly in start mode", () => {
    renderComponent({ minDate: "2020-01-01" });
    expect(screen.getByTestId("ion-datetime")).toHaveAttribute(
      "min",
      "2020-01-01",
    );
  });

  test("sets min date to startDate in end mode", () => {
    renderComponent({
      mode: "end",
      startDate: "2022-01-01",
    });

    expect(screen.getByTestId("ion-datetime")).toHaveAttribute(
      "min",
      "2022-01-01",
    );
  });

  test("uses fallback min date if none provided", () => {
    renderComponent({ mode: "end" });
    expect(screen.getByTestId("ion-datetime")).toHaveAttribute(
      "min",
      "1900-01-01",
    );
  });

  test("respects maxDate prop", () => {
    renderComponent({ maxDate: "2030-01-01" });
    expect(screen.getByTestId("ion-datetime")).toHaveAttribute(
      "max",
      "2030-01-01",
    );
  });

  test("handles valid date change inside range", () => {
    renderComponent({ minDate: "2020-01-01", maxDate: "2030-01-01" });

    fireEvent.change(screen.getByTestId("ion-datetime"), {
      target: { value: "2025-01-01" },
    });

    expect(screen.getByDisplayValue("2025-01-01")).toBeInTheDocument();
  });

  test("rejects date lower than min", () => {
    renderComponent({ minDate: "2020-01-01" });

    fireEvent.change(screen.getByTestId("ion-datetime"), {
      target: { value: "2010-01-01" },
    });

    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  test("rejects date higher than max", () => {
    renderComponent({ maxDate: "2020-01-01" });

    fireEvent.change(screen.getByTestId("ion-datetime"), {
      target: { value: "2030-01-01" },
    });

    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  test("accepts boundary min date", () => {
    renderComponent({ minDate: "2020-01-01" });

    fireEvent.change(screen.getByTestId("ion-datetime"), {
      target: { value: "2020-01-01" },
    });

    expect(screen.getByDisplayValue("2020-01-01")).toBeInTheDocument();
  });

  test("accepts boundary max date", () => {
    renderComponent({ maxDate: "2030-01-01" });

    fireEvent.change(screen.getByTestId("ion-datetime"), {
      target: { value: "2030-01-01" },
    });

    expect(screen.getByDisplayValue("2030-01-01")).toBeInTheDocument();
  });
  test("component mounts without crashing", () => {
    expect(() => renderComponent()).not.toThrow();
  });

  test("component unmounts without crashing", () => {
    const { unmount } = renderComponent();
    expect(() => unmount()).not.toThrow();
  });

  test("initial value prop is reflected in input", () => {
    renderComponent({ value: "2024-03-15" });
    expect(screen.getByTestId("ion-datetime")).toHaveValue("2024-03-15");
  });

  test("value null renders empty input", () => {
    renderComponent({ value: null });
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  test("changing to same valid date keeps value", () => {
    renderComponent({ minDate: "2020-01-01", maxDate: "2030-01-01" });

    fireEvent.change(screen.getByTestId("ion-datetime"), {
      target: { value: "2025-01-01" },
    });

    fireEvent.change(screen.getByTestId("ion-datetime"), {
      target: { value: "2025-01-01" },
    });

    expect(screen.getByDisplayValue("2025-01-01")).toBeInTheDocument();
  });

  test("changing date does not trigger confirm automatically", () => {
    renderComponent();

    fireEvent.change(screen.getByTestId("ion-datetime"), {
      target: { value: "2024-08-08" },
    });

    expect(mockConfirm).not.toHaveBeenCalled();
  });

  test("invalid lower date does not overwrite existing valid value", () => {
    renderComponent({
      value: "2024-01-01",
      minDate: "2020-01-01",
      maxDate: "2030-01-01",
    });

    fireEvent.change(screen.getByTestId("ion-datetime"), {
      target: { value: "2010-01-01" },
    });

    expect(screen.getByDisplayValue("2024-01-01")).toBeInTheDocument();
  });

  test("empty string change is handled safely", () => {
    renderComponent();

    fireEvent.change(screen.getByTestId("ion-datetime"), {
      target: { value: "" },
    });

    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  test("start mode keeps explicit minDate", () => {
    renderComponent({ mode: "start", minDate: "2010-01-01" });

    expect(screen.getByTestId("ion-datetime")).toHaveAttribute(
      "min",
      "2010-01-01",
    );
  });

  test("end mode prefers provided minDate over startDate", () => {
    renderComponent({
      mode: "end",
      startDate: "2022-01-01",
      minDate: "2020-01-01",
    });

    expect(screen.getByTestId("ion-datetime")).toHaveAttribute(
      "min",
      "2020-01-01",
    );
  });

  test("end mode without startDate still renders safely", () => {
    renderComponent({ mode: "end" });
    expect(screen.getByTestId("ion-datetime")).toBeInTheDocument();
  });

  test("min attribute always exists", () => {
    renderComponent();
    expect(screen.getByTestId("ion-datetime")).toHaveAttribute("min");
  });

  test("max attribute always exists", () => {
    renderComponent();
    expect(screen.getByTestId("ion-datetime")).toHaveAttribute("max");
  });

  test("rerender with new value updates input", () => {
    const { rerender } = renderComponent({ value: "2023-01-01" });

    rerender(
      <CalendarPicker
        value="2023-12-31"
        onConfirm={mockConfirm}
        onCancel={mockCancel}
        mode="start"
      />,
    );

    expect(screen.getByDisplayValue("2023-12-31")).toBeInTheDocument();
  });
});
