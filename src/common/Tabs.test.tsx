import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Tabs from "./Tabs";

/* ================= MOCKS ================= */

jest.mock("i18next", () => ({
  t: (key: string) => key,
}));

jest.mock("@mui/material", () => {
  const React = require("react");

  return {
    AppBar: ({ children }: any) => <div data-testid="app-bar">{children}</div>,

    Tabs: ({ value, onChange, children }: any) => (
      <div data-testid="mui-tabs">
        <div data-testid="selected-index">{value}</div>
        {React.Children.map(children, (child: any, index: number) =>
          React.cloneElement(child, {
            onClick: () => onChange({}, index),
          }),
        )}
      </div>
    ),

    Tab: ({ label, onClick, id }: any) => (
      <button
        data-testid="mui-tab" // ✅ IMPORTANT FIX
        onClick={onClick}
        id={id}
      >
        {label}
      </button>
    ),
  };
});

/* ================= TESTS ================= */

describe("Tabs Component", () => {
  const mockOnSelectTab = jest.fn();

  const defaultProps = {
    tabs: ["Tab1", "Tab2", "Tab3"],
    selectedTab: "Tab1",
    onSelectTab: mockOnSelectTab,
  };

  const renderComponent = (props = {}) =>
    render(<Tabs {...defaultProps} {...props} />);

  beforeEach(() => {
    mockOnSelectTab.mockClear();
  });

  test("renders correct number of tabs", () => {
    renderComponent();
    expect(screen.getAllByTestId("mui-tab")).toHaveLength(3);
  });

  test("calls onSelectTab when tab clicked", () => {
    renderComponent();
    fireEvent.click(screen.getAllByTestId("mui-tab")[1]);
    expect(mockOnSelectTab).toHaveBeenCalledWith("Tab2");
  });

  test("handles single tab correctly", () => {
    renderComponent({ tabs: ["OnlyTab"], selectedTab: "OnlyTab" });
    expect(screen.getAllByTestId("mui-tab")).toHaveLength(1);
  });

  test("tab id is applied correctly", () => {
    renderComponent();
    expect(screen.getAllByTestId("mui-tab")[0]).toHaveAttribute(
      "id",
      "school-user-tabs",
    );
  });

  test("renders correct tab order", () => {
    renderComponent();
    const tabs = screen.getAllByTestId("mui-tab");

    expect(tabs[0]).toHaveTextContent("Tab1");
    expect(tabs[1]).toHaveTextContent("Tab2");
    expect(tabs[2]).toHaveTextContent("Tab3");
  });

  test("multiple clicks trigger multiple calls", () => {
    renderComponent();
    const tab = screen.getAllByTestId("mui-tab")[1];

    fireEvent.click(tab);
    fireEvent.click(tab);

    expect(mockOnSelectTab).toHaveBeenCalledTimes(2);
  });

  test("handles duplicate tab names safely", () => {
    renderComponent({ tabs: ["A", "A"], selectedTab: "A" });
    expect(screen.getAllByTestId("mui-tab")).toHaveLength(2);
  });

  test("long tab list click works", () => {
    const manyTabs = Array.from({ length: 5 }, (_, i) => `Tab${i}`);
    renderComponent({ tabs: manyTabs, selectedTab: "Tab0" });

    fireEvent.click(screen.getAllByTestId("mui-tab")[4]);
    expect(mockOnSelectTab).toHaveBeenCalledWith("Tab4");
  });

  test("clicking tab after rerender still works", () => {
    const { rerender } = renderComponent();

    rerender(
      <Tabs
        tabs={["Tab1", "Tab2", "Tab3"]}
        selectedTab="Tab2"
        onSelectTab={mockOnSelectTab}
      />,
    );

    fireEvent.click(screen.getAllByTestId("mui-tab")[2]);
    expect(mockOnSelectTab).toHaveBeenCalledWith("Tab3");
  });
  test("defaults selected index to 0 if selectedTab not in tabs", () => {
    renderComponent({ selectedTab: "UnknownTab" });
    expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
  });

  test("selected index matches correct tab", () => {
    renderComponent({ selectedTab: "Tab3" });
    expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
  });

  test("clicking already selected tab still calls onSelectTab", () => {
    renderComponent({ selectedTab: "Tab1" });
    fireEvent.click(screen.getAllByTestId("mui-tab")[0]);
    expect(mockOnSelectTab).toHaveBeenCalledWith("Tab1");
  });

  test("handles empty tabs array gracefully", () => {
    renderComponent({ tabs: [] });
    expect(screen.queryAllByTestId("mui-tab")).toHaveLength(0);
  });

  test("handles empty selectedTab safely", () => {
    renderComponent({ selectedTab: "" });
    expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
  });

  test("selects first occurrence when duplicate tab names exist", () => {
    renderComponent({ tabs: ["A", "B", "A"], selectedTab: "A" });
    expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
  });

  test("clicking second duplicate tab works correctly", () => {
    renderComponent({ tabs: ["A", "B", "A"], selectedTab: "A" });
    fireEvent.click(screen.getAllByTestId("mui-tab")[2]);
    expect(mockOnSelectTab).toHaveBeenCalledWith("A");
  });

  test("rerender with different tabs updates correctly", () => {
    const { rerender } = renderComponent();
    rerender(
      <Tabs
        tabs={["New1", "New2"]}
        selectedTab="New2"
        onSelectTab={mockOnSelectTab}
      />,
    );
    expect(screen.getAllByTestId("mui-tab")).toHaveLength(2);
    expect(screen.getByTestId("selected-index")).toHaveTextContent("1");
  });

  test("does not call onSelectTab on initial render", () => {
    renderComponent();
    expect(mockOnSelectTab).not.toHaveBeenCalled();
  });

  test("handles very large tab list", () => {
    const manyTabs = Array.from({ length: 20 }, (_, i) => `Tab${i}`);
    renderComponent({ tabs: manyTabs, selectedTab: "Tab10" });
    expect(screen.getAllByTestId("mui-tab")).toHaveLength(20);
    expect(screen.getByTestId("selected-index")).toHaveTextContent("10");
  });
  test("clicking all tabs triggers correct sequence", () => {
    renderComponent();

    const tabs = screen.getAllByTestId("mui-tab");

    fireEvent.click(tabs[0]);
    fireEvent.click(tabs[1]);
    fireEvent.click(tabs[2]);

    expect(mockOnSelectTab).toHaveBeenNthCalledWith(1, "Tab1");
    expect(mockOnSelectTab).toHaveBeenNthCalledWith(2, "Tab2");
    expect(mockOnSelectTab).toHaveBeenNthCalledWith(3, "Tab3");
  });

  test("selected index updates correctly after rerender with new selectedTab", () => {
    const { rerender } = renderComponent();

    rerender(
      <Tabs
        tabs={["Tab1", "Tab2", "Tab3"]}
        selectedTab="Tab3"
        onSelectTab={mockOnSelectTab}
      />,
    );

    expect(screen.getByTestId("selected-index")).toHaveTextContent("2");
  });

  test("works correctly when selectedTab is last item", () => {
    renderComponent({ selectedTab: "Tab3" });

    fireEvent.click(screen.getAllByTestId("mui-tab")[2]);

    expect(mockOnSelectTab).toHaveBeenCalledWith("Tab3");
  });

  test("does not crash when tabs contain empty strings", () => {
    renderComponent({ tabs: ["", "", ""], selectedTab: "" });

    expect(screen.getAllByTestId("mui-tab")).toHaveLength(3);
  });

  test("clicking tab after multiple rerenders still works", () => {
    const { rerender } = renderComponent();

    rerender(
      <Tabs
        tabs={["Tab1", "Tab2", "Tab3"]}
        selectedTab="Tab2"
        onSelectTab={mockOnSelectTab}
      />,
    );

    rerender(
      <Tabs
        tabs={["Tab1", "Tab2", "Tab3"]}
        selectedTab="Tab1"
        onSelectTab={mockOnSelectTab}
      />,
    );

    fireEvent.click(screen.getAllByTestId("mui-tab")[1]);

    expect(mockOnSelectTab).toHaveBeenCalledWith("Tab2");
  });

  test("renders correctly when tabs array changes length smaller", () => {
    const { rerender } = renderComponent();

    rerender(
      <Tabs tabs={["Tab1"]} selectedTab="Tab1" onSelectTab={mockOnSelectTab} />,
    );

    expect(screen.getAllByTestId("mui-tab")).toHaveLength(1);
  });

  test("renders correctly when tabs array changes length larger", () => {
    const { rerender } = renderComponent();

    rerender(
      <Tabs
        tabs={["Tab1", "Tab2", "Tab3", "Tab4", "Tab5"]}
        selectedTab="Tab4"
        onSelectTab={mockOnSelectTab}
      />,
    );

    expect(screen.getAllByTestId("mui-tab")).toHaveLength(5);
    expect(screen.getByTestId("selected-index")).toHaveTextContent("3");
  });

  test("callback receives correct value after switching selectedTab externally", () => {
    const { rerender } = renderComponent({ selectedTab: "Tab2" });

    rerender(
      <Tabs
        tabs={["Tab1", "Tab2", "Tab3"]}
        selectedTab="Tab3"
        onSelectTab={mockOnSelectTab}
      />,
    );

    fireEvent.click(screen.getAllByTestId("mui-tab")[0]);

    expect(mockOnSelectTab).toHaveBeenCalledWith("Tab1");
  });

  test("selected index remains 0 when tabs array is reset", () => {
    const { rerender } = renderComponent({ selectedTab: "Tab3" });

    rerender(
      <Tabs
        tabs={["OnlyOne"]}
        selectedTab="OnlyOne"
        onSelectTab={mockOnSelectTab}
      />,
    );

    expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
  });

  test("component renders consistently with same props on rerender", () => {
    const { rerender } = renderComponent();

    rerender(
      <Tabs
        tabs={["Tab1", "Tab2", "Tab3"]}
        selectedTab="Tab1"
        onSelectTab={mockOnSelectTab}
      />,
    );

    expect(screen.getAllByTestId("mui-tab")).toHaveLength(3);
    expect(screen.getByTestId("selected-index")).toHaveTextContent("0");
  });
});
