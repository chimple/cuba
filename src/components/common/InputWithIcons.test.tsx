import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import InputWithIcons from "./InputWithIcons";

describe("InputWithIcons Component", () => {
  const mockSetValue = jest.fn();

  const defaultProps = {
    label: "Username",
    placeholder: "Enter name",
    value: "",
    setValue: mockSetValue,
    icon: "/icon.png",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders label", () => {
    render(<InputWithIcons {...defaultProps} />);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  test("renders placeholder", () => {
    render(<InputWithIcons {...defaultProps} />);
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  test("renders icon image", () => {
    render(<InputWithIcons {...defaultProps} />);
    expect(screen.getByAltText("Input icon")).toHaveAttribute(
      "src",
      "/icon.png",
    );
  });

  test("renders required star when required is true", () => {
    render(<InputWithIcons {...defaultProps} required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  test("does not render required star when required is false", () => {
    render(<InputWithIcons {...defaultProps} />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  test("renders status icon when provided", () => {
    render(
      <InputWithIcons
        {...defaultProps}
        statusIcon={<span data-testid="status">✓</span>}
      />,
    );
    expect(screen.getByTestId("status")).toBeInTheDocument();
  });

  test("applies id to input", () => {
    render(<InputWithIcons {...defaultProps} id="input-id" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "input-id");
  });

  test("value defaults to empty string when undefined", () => {
    render(<InputWithIcons {...defaultProps} value={undefined} />);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  test("updates value for text input", () => {
    render(<InputWithIcons {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "John" },
    });
    expect(mockSetValue).toHaveBeenCalledWith("John");
  });

  test("does not call setValue when readOnly", () => {
    render(<InputWithIcons {...defaultProps} readOnly />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "John" },
    });
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  test("respects maxLength for text", () => {
    render(<InputWithIcons {...defaultProps} maxLength={3} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "abcd" },
    });
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  test("allows text within maxLength", () => {
    render(<InputWithIcons {...defaultProps} maxLength={4} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "abcd" },
    });
    expect(mockSetValue).toHaveBeenCalledWith("abcd");
  });

  test("handles number input parsing", () => {
    render(<InputWithIcons {...defaultProps} type="number" />);
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "25" },
    });
    expect(mockSetValue).toHaveBeenCalledWith(25);
  });

  test("respects maxLength for number input", () => {
    render(<InputWithIcons {...defaultProps} type="number" maxLength={2} />);
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "123" },
    });
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  test("allows number within maxLength", () => {
    render(<InputWithIcons {...defaultProps} type="number" maxLength={3} />);
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "123" },
    });
    expect(mockSetValue).toHaveBeenCalledWith(123);
  });

  test("renders input type text by default", () => {
    render(<InputWithIcons {...defaultProps} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
  });

  test("renders input type number when specified", () => {
    render(<InputWithIcons {...defaultProps} type="number" />);
    expect(screen.getByRole("spinbutton")).toHaveAttribute("type", "number");
  });

  test("renders labelOffsetClass when provided", () => {
    const { container } = render(
      <InputWithIcons {...defaultProps} labelOffsetClass="offset-class" />,
    );
    expect(container.querySelector(".offset-class")).toBeInTheDocument();
  });

  test("readOnly attribute applied", () => {
    render(<InputWithIcons {...defaultProps} readOnly />);
    expect(screen.getByRole("textbox")).toHaveAttribute("readOnly");
  });

  test("calls setValue only once per change", () => {
    render(<InputWithIcons {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "A" },
    });
    expect(mockSetValue).toHaveBeenCalledTimes(1);
  });

  test("handles numeric value prop correctly", () => {
    render(<InputWithIcons {...defaultProps} type="number" value={42} />);
    expect(screen.getByRole("spinbutton")).toHaveValue(42);
  });

  test("placeholder remains visible when value empty", () => {
    render(<InputWithIcons {...defaultProps} value="" />);
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  test("does not break when maxLength undefined", () => {
    render(<InputWithIcons {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "LongTextWithoutLimit" },
    });
    expect(mockSetValue).toHaveBeenCalled();
  });

  test("changing number input multiple times works", () => {
    render(<InputWithIcons {...defaultProps} type="number" />);
    const input = screen.getByRole("spinbutton");

    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.change(input, { target: { value: "2" } });

    expect(mockSetValue).toHaveBeenCalledTimes(2);
  });

  test("renders status container even without icon", () => {
    const { container } = render(<InputWithIcons {...defaultProps} />);
    expect(container.querySelector(".with-icon-status")).toBeInTheDocument();
  });

  test("input reflects updated prop value", () => {
    const { rerender } = render(
      <InputWithIcons {...defaultProps} value="Old" />,
    );

    rerender(<InputWithIcons {...defaultProps} value="New" />);
    expect(screen.getByRole("textbox")).toHaveValue("New");
  });

  test("numeric input parses leading zeros correctly", () => {
    render(<InputWithIcons {...defaultProps} type="number" />);
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "007" },
    });
    expect(mockSetValue).toHaveBeenCalledWith(7);
  });

  test("component mounts without crashing", () => {
    expect(() => render(<InputWithIcons {...defaultProps} />)).not.toThrow();
  });
  test("number input defaults to empty when value is undefined", () => {
    render(
      <InputWithIcons {...defaultProps} type="number" value={undefined} />,
    );
    expect(screen.getByRole("spinbutton")).toHaveValue(null);
  });

  test("does not call setValue when number input is cleared", () => {
    render(<InputWithIcons {...defaultProps} type="number" />);
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "" },
    });
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  test("handles whitespace text input correctly", () => {
    render(<InputWithIcons {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  John  " },
    });
    expect(mockSetValue).toHaveBeenCalledWith("  John  ");
  });

  test("accepts special characters in text input", () => {
    render(<InputWithIcons {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "@John_123!" },
    });
    expect(mockSetValue).toHaveBeenCalledWith("@John_123!");
  });

  test("renders with initial text value correctly", () => {
    render(<InputWithIcons {...defaultProps} value="Initial" />);
    expect(screen.getByRole("textbox")).toHaveValue("Initial");
  });

  test("renders with initial numeric value correctly", () => {
    render(<InputWithIcons {...defaultProps} type="number" value={100} />);
    expect(screen.getByRole("spinbutton")).toHaveValue(100);
  });

  test("does not exceed maxLength boundary exactly", () => {
    render(<InputWithIcons {...defaultProps} maxLength={5} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "12345" },
    });
    expect(mockSetValue).toHaveBeenCalledWith("12345");
  });

  test("prevents negative numbers if maxLength exceeded", () => {
    render(<InputWithIcons {...defaultProps} type="number" maxLength={2} />);
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "-123" },
    });
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  test("status icon updates correctly on rerender", () => {
    const { rerender } = render(
      <InputWithIcons {...defaultProps} statusIcon={<span>✓</span>} />,
    );
    rerender(<InputWithIcons {...defaultProps} statusIcon={<span>✗</span>} />);
    expect(screen.getByText("✗")).toBeInTheDocument();
  });

  test("input remains controlled after multiple rerenders", () => {
    const { rerender } = render(
      <InputWithIcons {...defaultProps} value="One" />,
    );
    rerender(<InputWithIcons {...defaultProps} value="Two" />);
    rerender(<InputWithIcons {...defaultProps} value="Three" />);
    expect(screen.getByRole("textbox")).toHaveValue("Three");
  });
  test("does not call setValue when text exceeds maxLength by 1 character", () => {
    render(<InputWithIcons {...defaultProps} maxLength={3} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "1234" },
    });
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  test("handles zero correctly in number input", () => {
    render(<InputWithIcons {...defaultProps} type="number" />);
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "0" },
    });
    expect(mockSetValue).toHaveBeenCalledWith(0);
  });

  test("input remains readOnly even after rerender", () => {
    const { rerender } = render(<InputWithIcons {...defaultProps} readOnly />);
    rerender(<InputWithIcons {...defaultProps} readOnly />);
    expect(screen.getByRole("textbox")).toHaveAttribute("readOnly");
  });

  test("does not crash when statusIcon is null", () => {
    expect(() =>
      render(<InputWithIcons {...defaultProps} statusIcon={null} />),
    ).not.toThrow();
  });
});
